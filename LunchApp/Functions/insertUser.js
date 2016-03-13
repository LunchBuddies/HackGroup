var express = require('express'),
    user = require('../Models/user'),
    sendText = require('./sendText'),
    strings = require ('../Resources/strings'),
    logHistoryEvent = require ('../Functions/logHistoryEvent');


function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

module.exports = function  (_name, _phone, _group) 
{
     var date = new Date();
    var current_time = date.toLocaleTimeString();
    var current_hour = current_time.split(":")[0];
    var AMorPM = current_time.split(" ")[1];

    console.log("The hour is: " + current_hour);
    console.log("The AMorPM is: " + AMorPM);


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

             if(current_hour == 9 && AMorPM == "PM")
            {
               sendText(_phone,strings.immediateYesResponsesMessages[getRandomInt(0, strings.immediateYesResponsesMessages.length-1)]);

            }
            
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