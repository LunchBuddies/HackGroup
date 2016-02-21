//    Declaration Section    //
var express = require('express');
var keys = require ('../Keys');
var client = require('twilio')(keys.TWILIO_ACCOUNT_SID, keys.TWILIO_AUTH_KEY);
var router = express.Router();
var CronJob = require('cron').CronJob;
var database = require('../db');
var TwilioNumber = '+14693400518';

// for Mongo
var MongoClient = require('mongodb').MongoClient;
var mongoose = require('mongoose');
var assert = require('assert');
var Schema = mongoose.Schema;

var userSchema = new Schema({
    name: String,
    phone: String
});

// We are setting prompt time and confirmation time for lunch
var date = new Date();
var testPromptTime = new Date();
var testConfirmTime = new Date();
testPromptTime.setSeconds(0);
testConfirmTime.setSeconds(0);
testPromptTime.setMinutes(date.getMinutes()+ 1);
testConfirmTime.setMinutes(date.getMinutes() + 1);
var PromptTime = ' 20 06 03 * * 0-6';
var ConfirmTime =  '00 01 03 * * 0-6';
console.log('----- Set times: done');


// ------------------------- Message Strings -----------------------------
// These are the base strings for the messages


var promptMessage = 'Are you in for lunch at noon? Text \'YES\' to confirm and we\'ll let you know who else is interested!';
var immediateYesResponse = 'Good call. We\'ll text you at noon to let you know who\'s going';
var immediateNoResponse = 'Aww! We\'ll miss you!';
var cafes = ['Cafe 9',' Cafe 16','Cafe 34','Cafe 36','Cafe 31', 'Cafe 4', 'Cafe 31'];
var onlyOneAttendee = 'Looks like no one else is interested today! Better luck next time.'; //Message which is sent if only one person RSVPs
var joinMessage = 'Thanks for joining!';
var joinFailureMessage = 'Say that again? We didn\'t catch it! Text: Join <Your Name>';


sendText(req.body.From,'Say that again? We didn\'t catch it!', true);   

// User object should contain following properties
// name
// phone
// group - right now, the value coule be just OENGPM
// isConfirmed - default would be false

var userSchema = new Schema ({
    name: String,
    phone: String,
    group: String,
    isGoing: Boolean,
    isConfirmed: Boolean 
});
var user = mongoose.model('user2', userSchema );
console.log('----- Created user 2.0 model: done');

// Cron job that prompts users to come to lunch
new CronJob({
    cronTime: testPromptTime,
    onTick: function(){
        promptCronLogic ();
    },
    start: true,
    timeZone: 'America/Los_Angeles'
});
console.log('----- Start prompt cron: done');

// Cron job that confirms to users at lunch time
new CronJob({
    cronTime: testConfirmTime, //confirmTime
    onTick: function()
    {
        confirmCronLogic();
    },
    start: true,
    timeZone: 'America/Los_Angeles'
});
console.log('----- Start Confirmation cron: done');

// Contains all the logic executed when the PROMPT cron job ticks
function promptCronLogic ()  {
    user.find( function (err, result) {
        console.log('----- fetch users in PromptCron: done');
        for (var i = 0; i < result.length ; i++)
        { 
           sendText(result[i].phone, promptMessage, true)
        }
    });

    
    var conditionsForResetDB = {}
      , updateForResetDB = { isGoing: false }
      , optionsForResetDB = {multi: true } ;

    user.update(conditionsForResetDB, updateForResetDB,  optionsForResetDB, function callback (err, numAffected) {
      
      // numAffected is the number of updated documents
      console.log('---- Reset ' + numAffected.nModified + ' accounts: done');
    });
}

// Contains all the logic executed when the CONFIRM cron job ticks
function confirmCronLogic () {
    console.log('fetch confirmation');
    user.find
    ( function (err, result) 
        {
            generateAllMessages(result);                                  
        }
    );
}

function generateAllMessages(users)
{
    console.log('==================== Begin: generateAllMessages ====================');
    // console.log(users);
     var cafeNumber=randomCafe();
     var messageString;

    for (var i=0;i<users.length;i++)
    {
        var phone=users[i].phone;
        var interestedNames=[];
        messageString = '';
        var message;

        var group = users[i].group;

        console.log ('Phone: ' + phone + ' has group: '+ group + ' and said: '+ users[i].isGoing);

        if(users[i].isGoing)
        {
            for (var j=0;j<users.length;j++)
            {
                if((users[j].isGoing)
                    && (phone.localeCompare(users[j].phone) != 0)
                    && (group.localeCompare(users[j].group)==0)
                   )
                    {
                        interestedNames.push(users[j].name);                        
                    }
            }

             if (interestedNames.length == 1)
            {
                message= interestedNames.join(', ');
            }

          else
          {
            message = [interestedNames.slice(0, -1).join(', '), 
            interestedNames.slice(-1)[0]].join(interestedNames.length 
                < 2 ? '' : ' and ');
          }

        if(message=='')
                {
                    messageString = onlyOneAttendee;
                }
                else
                {
                    messageString = 'Enjoy lunch with '+ message +'. We suggest going to '+ cafeNumber;
                }
        }
        else
        {
            continue;
        }
         console.log('for phone: '+ phone + ' the message is: '+ messageString);         

        //sendText(phone,messageString, true);
        console.log('==================== End: generateAllMessages ====================');
    }
}


