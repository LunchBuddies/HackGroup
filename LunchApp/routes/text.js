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
// var MongoClient = require('mongodb').MongoClient;
var mongoose = require('mongoose');
var assert = require('assert');
var Schema = mongoose.Schema;

// We are setting prompt time and confirmation time for lunch
var date = new Date();
var testPromptTime = new Date();
var testConfirmTime = new Date();
testPromptTime.setSeconds(0);
testConfirmTime.setSeconds(0);
//testPromptTime.setSeconds(date.getSeconds()+ 5);
testPromptTime.setMinutes(date.getMinutes()+ 1);
testConfirmTime.setMinutes(date.getMinutes() + 2);
var PromptTime = '00 00 11 * * 1-5';
var ConfirmTime =  '00 00 12 * * 1-5';

console.log('----- Set times: done');


// ------------------------- Message Strings -----------------------------
// These are the base strings for the messages

//Signature for the end of our messages
var defaultSignature = '\n - TheLunchBuddies'

//Message which prompts users to respond.
var promptMessages = [
    "Interested in lunch? Text \'YES\' by noon and we\'ll let you know who else is interested.",
    "Free for lunch? Text \'YES\' by noon and we\'ll let you know who else is interested.",
    "Free for lunch? Come on, you know you want to. Text \'YES\' by noon and we\'ll let you know who else is interested."
]

//Message which sends right after a user confirms.
var immediateYesResponsesMessages = [
    "You've never made a better decision. Ever. Good call. Seriously. We\'ll text you at noon to let you know who\'s going.",
    "Got it! We\'ll text you at noon to let you know who\'s going.",
    "Lunch, lunch, lunchy-lunch lunch. We\'ll text you at noon to let you know who\'s going."
]

//Message which 
var immediateNoResponsesMessages = [
    "Aww! We\'ll miss you. If you change your mind, don't worry! Just text \'YES\' before noon and we will take care of everything else!"
]

//Message which will be sent if there is only one attendee
var onlyOneAttendeeMessages = [
    "Looks like no one else is interested today! Better luck next time."    
]

//Generates a message from an array of messages and appends the default signature
function generateMessageWithSignature(messageArray, signature){
    console.log("generateMessageWithSignature has message as: "+ messageArray);
    
    if (signature = 'undefined'){
        signature = defaultSignature;
    }

    var text = messageArray[getRandomInt(0, messageArray.length-1)] + signature;

    console.log("the text value in signature is: "+ text);

    return text;
}

//Given a list of names and a suggestedCafe to insert, generages a confirmation message with a signature.
//If no signature is provided, the default signature will be used. 
function generateConfirmationMessage(namesString, suggestedCafe, signature){
    if (signature = 'undefined'){
        signature = defaultSignature;
    }

    if(suggestedCafe != '')
    {
        var optionsList = [
            //namesString + ' are free! We suggest ' + suggestedCafe + '. Have fun you crazy kids!',
            'Have the time of your life with ' + namesString + '. We\'ve heard good things about ' + suggestedCafe + '...',
            'Enjoy lunch with ' + namesString + '. Might we suggest ' + suggestedCafe + '?',
            namesString + ' said they would absolutely love to go. We suggest ' + suggestedCafe + '.'
        ]
        var randomNumber = getRandomInt(0, optionsList.length-1);
        return optionsList[randomNumber] + signature;
    }
    else
    {
         var optionsList = [
            //namesString + ' are free! Have fun you crazy kids!',
            'Have the time of your life with ' + namesString + '.',
            'Enjoy lunch with ' + namesString + '.',
            namesString + ' said they would absolutely love to go.'
        ]

        var randomNumber = getRandomInt(0, optionsList.length-1);
        return optionsList[randomNumber] + signature;
    }
}

var joinMessage = [
'Thanks for joining! Happy Lunching'
]
var joinFailureMessage = ['Say that again? We didn\'t catch it! Text: Join <Your Name> to subscribe'];
var stopMessage = ['Sorry to see you go! Hope you will reconsider'];
var stopFailureMessage = ['Say that again? We didn\'t catch it! Text: STOP to unsubscribe'];
var LeaveMessage = ["Your group is going to miss you! Text 'Join <YourName> <GroupName>' to join again!"];
var readdMessage = ['We have added you to a group'];

