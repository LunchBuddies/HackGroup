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

var confirmedAttendees = [];

var promptTime = '00 02 03 * * 0-6';
var confirmationTime = '00 04 03 * * 0-6'

var promptMessage = 'Are you in for lunch? YES or NO';
var confirmationMessage = 'Confirmed!';

//basic cron job
new CronJob({
   cronTime: promptTime,
   onTick: function(){
    sendPromptText(users, promptMessage)
   },
   start: true,
   timeZone: 'America/Los_Angeles'
});

new CronJob({
   cronTime: confirmationTime,
   onTick: function(){
    sendConfirmationText(confirmedAttendees, confirmationMessage)
   },
   start: true,
   timeZone: 'America/Los_Angeles'
});

// Sends the text to prompt the users.
function sendPromptText(users,message)
{
   for (counter=0;counter<users.length;counter++)
   {
       sendText(users[counter].phone,message)
       // console.log(users[counter].phone,promptMessage);
   }
}

function sendConfirmationText(confirmedAttendees, message)
{
   for (counter=0;counter<confirmedAttendees.length;counter++)
   {
       sendText(confirmedAttendees[counter].phone,message)
       // console.log(users[counter].phone,promptMessage);
   }

}

// ------------------------- Receiving Texts -----------------------------
// Not sure if this is needed... Twilio doesnt use GET commands
// but probably good to have for completeness
router.get('/', function(req, res) {
  console.log('GET: message received');
});

// Post function for calls from Twilio
router.post('/', function(req, res) {
    if (req._body) 
    {
        if ((new RegExp("YES")).test(req.body.Body.toUpperCase()))
        {
            // User responded yes to text message
            // TODO: Add user to lunch list
            console.log('Yes: ' + req.body.From);
            
            var data = {phone:req.body.From};
            confirmedAttendees.push(data);
        }
        else
        {
            // Nothing should happen here
            console.log('No');
            sendText(req.body.From,req.body.Body);
        }
    }
    console.log(confirmedAttendees[0].phone);
    // console.log('POST: message received');
    // console.log('------ REQUEST ------');
    // console.log(req);
    // console.log('------ RESPONSE ------');
    // console.log(res);
    // console.log('------ END ------');
    
});

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