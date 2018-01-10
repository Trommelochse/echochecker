const axios = require('axios');
const _ = require('lodash');
const data = require('../../data/');

const analyzeOptInLink = (str, re) => {
  return str.match(re) ? {pass:true} : {err: 'Wrong Link'}
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
  if (product.match(/l?ca/)) {
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
  const regExps = data.getRegExps(settings);
  for (let i=0; i<optInLinks.length; i++) {
    const link = optInLinks[i];
    const result = {
      dsk: analyzeOptInLink(
        link.txtDesktopWebURL.replace(/\s*$/,""),
        regExps.desk
      ),
      mob: analyzeOptInLink(
        link.txtMobileWebURL.replace(/\s*$/,""),
        regExps.mob
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

const getOtherLinks = links => {
  return links.filter(el => el.ddlFunction !== 'JoinCampaign' && el.ddlFunction !== 'OptinCampaign')
    .reduce((acc, el) => {
      if (el.ddlFunction) {
        return acc.concat([el.txtDesktopWebURL, el.txtMobileWebURL])
      } else {
        return acc.concat(el.simpleUrl)
      }
    }, [])
    .filter(el => el.trim() !== '')
    .sort()
    .reverse()
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
  settings.brandRegExps = data.getRegExps(settings);
  const allElements = getAllElements(campaign.body);
  const linkingElements = getLinkingElements(allElements);
  const links = getLinks(linkingElements);
  const optInResults = getOptInResults(links, settings);
  const otherLinks = getOtherLinks(links);
  const result = {
    optInResults,
    otherLinks
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

const getPromiseStack = uris => {
  const prmsStack = [];
  for (let i=0; i<uris.length; i++) {
    const fun = axios.get(uris[i]);
    prmsStack.push(fun);
  }
  return prmsStack
};

const getApiUris = campaign => {
  const urls = campaign.campaign_settings.languages.map( item => {
    if (campaign.campaign_language !== item.lang_title) {
      if (item.lang_title.match(/(en|sv|no|fi|da|is)/i)) {
        console.log(item.lang_title)
        return item.data_url
      } else {
        return null
      }
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
