var express = require('express'),
    path = require('path'),
    favicon = require('serve-favicon'),
    logger = require('morgan'),
    cookieParser = require('cookie-parser'),
    bodyParser = require('body-parser'),
    mongoose = require('mongoose'),
    glob = require('glob'),
    routes = require('./routes/index'),
    text = require('./routes/text'),
    textError = require('./routes/textError'),
    nconf = require('nconf');

// Grab JSON config files in this order:
//   1. Arguments passed to node
//   2. production.js
//   3. development.js
nconf.argv().file('prod','./config/production.json' ).file('dev','./config/development.json' );


console.log('----- App imports: done');

var app = express();

var env = process.env.NODE_ENV || 'development';
app.locals.ENV = env;
app.locals.ENV_DEVELOPMENT = env == 'development';

console.log('----- Set enviornment variables: done');
// view engine setup

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

console.log('----- Set views: done');

// app.use(favicon(__dirname + '/public/img/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);
app.use('/text', text);
app.use('/textError', textError);

console.log('----- Set routes: done');

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

module.exports = app;

