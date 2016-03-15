var mongoose = require('mongoose'),
	Schema = mongoose.Schema;

var userSchema = new Schema ({
    name: String,
    phone: String,
    group: String,
    isGoing: Boolean,
    isActive: Boolean,
    isInsider: Boolean
});

var user = mongoose.model('user2', userSchema );

console.log('----- Initialize User Collection: done');

module.exports = user;
