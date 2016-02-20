var express = require('express');
var client = require('twilio')('AC5f80a9d16d712b11f6af27e006e51761', 'a29ae5d040fb1ffa437c81ab365a02ae');
var router = express.Router();
var CronJob = require('cron').CronJob;

var users = [
    { name: 'Nick',phone: '+16026164854'},
    { name: 'Mandeep',phone: '+17174601902'},
    { name: 'Anurag', phone: '+14802367962'},
    { name: 'Ryan', phone: '+1972}3658656'}
];

var promptTime = '00 23 00 * * 1-7';


var promptMessage = 'Are you in for lunch? YES or NO'


//basic cron job
new CronJob(
    {
    cronTime: promptTime,
    onTick: sendPromptText, 
    start: true,
    timeZone: 'America/Los_Angeles'}
    );


function sendPromptText(){
    console.log(users[3].name); //The function will send the initial text message

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