var express = require('express'),
	history = require ('../History');

module.exports = function (_eventType, _phone, _params) {
    
    var historyEventToSend = new history ({
        time: new Date(),
        event: _eventType,
        phone: _phone, 
        params: _params
    });

    historyEventToSend.save(function(err, thor) {
        if (err) 
        {
            logHistoryEvent ('Error', '',err);
            return console.error(err);
        }
        console.dir("----- logged 1 historical event");
    });
}