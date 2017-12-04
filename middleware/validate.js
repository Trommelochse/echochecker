var axios = require('axios');

module.exports = function (req, res, next) {
  const q = req.query;
  if (q.echoCampaignId && q.optInCode) {
    const url = `https://${q.subdomain + q.brand + q.topdomain}/api/data/${q.echoCampaignId}`;
    axios.get(url)
      .then(response => {
        res.locals.defaultCampaign = response.data;
        next();
      })
      .catch(err => {
        res.render('error', {
          message: 'Seems like your inputs were not correct',
          buttonText: 'Understood!',
          buttonPath: '/'
        });
      });
  }
  else {
    res.render('error', {
      message: 'Please fill in all requried fields :)',
      buttonText: 'Got it!',
      buttonPath: '/'
    });
  }
}
