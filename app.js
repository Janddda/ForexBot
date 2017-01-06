var express = require('express');
var app = express();
var path = require('path');

// Oanda Access Information
var domain = 'stream-fxpractice.oanda.com';
var access_token = 'e27c1e3312c773948a0621a41abb91fe-17748f9960f7da53658a0dd9ee3f3434';
var account_id = '4489830';
var instruments = "EUR_USD%2CUSD_CAD";

app.get('/', function(req, res) {
  res.sendFile(path.join(__dirname + '/index.html'));
});








// -- REST Routes -- //

app.get('/candles', function(req, res) {

});

// -- END REST Routes -- //

app.use(express.static('public'));

app.listen(3000, function () {
  console.log('Listening on port 3000');
});