var userSchema = new Schema ({
    name: String,
    phone: String,
    group: String,
    isGoing: Boolean,
    isActive: Boolean 
});

var user = mongoose.model('user2', userSchema );

console.log('----- Created user 2.0 model: done');


var cafeSchema = new Schema ({
    name: String,
    group: String,
});

var cafes = mongoose.model('cafes', cafeSchema );
var cafesList=[];

console.log('----- Created cafes model: done');
console.log('');

cafes.find(function (err, result) 
{
        if (!err) 
        { 
            for (var i = 0; i < result.length ; i++)
            { 
                cafesList.push(result[i]);
            }
        }
        else
        {
            logHistoryEvent ('Error', '',  err);
        }
});

// inserting cafes in Mongo DB
//var listcafe = [' Cafe 16','Cafe 34','Cafe 9','Cafe 31', 'Cafe 4', 'Cafe 31'];
// for (var i=0;i<listcafe.length;i++)
// {
//     var insertCafe = new cafes ({
//             name:listcafe[i],
//             group:'OENGPM' 
//         });

//     insertCafe.save (function (err, result){});

// }


// Cron job that prompts users to come to lunch
new CronJob({
    cronTime: PromptTime,
    onTick: function(){
        promptCronLogic ();
    },
    start: true,
    timeZone: 'America/Los_Angeles'
});
console.log('----- Start prompt cron: done');

// Cron job that confirms to users at lunch time
new CronJob({
    cronTime: ConfirmTime, //confirmTime
    onTick: function()
    {
        confirmCronLogic();
    },
    start: true,
    timeZone: 'America/Los_Angeles'
});
console.log('----- Start Confirmation cron: done');


function logHistoryEvent (_eventType, _phone, _params) {
    
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
 

 // test
// Contains all the logic executed when the PROMPT cron job ticks
function promptCronLogic ()  {
   console.log('==================== Begin: promptCronLogic ====================');
    user.find({isActive: true}, function (err, result) {
        if (!err) 
        { 

            console.log('----- fetched ' + result.length + ' users in PromptCron: done');
            for (var i = 0; i < result.length ; i++)
            { 
                console.log(result[i].phone);
                sendText(result[i].phone, generateMessageWithSignature(promptMessages), true)
            }
            
            console.log(result);
        }
        else
        {
            logHistoryEvent ('Error', '',  err);
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
            logHistoryEvent ('Error','', err);
        }  
    });

    console.log('==================== End: promptCronLogic ====================');
};

// Contains all the logic executed when the CONFIRM cron job ticks
function confirmCronLogic () {
    console.log('==================== Begin: confirmCronLogic ====================');
        user.find ({isGoing: true, isActive: true}, function (err, result) 
    {
        console.log (result);
        
        if (!err)
        {
            generateAllMessages(result);  
            console.log('----- Send confirmation to ' + result.length + ' users: done');    
        }
        else
        {
            logHistoryEvent ('Error','', err);
        }
    });
    console.log('==================== End: confirmCronLogic ====================');
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
        var interestedNames = [];
        var formattedNames = [];
        messageString = '';
        var message = '';

        var group = users[i].group.toUpperCase();

        console.log ('Phone: ' + phone + ' has group: '+ group + ' and said: '+ users[i].isGoing);

        if(users[i].isGoing)
        {
            
            for (var j=0;j<users.length;j++)
            {
                if((users[j].isGoing)
                    && (phone.localeCompare(users[j].phone) != 0)
                    && (group.localeCompare((users[j].group).toUpperCase())==0)
                   )
                    {
                        interestedNames.push(users[j].name);                        
                    }
            }

            if (interestedNames.length > 1)
                {
                    //A list of names seperated by commas, and with an 'and', if appropriate
                    formattedNames = [interestedNames.slice(0, -1).join(', '), 
                    interestedNames.slice(-1)[0]].join(interestedNames.length < 2 ? '' : ' and ');
                    
                    if(group != 'OSTC')
                      messageString = generateConfirmationMessage(formattedNames, cafeNumber);
                    else
                      messageString = generateConfirmationMessage(formattedNames, '');
                }
            else if (interestedNames.length == 1)
                {
                    if(group != 'OSTC')
                      messageString = generateConfirmationMessage(interestedNames[0], cafeNumber);
                    else
                      messageString = generateConfirmationMessage(interestedNames[0], '');
                }
            else
                {
                    messageString = generateMessageWithSignature(onlyOneAttendeeMessages);
                }
        }
        else
        {
            continue;
        }
         console.log('for phone: '+ phone + ' the message is: '+ messageString);         

        sendText(phone,messageString, true);
        
    }
    console.log('==================== End: generateAllMessages ====================');
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

function insertUser (_name, _phone, _group) 
{
    console.log('==================== Start: insertUser ====================');

    console.log ('inser user');
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

            sendText(_phone, generateMessageWithSignature(joinMessage),true); 
            logHistoryEvent ('Join', _phone, {name:_name});

            // check time of joining and if it is between 11 AM - noon, then we will send them prompt message as well.       
                var date = new Date();
                var current_time = date.toLocaleTimeString();
                var current_hour = current_time.split(":")[0];
                var AMorPM = current_time.split(" ")[1];

                console.log("The hour is: " + current_hour);
                console.log("The AMorPM is: " + AMorPM);

                if (current_hour == 6 && AMorPM == "PM")
                {
                    console.log("Sending Prompt message");
                    sendText(_phone, generateMessageWithSignature(promptMessages), true);
                }

            return;
        }
        else
        {
            sendText(_phone,joinFailureMessage, true); 
            logHistoryEvent ('Error','', err); 
        }
    });

