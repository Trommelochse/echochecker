var axios = require('axios');

const getLanguageUrls = function (campaign) {
  const urls = campaign.campaign_settings.languages.map(function (item) {
    if (campaign.campaign_language !== item.lang_title) {
      return item.data_url
    }
    else return null
  })
  return urls.filter(url => url)
};

const getPromises = function (arr) {
  const temp = [];
  for (let i=0; i<arr.length; i++) {
    const fun = axios.get(arr[i]);
    temp.push(fun);
  }
  return temp
}

module.exports = {
  getLanguageUrls,
  getPromises
}
