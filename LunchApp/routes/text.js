//    Declaration Section    //
var express = require('express');
var keys = require ('../Keys');
var history = require ('../History');
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

// var userSchema = new Schema({
//     name: String,
//     phone: String
// });

// We are setting prompt time and confirmation time for lunch
var date = new Date();
var testPromptTime = new Date();
var testConfirmTime = new Date();
testPromptTime.setSeconds(0);
testConfirmTime.setSeconds(0);
testPromptTime.setMinutes(date.getMinutes()+ 1);
testConfirmTime.setMinutes(date.getMinutes() + 2);
var PromptTime = ' 00 00 13 * * 0-6';
var ConfirmTime =  '00 30 13 * * 0-6';

console.log('----- Set times: done');


// ------------------------- Message Strings -----------------------------
// These are the base strings for the messages

//Signature for the end of our messages
var defaultSignature = '\n - TheLunchBuddies'

//Message which prompts users to respond.
var promptMessages = [
    "Interested in lunch? Text \'YES\' by noon and we\'ll let you know who else is interested. ",
    "Free for lunch? Text \'YES\' by noon and we\'ll let you know who else is interested. ",
    "Free for lunch? Come on, you know you want to. Text \'YES\' by noon and we\'ll let you know who else is interested. "
]

//Message which sends right after a user confirms.
var immediateYesResponsesMessages = [
    "You've never made a better decision. Ever. Good call. Seriously. We\'ll text you at noon to let you know who\'s going.",
    "Got it! We\'ll text you at noon to let you know who\'s going.",
    "Lunch, lunch, lunchy-lunch lunch. We\'ll text you at noon to let you know who\'s going."
]

//Message which 
var immediateNoResponsesMessages = [
    "Aww! We\'ll miss you."
]

//Message which will be sent if there is only one attendee
var onlyOneAttendeeMessages = [
    "Looks like no one else is interested today! Better luck next time."    
]

var cafes = ['Cafe 9',' Cafe 16','Cafe 34','Cafe 36','Cafe 31', 'Cafe 4', 'Cafe 31'];

//Generates a message from an array of messages and appends the default signature
function generateMessageWithSignature(messageArray, signature){
    if (signature = 'undefined'){
        signature = defaultSignature;
    }
    return messageArray[getRandomInt(0, messageArray.length-1)] + signature;
}

//Given a list of names and a suggestedCafe to insert, generages a confirmation message with a signature.
//If no signature is provided, the default signature will be used. 
function generateConfirmationMessage(namesString, suggestedCafe, signature){
    if (signature = 'undefined'){
        signature = defaultSignature;
    }
    var optionsList = [
        namesString + ' are free! We suggest ' + suggestedCafe + '. Have fun you crazy kids!',
        'Have the time of your life with ' + namesString + '. We\'ve heard good things about ' + suggestedCafe + '...',
        'Enjoy lunch with ' + namesString + '. Might we suggest ' + suggestedCafe + '?',
        namesString + ' said they would absolutely love to go. We suggest ' + suggestedCafe + '.'
    ]
    var randomNumber = getRandomInt(0, optionsList.length-1);
    return optionsList[randomNumber] + signature;
}

var joinMessage = 'Thanks for joining!';
var joinFailureMessage = 'Say that again? We didn\'t catch it! Text: Join <Your Name> to subscribe';
var stopMessage = 'Sorry to see you go! Hope you will reconsider';
var stopFailureMessage = 'Say that again? We didn\'t catch it! Text: STOP to unsubscribe';

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


function logHistoryEvent (_eventType, _params) {
    
    var historyEventToSend = new history ({
        time: new Date(),
        event: _eventType,
        params: _params
    });

    historyEventToSend.save(function(err, thor) {
        if (err) 
        {
            logHistoryEvent ('Error', err);
            return console.error(err);
        }
        console.dir("----- logged 1 historical event");
    });
}

