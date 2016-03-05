var mongoose = require('mongoose'),
	Schema = mongoose.Schema;

var HistorySchema = new Schema ({
    time: Date,
    event: {type: String, enum: ['Error', 'ReceiveText', 'SendText', 'Join', 'Stop','CreateGroup','DeleteGroup', 'Start', 'Leave']},
    phone: String,
    params: Object
});

var historyEvent = mongoose.model('EventLog', HistorySchema );

console.log('----- Initialize History Collection: done');

module.exports = historyEvent;