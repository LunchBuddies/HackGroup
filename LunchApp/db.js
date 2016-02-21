var express = require('express');
var mongoose = require('mongoose');

console.log ('start db');

mongoose.connect('mongodb://anugup-mongo.westus.cloudapp.azure.com:27017/test');
var db = mongoose.connection;
// var collection = db.collection('documents');
// collection.insert ({John : 10}, function (err, result) {
//     console.log ('db.js: insert into db' );
// });


module.exports = db;