// ------------------------- Receiving Texts -----------------------------
// Not sure if this is needed... Twilio doesnt use GET commands
// but probably good to have for completeness
router.get('/', function(req, res) {
      if(new RegExp("prompt").test(req.headers.command)){
       promptCronLogic ();
     }
     else if (new RegExp("confirm").test(req.headers.command)){
       confirmCronLogic();
    };
});

// Post function for calls from Twilio
router.post('/', function(req, res) {
    if (req._body) 
    {
        // TODO: break to logic for each if {...} into its own function
        // to clean up the code
        // 
        // User sends any variation of yes
        if ((new RegExp("YES")).test(req.body.Body.toUpperCase()) 
          || (new RegExp("YEA")).test(req.body.Body.toUpperCase())
          || (new RegExp("YA")).test(req.body.Body.toUpperCase()))
        {

            // Update status of user to 
            var conditionsForUpdateDB = { phone: req.body.From }
              , updateForUpdateDB = { isGoing: true };

            user.update(conditionsForUpdateDB, updateForUpdateDB, function callback (err, numAffected) {
              // numAffected is the number of updated documents
              console.log('updated status for ' + conditionsForUpdateDB.phone)
              // console.log(numAffected);
              sendText(conditionsForUpdateDB.phone, immediateYesResponse, true );
            });

        }

        // User is french
        else if ((new RegExp("OUI")).test(req.body.Body.toUpperCase()))
        {
          sendText(req.body.From,'We dont like the french...', true);
        }

        // User responsed no
        else if ((new RegExp("NO")).test(req.body.Body.toUpperCase()))
        {
            // Nothing should happen here
            console.log('No');

            sendText(req.body.From,immediateNoResponse, true);
        }

        else if ((new RegExp("ADJUST FIRST TEXT TIME: ")).test(req.body.Body.toUpperCase()))
        {
            // Adjust cron job times
            // TODO add logic to break apart times

        }

        else if ((new RegExp("ADJUST SECOND TEXT TIME: ")).test(req.body.Body.toUpperCase()))
        {
            // Adjust cron job times
            // TODO add logic to break apart times
        }

        else if ((new RegExp("JOIN")).test(req.body.Body.toUpperCase()))
        {
            var testBody = req.body.Body;
            var user = GetUser(testBody);
            var keyword = GetKeyword(testBody);

            if(keyword == "JOIN")
            {
                var insertUser = new user ({name:user, phone:req.body.From,group:'OENGPM', isGoing: false, isConfirmed:true });
                insertUser.save (function (err, result) 
                {
                    console.log('Inserted new record with name: '+ user);
                });

                sendText(req.body.From, joinMessage,true); 
            }
            else
            {
                sendText(req.body.From,joinFailureMessage, true);  
            }
        }

        // user sent some random message that didnt include the above
        // TODO - make sure user can send multiple texts to us
        else
        {
            sendText(req.body.From,'Say that again? We didn\'t catch it!', true);   
        }
    }
    // console.log(confirmedAttendees[0].phone);
    // console.log('POST: message received');
    // console.log('------ REQUEST ------');
    // console.log(req);
    // console.log('------ RESPONSE ------');
    // console.log(res);
    // console.log('------ END ------');

});


function GetUser(body)
{
    return (body.split(" ")[1]);    
}

function GetKeyword(body)
{
    return (body.split(" ")[0].toUpperCase());    
}


// Sends a single message to a given phone number
function sendText(phoneNumber, message, retry){
    console.log('==================== Begin: sendText ====================');
    console.log("----- " + message )
    client.sendMessage( {

        to: phoneNumber, // Any number Twilio can deliver to
        from: TwilioNumber, 
        body: message // body of the SMS message

    }, function(err, responseData) { //this function is executed when a response is received from Twilio

        if (!err) { // "err" is an error received during the request, if any

            // console.log(responseData.from + ' ' + responseData.body); // outputs "+14506667788"
            // console.log(responseData.body); // outputs "word to your mother."
            console.log('----- Sent text to ' + responseData.to + ': done')
        }
        else {
            console.log(err);
            // If it was the first time failed, try again
            if (retry)
            {
                sendText (phoneNumber, message, False);
            }
        }
    });
    console.log('==================== End: sendText ====================');
}


function randomCafe (){
    return cafes[getRandomInt(0, cafes.length-1)];
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

module.exports = router;

