var express = require('express');
var mongoose = require('mongoose');
var nconf = require('nconf');

nconf.file('prod','./config/production.json' ).file('dev','./config/development.json' );

// 
// Setup nconf to use (in-order): 
//   1. Command-line arguments 
//   2. Environment variables 
//   3. A file located at 'path/to/config.json' 
// 

// console.log("mongodb://" + nconf.get('db') 
// 	+ ":" 
// 	+ nconf.get('port') 
// 	+ "/" 
// 	+ nconf.get('table'));
mongoose.connect("mongodb://" + nconf.get('db') 
	+ ":" 
	+ nconf.get('port') 
	+ "/" 
	+ nconf.get('table'));


var db = mongoose.connection;
// var collection = db.collection('documents');
// collection.insert ({John : 10}, function (err, result) {
//     console.log ('db.js: insert into db' );
// });
console.log('----- Load DB at ' + nconf.get('db') 
	+ ":" 
	+ nconf.get('port') 
	+ "/" 
	+ nconf.get('table') + ': done');

module.exports = db;
