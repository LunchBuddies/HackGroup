var express = require('express'),
	router = express.Router();

// Error page when texts are received

router.get('/', function(req, res) {
  res.send('GET: first route was dow');
});

router.post('/', function(req, res) {
  res.send('POST: first route was down');
});


module.exports = router;