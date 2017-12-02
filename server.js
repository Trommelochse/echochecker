var express = require('express');
var path = require('path');
var hbs = require('express-handlebars');

var app = express();

app.engine('hbs', hbs({extname: 'hbs', defaultLayout: 'layout', layoutsDir: __dirname + '/views/layouts/'}));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
app.set('port', 3003);

app.use(express.static('public'));

app.get("/", function (req, res) {
  res.render('index', {title: 'Echo Campaign QA tool'});
});


// listen for reqs :)
var listener = app.listen(app.get('port'), function () {
  console.log('App listening on port ' + listener.address().port);
});
