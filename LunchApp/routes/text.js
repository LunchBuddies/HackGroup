var express = require('express');
var client = require('twilio')('AC5f80a9d16d712b11f6af27e006e51761', 'a29ae5d040fb1ffa437c81ab365a02ae');
var router = express.Router();
var CronJob = require('cron').CronJob;


var TwilioNumber = '+14693400518'; // A number you bought from Twilio and can use for outbound communication

var users = [
    { name: 'Nick',phone: '+16026164854'},
    { name: 'Mandeep',phone: '+17174601902'},
    { name: 'Anurag', phone: '+14802367962'},
    { name: 'Ryan', phone: '+19723658656'}
];

var promptTime = '* * * * * *';

var promptMessage = 'Are you in for lunch? YES or NO';

//basic cron job
new CronJob({
   cronTime: '00 25 01 * * *',
   onTick: function(){
    sendPromptText(users, promptMessage)
   },
   start: true,
   timeZone: 'America/Los_Angeles'
});
//promptMessageJob.start();
//sendPromptText(users,promptMessage),

function sendPromptText(users,promptMessage)
{
   for (counter=0;counter<users.length;counter++)
   {
       //sendText(users[counter].phone,promptMessage)
       console.log(users[counter].phone,promptMessage);
   }
}

function sendText(phoneNumber, message){
    client.sendMessage( {

        to: phoneNumber, // Any number Twilio can deliver to
        from: TwilioNumber, 
        body: message // body of the SMS message

    }, function(err, responseData) { //this function is executed when a response is received from Twilio

        if (!err) { // "err" is an error received during the request, if any

            // "responseData" is a JavaScript object containing data received from Twilio.
            // A sample response from sending an SMS message is here (click "JSON" to see how the data appears in JavaScript):
            // http://www.twilio.com/docs/api/rest/sending-sms#example-1

            console.log(responseData.from); // outputs "+14506667788"
            console.log(responseData.body); // outputs "word to your mother."

        }
        else {
            console.log(err);
        }
    });
}

module.exports = router;