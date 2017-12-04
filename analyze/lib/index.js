var axios = require('axios');
var data = require('../../data/');

const analyzeDesktopLink = (str, baseUrl, optInCode) => {
  if (str.indexOf(baseUrl) === 0) {
    let rest = str.substr(baseUrl.length);
    rest = rest[0] === '/' ? rest.substr(1) : rest;
    if (rest === `?action=join&campaign=${optInCode}`) {
      return {pass: true}
    }
    return {err: 'optin'}
  }
  return {err: 'base'}
}

const analyzeMobileLink = (str, baseUrl, optInCode) => {
  if (str.indexOf(baseUrl) === 0) {
    let rest = str.substr(baseUrl.length);
    rest = rest[0] === '/' ? rest.substr(1) : rest;
    if (rest === `?campaign=${optInCode}`) {
      return {pass: true}
    }
    return {err: 'optin'}
  }
  return {err: 'base'}
}

const analyzeNativeLink = (link, optInCode, product) => {
  if (link.txtCampaignID !== optInCode) {
    return {err: 'optin'}
  }
  if (link.ddlShowFeedback !== 'true') {
    return {err: 'feedback'}
  }
  if (link.ddlSuccessCTA !== "GoToCasinoLobby") {
    if (product.indexOf('ca') === -1) {
      return {err: 'lobby'}
    }
    return {pass: true}
  }
  if (link.ddlSuccessCTA !== "GoToSportsbookLobby") {
    if (product !== 'sb') {
      return {err: 'lobby'}
    }
    return {pass: true}
  }
  return {err: 'unknown'}
}

const getOptInResults = (links, settings) => {
  const optInLinks = links.filter(link => link.ddlFunction === 'JoinCampaign');
  const results = [];
  for (let i=0; i<optInLinks.length; i++) {
    const link = optInLinks[i];
    const result = {
      dsk: analyzeDesktopLink(
        link.txtDesktopWebURL,
        settings.brandUrls.webUrl,
        settings.optInCode
      ),
      mob: analyzeMobileLink(
        link.txtMobileWebURL,
        settings.brandUrls.mobUrl,
        settings.optInCode
      ),
      nat: analyzeNativeLink (
        link,
        settings.optInCode,
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

const analyzeAll = (campaigns, settings) => {
  const results = [];
  for (let i=0; i<campaigns.length; i++) {
    const campaign = campaigns[i];
    results.push({
       language: campaign.campaign_language.toLowerCase(),
       result: analyzeCampaign(campaign, settings)});
  }
  return {results};
};


module.exports = {
  getApiUris,
  getPromiseStack,
  analyzeAll
}
