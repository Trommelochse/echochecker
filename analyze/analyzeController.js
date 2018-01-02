const axios = require('axios');
const lib = require('./lib');

const getResults = function(req, res) {
  const settings = req.query;
  const defaultCampaign = res.locals.defaultCampaign;
  const apiUris = lib.getApiUris(defaultCampaign);
  const promiseStack = lib.getPromiseStack(apiUris);
  axios.all(promiseStack)
    .then(axios.spread((...args) => {
      const campaigns = args.map(campaign => campaign.data);

      campaigns.unshift(defaultCampaign);
      const results = lib.analyzeAll(campaigns, settings);
      results.campaignUrl = defaultCampaign.
        campaign_settings.
        languages[0].url.substr(0, defaultCampaign.
          campaign_settings.
          languages[0].url.length - 3);
      if (settings.raw) {
        res.send(campaigns);
      } else {
        res.render('results', results);
      }
    }))
    .catch(err => res.render('error', {message: err}));
};

module.exports = {
  getResults
}
