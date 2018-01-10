var axios = require('axios');

module.exports = function validateCampaign (req, res, next) {
  const q = req.query;
  if (q.echoCampaignId && q.optInCode) {
    let url = `https://${q.subdomain + q.brand + q.topdomain}/api/data/${q.echoCampaignId}/${q.defaultLanguage}`;
    axios.get(url)
      .then(response => {
        res.locals.defaultCampaign = response.data;
        if (response.status != 200) {
          res.render('error', {
            message: 'Seems like your inputs were not correct',
            buttonText: 'Understood!',
            buttonPath: '/'
          });
        }
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
