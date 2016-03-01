var express = require('express');
var mongoose = require('mongoose');



mongoose.connect('mongodb://anugup-mongo.westus.cloudapp.azure.com:27018/test');
var db = mongoose.connection;
// var collection = db.collection('documents');
// collection.insert ({John : 10}, function (err, result) {
//     console.log ('db.js: insert into db' );
// });
console.log('----- Load DB: done');

module.exports = db;