// Contains all the logic executed when the PROMPT cron job ticks
function promptCronLogic ()  {
    user.find( function (err, result) {
        if (!err) 
        { 

            console.log('----- fetch users in PromptCron: done');
            for (var i = 0; i < result.length ; i++)
            { 
                // console.log(result[i].phone);
                sendText(result[i].phone, generateMessageWithSignature(promptMessages), true)
            }
            //console.log(result);
        }
        else
        {
            logHistoryEvent ('Error', err);
        }
    });
    
    var conditionsForResetDB = {}
      , updateForResetDB = { isGoing: false }
      , optionsForResetDB = {multi: true } ;

    user.update(conditionsForResetDB, updateForResetDB,  optionsForResetDB, function callback (err, numAffected) {

        if (!err)
        {
            // numAffected is the number of updated documents
            console.log('---- Reset ' + numAffected.nModified + ' accounts: done'); 
        }  
        else
        {
            logHistoryEvent ('Error', err);
        }  
            
      // numAffected is the number of updated documents
      console.log('---- Reset ' + numAffected.nModified + ' accounts: done');

    });
};

// Contains all the logic executed when the CONFIRM cron job ticks
function confirmCronLogic () {
    console.log('fetch confirmation');
    user.find
    ( function (err, result) 
        {

            if (!err)
            {
                generateAllMessages(result);      
            }
            else
            {
                logHistoryEvent ('Error', err);
            }
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
            //A list of names seperated by commas, and with an 'and', if appropriate
            formattedNames = [interestedNames.slice(0, -1).join(', '), 
            interestedNames.slice(-1)[0]].join(interestedNames.length 
                < 2 ? '' : ' and ');
          }

        if(formattedNames=='')
                {
                    messageString = generateMessageWithSignature(onlyOneAttendeeMessages);
                }
                else
                {
                    messageString = generateConfirmationMessage(formattedNames, cafeNumber);
                }
        }
        else
        {
            continue;
        }
         console.log('for phone: '+ phone + ' the message is: '+ messageString);         

        sendText(phone,messageString, true);
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
        // Log every text we get
        logHistoryEvent ('ReceiveText', {phoneNumber: req.body.From, message: req.body.Body});


        // User sends any variation of yes
        if ((new RegExp("YES")).test(req.body.Body.toUpperCase()))
        {

            // Update status of user to 
            var conditionsForUpdateDB = { phone: req.body.From }
              , updateForUpdateDB = { isGoing: true };

            user.update(conditionsForUpdateDB, updateForUpdateDB, function callback (err, numAffected) {
              // numAffected is the number of updated documents
              console.log('updated status for ' + conditionsForUpdateDB.phone)
              // console.log(numAffected);

              sendText(conditionsForUpdateDB.phone,generateMessageWithSignature(immediateYesResponsesMessages), true );
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
            sendText(req.body.From,generateMessageWithSignature(immediateNoResponsesMessages), true);
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
            console.log (req.body.Body);
            var testBody = req.body.Body;
            var _user123 = GetUser(testBody);
            var keyword = GetKeyword(testBody);
            console.log ('user' + _user123);
            console.log ('keyword' + keyword);
            if(keyword == "JOIN")
            {   
                var insertUser = new user ({
                    name:_user123, 
                    phone:req.body.From,
                    group:'OENGPM', 
                    isGoing: false
                });
                console.log(insertUser);
                insertUser.save (function (err, result) 
                {
                    if (!err){
                        console.log('Inserted new record with name: '+ _user123);
                        sendText(req.body.From, joinMessage,true); 
                    }
                    else
                    {
                        sendText(req.body.From,joinFailureMessage, true);  
                    }
                });
            }
        }

        // else if ((new RegExp("CLOSE")).test(req.body.Body.toUpperCase()))
        // {
            
        //     var checkStop = req.body.Body.substr(0,3).toUpperCase();

        //     if(checkStop == "CLOSE")
        //     {

                

        //         user.deleteOne ({phone: req.body.From}, function (err, response) {
        //             console.log ('remove user');
        //         });
                
        //         // sendText(req.body.From, stopMessage,true); 
        //     }
        //     // else
        //     // {
        //     //     sendText(req.body.From,stopFailureMessage, true);  
        //     // }
        // }

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
            logHistoryEvent ('SendText', {phoneNumber: responseData.to, message: message});
        }
        else {
            console.log(err);
            // If it was the first time failed, try again
            logHistoryEvent ('Error', err);

            // if (retry)
            // {
            //     sendText (phoneNumber, message, false);
            // }
        }
    });
    console.log('==================== End: sendText ====================');
}

//
function randomCafe (){
    return cafes[getRandomInt(0, cafes.length-1)];
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

module.exports = router;

