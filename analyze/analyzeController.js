var axios = require('axios');
var lib = require('./lib');

function axiosFromUrls (urls) {
  const temp = [];
  for (let url in urls) {
    temp.push(axios.get(url));
  }
  return temp
}

const getResults = function(req, res) {
  const defaultCampaign = res.locals.defaultCampaign;
  const languageUrls = lib.getLanguageUrls(defaultCampaign);
  const promises = lib.getPromises(languageUrls);

  axios.all(promises)
    .then(axios.spread(function (...args) {
      const campaigns = args.map(campaign => campaign.data);
      campaigns.unshift(defaultCampaign);
      res.send(campaigns);
    }))
    .catch(err => res.render('error', {message: err}))
}

module.exports = {
  getResults
}
