var express = require('express');
var client = require('twilio')('AC5f80a9d16d712b11f6af27e006e51761', 'a29ae5d040fb1ffa437c81ab365a02ae');
var router = express.Router();
var CronJob = require('cron').CronJob;

// var number = '+19723658656';
var numbers = [ '+17174601902', '+19723658656', '+16026164854', '+14802367962']

//basic cron job
new CronJob('00 25 23 * * 1-5', sendPromptText() 
    , null, true, 'America/Los_Angeles');


function sendPromptText(){
    console.log('Executing Send Prompt Text'); //The function will send the initial text message

//     for (i = 0; i < numbers.length; i++) { 
//     console.log ('Send to ' + numbers[i]);
//     client.sendMessage( {

//         to: numbers[i], // Any number Twilio can deliver to
//         from: '+14693400518', // A number you bought from Twilio and can use for outbound communication
//         body: 'Pepperoni Pizza is the best!' // body of the SMS message

//     }, function(err, responseData) { //this function is executed when a response is received from Twilio

//         if (!err) { // "err" is an error received during the request, if any

//             // "responseData" is a JavaScript object containing data received from Twilio.
//             // A sample response from sending an SMS message is here (click "JSON" to see how the data appears in JavaScript):
//             // http://www.twilio.com/docs/api/rest/sending-sms#example-1

//             console.log(responseData.from); // outputs "+14506667788"
//             console.log(responseData.body); // outputs "word to your mother."

//         }
//         else {
//             console.log(err);
//         }
//     });
// }
}

module.exports = router;