console.log('==================== End: insertUser ====================');

}


function JoinLogic (_phone, _message)
{
    console.log('==================== Start: JoinLogic ====================');

    var messageSplit = _message.split (' ');
    if (messageSplit[0].toUpperCase() != 'JOIN')
    {
        return;
    }

    if (messageSplit.length != 3)
    {
        console.log ('join needs 3 parameters');
        sendText(_phone, "Join requires 3 parameters: Join <YourName> <GroupName>",true); 
        return;
    }

    // If the user sent the correct messag structure, find if the user already exists in the mongo
    user.find({'phone': _phone}, function (err, result) 
    {
        
        // if the user exists, result.length will be >= 1. There should never be more 
        // than one user with the same phone number in the db, thus == should work,
        // but keeping >= just in case.
        if (result.length >= 1)
        {
            console.log (result)

            // If the user is active, they are already in a group
            if (result[0].isActive)
            {
                sendText(_phone, "You're already in a group! Text 'Leave Group' to leave current group",true);
                return;
            }

            // if they are not active, add them 
            else 
            {
                logHistoryEvent('Join', _phone, {group: messageSplit[2].toUpperCase()});
                var conditionsForUpdateDB = { 'phone': _phone }
                , updateForUpdateDB = { 'group': messageSplit[2].toUpperCase(), isActive: true };
                
                console.log("send readd message" + readdMessage);
                
                updateUserObject(conditionsForUpdateDB, updateForUpdateDB, readdMessage);

                return;
            }
        }

        // if the user has never existed in our system before, and they have 
        // the correct message structure, add them 
        console.log ('User is not in a group, lets try to add them');
        if (messageSplit.length != 3)
        {
            console.log ('join needs 3 parameters');
           
            sendText(_phone, "Join requires 3 parameters: Join <YourName> <GroupName>",true); 
            return;
        }
        
        console.log ('User has sent enough params');

        // Actually add the user 
        insertUser (messageSplit[1], _phone, messageSplit[2]);
    });

    console.log('==================== End: JoinLogic ====================');

} 

function updateUserObject (_conditionsForUpdateDB, _updateForUpdateDB, _confirmation)
{

    console.log('==================== Start: updateUserObject ====================');

    user.update(_conditionsForUpdateDB, _updateForUpdateDB, function callback (err, numAffected) {
      // numAffected is the number of updated documents
      console.log('updateuserobject: updated status for ' + _conditionsForUpdateDB.phone)
      // console.log(numAffected);

      console.log("the updateuserobject message is: " + _confirmation);

      var text = generateMessageWithSignature(_confirmation);

      console.log ("the message for text in updateuserobject: "+ text);

     sendText(_conditionsForUpdateDB.phone, text, true );
    });

    console.log('==================== End: updateUserObject ====================');
}


