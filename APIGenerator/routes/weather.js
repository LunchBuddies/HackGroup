var express = require('express');
var Forecast = require('forecast.io');
var util = require('util');
var router = express.Router();

// Probably not the most secure to save key here...
process.env.FORECAST_API_KEY = '718c660a33c66f01a02342befd0f3d2e';

/* GET users listing. */
// router.get('/', function(req, res) {
//   res.send('GET: respond with the forecast');
// });

var options = {
  APIKey: process.env.FORECAST_API_KEY
},
forecast = new Forecast(options);

router.get('/', function(request, response) {

	// Call forecast.io GET 
	forecast.get(request.query.lat, request.query.long, function (err, res, data) {
	  if (err) throw err;
	  // console.log (data);
	  // console.log('res: ' + util.inspect(res));
	  // console.log('data: ' + util.inspect(data));


	  response.send(data);
	});
});

router.post('/', function(request, response) {

	response.send('Good to go');
});
module.exports = router;
