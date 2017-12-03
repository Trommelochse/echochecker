var axios = require('axios');

const getOptInLinks = function (links) {
  return links.filter(link => link.ddlFunction === 'JoinCampaign')
}

const getLinks = function (elements) {
  return elements.map(element => {
    const str = element.settings.hyperlink_url ||
    element.settings[0].hyperlink_url;
    if (str.indexOf('ddlFunction') !== -1) {
      return JSON.parse(str)
    }
    return {simpleLink: true, simpleUrl: str}
  })
};

const getLinkingElements = function (elements) {
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

const getAllElements = function (rows) {
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

const analyzeCampaign = function (campaign) {
  const result = {language: campaign.campaign_language};
  const allElements = getAllElements(campaign.body);
  const linkingElements = getLinkingElements(allElements);
  const links = getLinks(linkingElements);
  const optInLinks = getOptInLinks(links);
  return optInLinks
};

const getPromiseStack = function (arr) {
  const temp = [];
  for (let i=0; i<arr.length; i++) {
    const fun = axios.get(arr[i]);
    temp.push(fun);
  }
  return temp
};
const getApiUris = function (campaign) {
  const urls = campaign.campaign_settings.languages.map(function (item) {
    if (campaign.campaign_language !== item.lang_title) {
      return item.data_url
    }
    else return null
  })
  return urls.filter(url => url)
};
const analyzeAll = function (campaigns) {
  const results = {};
  for (let i=0; i<campaigns.length; i++) {
    const campaign = campaigns[i];
    results[campaign.campaign_language] = analyzeCampaign(campaign);
  }
  return results;
};


module.exports = {
  getApiUris,
  getPromiseStack,
  analyzeAll
}
