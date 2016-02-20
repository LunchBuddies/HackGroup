var express = require('express');
var router = express.Router();

// Error page when texts are received

router.get('/', function(req, res) {
  res.send('respond with a error');
});

module.exports = router;