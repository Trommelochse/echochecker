var express = require('express');
var path = require('path');
var hbs = require('express-handlebars');
var mw_validate = require('./middleware/validate.js');
var analyzeController = require('./analyze/analyzeController.js');

var app = express();

app.engine('hbs', hbs({
  extname: 'hbs',
  defaultLayout: 'layout',
  layoutsDir: __dirname + '/views/layouts/'
}));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
app.set('port', process.env.PORT || 3003);

app.use(express.static('public'));
app.use('/analyze', function(req, res, next) {
  mw_validate(req, res, next);
});

app.get("/", function (req, res) {
  res.render('index');
});

app.get("/analyze", function (req, res) {
  analyzeController.getResults(req, res);
});

var listener = app.listen(app.get('port'), function () {
  console.log('App listening on port ' + listener.address().port);
});
