var axios = require('axios');
var _ = require('lodash');
var data = require('../../data/');

const analyzeDesktopLink = (str, baseUrl, optInCode) => {
  if (str.indexOf(baseUrl) === 0) {
    let rest = str.substr(baseUrl.length);
    rest = rest[0] === '/' ? rest.substr(1) : rest;
    if (rest === `?action=join&campaign=${optInCode}`) {
      return {pass: true}
    }
    return {err: 'Opt in code is wrong'}
  }
  return {err: 'URL is wrong'}
}

const analyzeMobileLink = (str, baseUrl, optInCode) => {
  if (str.indexOf(baseUrl) === 0) {
    let rest = str.substr(baseUrl.length);
    rest = rest[0] === '/' ? rest.substr(1) : rest;
    const params = baseUrl.indexOf('nordicbet.dk') === -1 ?
      `?campaign=${optInCode}` : `?modalroute=join-campaign/${optInCode}`;
    if (rest === params) {
      return {pass: true}
    }
    return {err: 'Opt in code is wrong'}
  }
  return {err: 'URL is wrong'}
}

const analyzeNativeLink = (link, optInCode, product) => {
  if (link.ddlFunction === 'OptinCampaign') {
    return {err: 'Use JoinCampaign function'}
  }
  if (link.txtCampaignID.toLowerCase() !== optInCode.toLowerCase()) {
    return {err: 'Opt in code is wrong'}
  }
  if (link.ddlShowFeedback !== 'true') {
    return {err: 'Use Show Feedback'}
  }
  if (product === 'ca' || product === 'lca') {
    if (link.ddlSuccessCTA === "GoToCasinoLobby")  {
      return {pass: true}
    }
    if (link.ddlSuccessCTA === "GoToLobby" && link.ddlLobby_successCTA === 'casino')  {
      return {pass: true}
    }
    return {err: 'Wrong Lobby on success'}
  }
  if (product === 'sb') {
    if (link.ddlSuccessCTA === "GoToLobby" && link.ddlLobby_successCTA === 'sportsbook') {
      return {pass: true}
    }
    return {err: 'Wrong Lobby on success'}
  }
  return {err: 'Unknown error'}
}

const getOptInResults = (links, settings) => {
  const optInLinks = links.filter(link =>
    link.ddlFunction === 'JoinCampaign' || link.ddlFunction === 'OptinCampaign');
  const results = [];
  for (let i=0; i<optInLinks.length; i++) {
    const link = optInLinks[i];
    const result = {
      dsk: analyzeDesktopLink(
        link.txtDesktopWebURL.replace(/\s*$/,""),
        settings.brandUrls.webUrl,
        settings.optInCode
      ),
      mob: analyzeMobileLink(
        link.txtMobileWebURL.replace(/\s*$/,""),
        settings.brandUrls.mobUrl,
        settings.optInCode
      ),
      nat: analyzeNativeLink (
        link,
        settings.optInCode.replace(/\s*$/,""),
        settings.product
      )
    };
    results.push(result);
  }
  return results;
}

const getLinks = elements => {
  return elements.map(element => {
    const str = element.settings.hyperlink_url ||
      element.settings[0].hyperlink_url;
    if (str.indexOf('ddlFunction') !== -1) {
      return JSON.parse(str)
    }
    return {simpleLink: true, simpleUrl: str}
  })
};

const getLinkingElements = elements => {
  let temp = elements.filter(element => {
    if (!element.settings.length) {
      const url = element.settings.hyperlink_url;
      return url && url !== '#'
    } else {
      const url = element.settings[0].hyperlink_url;
      return url && url !== '#'
    }
  });
  return temp
};

const getAllElements = rows => {
  let temp = [];
  for (let i=0; i<rows.length; i++) {
    const row = rows[i];
    for (let j=0; j<row.columns.length; j++) {
      const elements = row.columns[j].elements;
      for (let k=0; k<elements.length; k++) {
        temp.push(elements[k]);
      }
    }
  }
  return temp
}

const analyzeCampaign = (campaign, settings) => {
  settings.language = campaign.campaign_language.toLowerCase();
  settings.brandUrls = data.getBrandUrls(settings);
  const allElements = getAllElements(campaign.body);
  const linkingElements = getLinkingElements(allElements);
  const links = getLinks(linkingElements);
  const optInResults = getOptInResults(links, settings);
  const result = {
    optInResults
  };
  return result
};

const getSummary = results => {
  const warnings = [];
  const optInsPerLanguage = [];
  let countTotal = 0;
  let countPass = 0;
  let countErr = 0;
  let countWarn = 0;

  for (let i=0; i<results.length; i++) {
    const result = results[i];
    const optInResults = result.result.optInResults;
    for (let j=0; j< optInResults.length; j++) {
      const current = optInResults[j];
      for (device in current) {
        countTotal++;
        if (current[device].pass) countPass++
        if (current[device].err) countErr++
      }
    }
    optInsPerLanguage.push(optInResults.length);
  }
  // check for warnings
  if (_.uniq(optInsPerLanguage).length !== 1) {
    warnings.push('Some of your languages have more opt ins than others.')
  }

  console.log(warnings);

  return {
    countTotal,
    countPass,
    countErr,
    warnings,
    passed: countTotal === countPass
  }

}

const analyzeAll = (campaigns, settings) => {
  const results = [];
  for (let i=0; i<campaigns.length; i++) {
    const campaign = campaigns[i];
    results.push({
       language: campaign.campaign_language.toLowerCase(),
       result: analyzeCampaign(campaign, settings)});
  }
  const summary = getSummary(results);
  return {results, summary};
};

const getPromiseStack = arr => {
  const temp = [];
  for (let i=0; i<arr.length; i++) {
    const fun = axios.get(arr[i]);
    temp.push(fun);
  }
  return temp
};

const getApiUris = campaign => {
  const urls = campaign.campaign_settings.languages.map( item => {
    if (campaign.campaign_language !== item.lang_title) {
      return item.data_url
    }
    else return null
  })
  return urls.filter(url => url)
};

module.exports = {
  getApiUris,
  getPromiseStack,
  analyzeAll
}
