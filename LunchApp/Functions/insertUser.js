var express = require('express'),
    user = require('../Models/user'),
    sendText = require('./sendText'),
    strings = require ('../Resources/strings'),
    logHistoryEvent = require ('../Functions/logHistoryEvent');

module.exports = function  (_name, _phone, _group) 
{
    console.log ('insert user');
    var insertUser = new user ({
        name:_name, 
        phone:_phone,
        group:_group.toUpperCase(), 
        isGoing: false,
        isActive: true
    });
    console.log(insertUser);
    insertUser.save (function (err, result) 
    {
        if (!err){
            console.log('Inserted new record with name: '+ _name);
            sendText(_phone, strings.joinMessage); 
            
            logHistoryEvent ('Join', _phone, {name:_name});
            return;
        }
        else
        {
            sendText(_phone, strings.joinFailureMessage); 
            logHistoryEvent ('Error','', err); 
        }
    });
}