// Post function for calls from Twilio
router.post('/', function(req, res) {

    var date = new Date();
    var current_time = date.toLocaleTimeString();
    var current_hour = current_time.split(":")[0];
    var AMorPM = current_time.split(" ")[1];

    console.log("The hour is: " + current_hour);
    console.log("The AMorPM is: " + AMorPM);


    if (req._body) 
    {
        // Log every text we get
        logHistoryEvent ('ReceiveText', req.body.From, {message: req.body.Body});
        console.log ("----- Received text from " + req.body.From + " with message " + req.body.Body );

        // User sends any variation of yes
        if ((new RegExp("YES")).test(req.body.Body.toUpperCase()))
        {
            console.log('==================== Start: YES ====================');

            if(current_hour == 6 && AMorPM == "PM")
            {
                // Update status of user to 
                var conditionsForUpdateDB = { phone: req.body.From }
                  , updateForUpdateDB = { isGoing: true };
                updateUserObject(conditionsForUpdateDB, updateForUpdateDB, immediateYesResponsesMessages);
            }
            else
            {
                console.log(req.body.From + 'said Yes after eligible hours');

                sendText(req.body.From,'Sorry, your team has already gone. Try again between 11-12 on any weekday.', true);
            }     

            console.log('==================== End: YES ====================');

        }


        // User is french
        else if ((new RegExp("OUI")).test(req.body.Body.toUpperCase()))
        {
            sendText(req.body.From,'We dont like the french...', true);
        }

        // User responsed no
        else if ((new RegExp("NO")).test(req.body.Body.toUpperCase()))
        {
            console.log('==================== Start: No ====================');

            if(current_hour == 6 && AMorPM == "PM")
            {
                // Nothing should happen here
                console.log('No');
                sendText(req.body.From,generateMessageWithSignature(immediateNoResponsesMessages), true);
            }
            else
            {
                console.log(req.body.From + 'said No after eligible hours');

                sendText(req.body.From,'Confirmation window is between 11-12 on weekdays.', true);
            }
    
             console.log('==================== End: No ====================');

        }

        else if ((new RegExp("JOIN")).test(req.body.Body.toUpperCase()))
        {
            console.log('==================== Begin: Join User ====================');
           
            JoinLogic(req.body.From, req.body.Body);

            console.log('==================== End: Join User ====================');
        }

        else if ((new RegExp("STOP")).test(req.body.Body.toUpperCase()))
        {
            console.log('==================== Begin: User Stop ====================');
            console.log('user stopped');
            // var checkStop = req.body.Body.substr(0,3).toUpperCase();
  
            var conditionsForDeleteUser = {phone: req.body.From}
              , updateForDeleteUser = { isActive: false }
              , optionsForDeleteUser = {multi: true } ;

            user.update(conditionsForDeleteUser, updateForDeleteUser,  optionsForDeleteUser, function callback (err, numAffected) {

                if (!err)
                {
                    // numAffected is the number of updated documents
                    console.log('---- stopped ' + req.body.From + ' account: done'); 
                    logHistoryEvent ('Stop', req.body.From, {});
                }  
                else
                {
                    logHistoryEvent ('Error', req.body.From, err);
                }  
                    
              // numAffected is the number of updated documents
              console.log('---- Reset ' + numAffected.nModified + ' accounts: done');

            });
            console.log('==================== End: User Stop ====================');
        }

        else if ((new RegExp("START")).test(req.body.Body.toUpperCase())) 
        {
            console.log('==================== Begin: User Start ====================');
            // var checkStop = req.body.Body.substr(0,3).toUpperCase();
  
            var conditionsForDeleteUser = {phone: req.body.From}
              , updateForDeleteUser = { isActive: true }
              , optionsForDeleteUser = {multi: true } ;

            user.update(conditionsForDeleteUser, updateForDeleteUser,  optionsForDeleteUser, function callback (err, numAffected) {

                if (!err)
                {
                    // numAffected is the number of updated documents
                    console.log('---- Started ' + req.body.From + ' account: done'); 
                    logHistoryEvent ('Start', req.body.From, {});
                }  
                else
                {
                    logHistoryEvent ('Error', req.body.From, err);
                }  
                    
              // numAffected is the number of updated documents
              console.log('---- Reset ' + numAffected.nModified + ' accounts: done');

            });
            console.log('==================== End: User Start ====================');
        }

        else if ((new RegExp("LEAVE GROUP")).test(req.body.Body.toUpperCase())) 
        {
            console.log('==================== Begin: User Leave Group ====================');
            var conditionsForLeaveGroup = {phone: req.body.From}
              , updateForLeaveGroup = { isActive: false, group: undefined }
              , optionsForLeaveGroup = {multi: true } ;

            user.update(conditionsForLeaveGroup, updateForLeaveGroup,  optionsForLeaveGroup, function callback (err, numAffected) {

                if (!err)
                {
                    // numAffected is the number of updated documents
                    console.log('---- ' + req.body.From + ' left the group: done'); 
                    logHistoryEvent ('Leave', req.body.From, {});
                    sendText(req.body.From, LeaveMessage, true); 
                }  
                else
                {
                    logHistoryEvent ('Error', req.body.From, err);
                }  
                    
              // numAffected is the number of updated documents
              // console.log('---- ' + numAffected.nModified + ' accounts effected: done');

            });
            console.log('==================== End: User Leave Group ====================');
        }

        else if ((new RegExp("WHO")).test(req.body.Body.toUpperCase())) 
        {
            console.log('==================== Begin: Who ====================');
           
            if (current_hour == 6 && AMorPM == "PM")
            {
                console.log("Time between 11 and 12, so Who is eligible");
                WhoLogic(req.body.From);
            }
            else
            {
                console.log("Out of Who support time");
                sendText(_phone, generateMessageWithSignature("Who command can only be used between 11-12 on weekdays."), true);
            }

            console.log('==================== End: Who ====================');
        }
        // user sent some random message that didnt include the above
        // TODO - make sure user can send multiple texts to us
        else
        {
            sendText(req.body.From,'Say that again? We didn\'t catch it!', true);   
        }
    }
});

