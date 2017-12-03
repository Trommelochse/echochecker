var axios = require('axios');
var lib = require('./lib');

const getResults = function(req, res) {
  const defaultCampaign = res.locals.defaultCampaign;
  const apiUris = lib.getApiUris(defaultCampaign);
  const promiseStack = lib.getPromiseStack(apiUris);

  axios.all(promiseStack)
    .then(axios.spread(function (...args) {
      const campaigns = args.map(campaign => campaign.data);
      campaigns.unshift(defaultCampaign);
      const results = lib.analyzeAll(campaigns);
      res.send(results);
    }))
    .catch(err => res.render('error', {message: err}));
};

module.exports = {
  getResults
}
