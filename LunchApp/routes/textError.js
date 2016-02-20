var express = require('express');
var router = express.Router();

// Error page when texts are received

router.get('/', function(req, res) {
  res.send('GET: espond with a error');
});

router.post('/', function(req, res) {
  res.send('POST: respond with a error');
});

module.exports = router;