function WhoLogic(phoneNumber)
{
        console.log('==================== Begin: WhoLogic ====================');

        user.find ({isGoing: true, isActive: true}, function (err, result) 
            {
                getList(result,phoneNumber);
            });

    console.log('==================== End: WhoLogic ====================');

}

function getList(users,phoneNumber)
{
    console.log('==================== Begin: getList ====================');

    var messageString="";
    var interestedListNames=[];
 
    for (var i=0;i<users.length;i++)
    {
        interestedListNames.push(users[i].name);   
    }

    if (interestedListNames.length > 1)
    {
        //A list of names seperated by commas, and with an 'and', if appropriate
        formattedNames = [interestedListNames.slice(0, -1).join(', '), 
        interestedListNames.slice(-1)[0]].join(interestedListNames.length < 2 ? '' : ' and ');

        messageString = "So far, " + formattedNames + " have confirmed!";
                   
    }
    else if (interestedListNames.length == 1)
    {
        messageString = "So far, " + interestedListNames[0] + " has confirmed!";
    }
    else
    {
        messageString = "No one has confirmed so far";
    }

    console.log("Who message is:" + messageString);
    console.log("Who phoneNumber is:" + phoneNumber);

    sendText(phoneNumber, messageString, true); 

    console.log('==================== End: getList ====================');
}


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
            logHistoryEvent ('SendText', responseData.to, {message: message});
        }
        else {
            console.log(err);
            // If it was the first time failed, try again
            logHistoryEvent ('Error', responseData.to, err);

            if (retry)
            {
                sendText (phoneNumber, message, false);
            }
        }
    });
    console.log('==================== End: sendText ====================');
}

//
function randomCafe (){
    return cafesList[getRandomInt(0, cafesList.length-1)].name;
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

module.exports = router;

