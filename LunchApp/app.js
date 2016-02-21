

var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
//var MongoClient = require('mongodb').MongoClient;
var mongoose = require('mongoose');

var routes = require('./routes/index');
var user = require('./routes/user');
var text = require('./routes/text');
var textError = require('./routes/textError');
// var init = require('./routes/init');
// var runner = require('./routes/runner');

var app = express();

var env = process.env.NODE_ENV || 'development';
app.locals.ENV = env;
app.locals.ENV_DEVELOPMENT = env == 'development';


mongoose.connect('mongodb://anugup-mongo.westus.cloudapp.azure.com:27017/test');
var db = mongoose.connection;
var collection = db.collection('documents');
collection.insert ({Ryan : 10}, function (err, result) {
    console.log ('insert into db' );
});


//connect to db running on local box
// var url = 'mongodb://anugup-mongo.westus.cloudapp.azure.com:27017/test';
// MongoClient.connect(url, function(err, db) {
//   assert.equal(null, err);
//   console.log("Connected correctly to server."
// )};

// var db = connect (...);
  
  // var insertDocuments = function(db, callback) {
  //     // Get the documents collection
  //     console.log('1');
  //     var collection = db.collection('documents');

  //     console.log('2');
  //     // Insert some documents
  //     collection.insert([
  //       {b : 1}, {b : 2}, {b : 3}
  //     ], function(err, result) {
        
  //       assert.equal(err, null);
  //       assert.equal(3, result.result.n);
  //       assert.equal(3, result.ops.length);
  //       console.log("Inserted 3 document into the document collection");
  //       callback(result);
  //     });
  //   }
  //  insertDocuments(db, function() {
  //    db.close();
  //  });
  //Not sure why it closes connection here... 
  //db.close();
// });

// view engine setup

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// app.use(favicon(__dirname + '/public/img/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);
app.use('/user', user);
app.use('/text', text);
app.use('/textError', textError);

/// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

/// error handlers

// development error handler
// will print stacktrace

if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err,
            title: 'error'
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {},
        title: 'error'
    });
});

module.exports = db;
module.exports = app;

