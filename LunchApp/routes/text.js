//    Declaration Section    //
var express = require('express'),
    history = require ('../Models/History'),
    router = express.Router(),
    CronJob = require('cron').CronJob,
    sendText = require('../Functions/sendText'),
    updateUserObject = require('../Functions/updateUser'),
    insertUser = require('../Functions/insertUser'),
    database = require('../db'),
    nconf = require('nconf'),
    glob = require('glob'),
    mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    user = require ('../Models/user'),
    strings = require ('../strings'),
    logHistoryEvent = require ('../Functions/logHistoryEvent');

// Grab JSON config files in this order:
//   1. Arguments passed to node
//   2. production.js
//   3. development.js
nconf.argv().file('prod','./config/production.json' ).file('dev','./config/development.json' );

// We are setting prompt time and confirmation time for lunch
var date = new Date(),
    testPromptTime = new Date(),
    testConfirmTime = new Date();
testPromptTime.setSeconds(0);
testConfirmTime.setSeconds(0);
testPromptTime.setMinutes(date.getMinutes()+ 1);
testConfirmTime.setMinutes(date.getMinutes() + 2);
var PromptTime = '00 00 11 * * 1-5',
    ConfirmTime =  '00 00 12 * * 1-5';


console.log('----- Set times: done');

// ------------------------- Message Strings -----------------------------

var cafes = ['Cafe 9',' Cafe 16','Cafe 34','Cafe 36','Cafe 31', 'Cafe 4', 'Cafe 31'];

//Generates a message from an array of messages and appends the default signature
function generateMessageWithSignature(messageArray, signature){
    console.log("generateMessageWithSignature has message as: "+ messageArray);
    
    if (signature = 'undefined'){
        signature = strings.signature;
    }

    var text = messageArray[getRandomInt(0, messageArray.length-1)] + signature;

    console.log("the text value in signature is: "+ text);

    return text;
}

//Given a list of names and a suggestedCafe to insert, generages a confirmation message with a signature.
//If no signature is provided, the default signature will be used. 
function generateConfirmationMessage(namesString, suggestedCafe, signature){
    if (signature = 'undefined'){
        signature = strings.signature;
    }
    var optionsListWithoutCafe = [
        //namesString + ' are free! Have fun you crazy kids!',
        'Have the time of your life with ' + namesString + '.',
        'Enjoy lunch with ' + namesString + '.',
        namesString + ' said they would absolutely love to go.'
    ]
    var optionsListWithCafe = [
        //namesString + ' are free! We suggest ' + suggestedCafe + '. Have fun you crazy kids!',
        'Have the time of your life with ' + namesString + '. We\'ve heard good things about ' + suggestedCafe + '...',
        'Enjoy lunch with ' + namesString + '. Might we suggest ' + suggestedCafe + '?',
        namesString + ' said they would absolutely love to go. We suggest ' + suggestedCafe + '.'
    ]

    if(suggestedCafe != '')
    {
        
        var randomNumber = getRandomInt(0, optionsListWithCafe.length-1);
        return optionsListWithCafe[randomNumber] + signature;
    }
    else
    {
         

        var randomNumber = getRandomInt(0, optionsListWithoutCafe.length-1);
        return optionsListWithoutCafe[randomNumber] + signature;
    }
}

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
    console.log('==================== Begin: promptCronLogic ====================');
    user.find({isActive: true}, function (err, result) {
        if (!err) 
        { 

            console.log('----- fetched ' + result.length + ' users in PromptCron: done');
            for (var i = 0; i < result.length ; i++)
            { 
                // console.log(result[i].phone);
                sendText(result[i].phone, generateMessageWithSignature(strings.promptMessages))
            }
            //console.log(result);
        }
        else
        {
            logHistoryEvent ('Error', '',  err);
        }
    });
    
    var conditionsForResetDB = {}
      , updateForResetDB = { isGoing: false }
      , optionsForResetDB = {multi: true } ;
    updateUserObject(conditionsForResetDB, updateForResetDB, optionsForResetDB, '');

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
                    messageString = generateMessageWithSignature(strings.onlyOneAttendeeMessages);
                }
        }
        else
        {
            continue;
        }
         console.log('for phone: '+ phone + ' the message is: '+ messageString);         

        // sendText(phone,messageString);
        
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


function JoinLogic (_phone, _message)
{
    var messageSplit = _message.split (' ');
    if (messageSplit[0].toUpperCase() != 'JOIN')
    {
        return;
    }

    if (messageSplit.length != 3)
    {
        console.log ('join needs 3 parameters');
        // send text
        // sendText(_phone, "Join requires 3 parameters: Join <YourName> <GroupName>"); 
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
                // sendText(_phone, "You're already in a group! Text 'Leave Group' to leave current group");
                return;
            }

            // if they are not active, add them 
            else 
            {
                logHistoryEvent('Join', _phone, {group: messageSplit[2].toUpperCase()});
                var conditionsForUpdateDB = { 'phone': _phone }
                , updateForUpdateDB = { 'group': messageSplit[2].toUpperCase(), isActive: true };
                
                console.log("send readd message" + readdMessage);
                
                updateUserObject(conditionsForUpdateDB, updateForUpdateDB, {}, readdMessage);

                return;
            }
        }

        // if the user has never existed in our system before, and they have 
        // the correct message structure, add them 
        console.log ('User is not in a group, lets try to add them');
        if (messageSplit.length != 3)
        {
            console.log ('join needs 3 parameters');
            // send text
            // sendText(_phone, "Join requires 3 parameters: Join <YourName> <GroupName>"); 
            return;
        }
        
        console.log ('User has sent enough params');

        // Actually add the user 
        insertUser (messageSplit[1], _phone, messageSplit[2]);
    });
} 


// Post function for calls from Twilio
router.post('/', function(req, res) {
    if (req._body) 
    {
        // Log every text we get
        logHistoryEvent ('ReceiveText', req.body.From, {message: req.body.Body});
        console.log ("----- Received text from " + req.body.From + " with message " + req.body.Body );

        // User sends any variation of yes
        if ((new RegExp("YES")).test(req.body.Body.toUpperCase()))
        {

            // Update status of user to 
            var conditionsForUpdateDB = { phone: req.body.From }
              , updateForUpdateDB = { isGoing: true };
            updateUserObject(conditionsForUpdateDB, updateForUpdateDB, {}, strings.immediateYesResponsesMessages);
            
        }

        // User is french
        else if ((new RegExp("OUI")).test(req.body.Body.toUpperCase()))
        {
            sendText(req.body.From,'We dont like the french...');
        }

        // User responsed no
        else if ((new RegExp("NO")).test(req.body.Body.toUpperCase()))
        {
            // Nothing should happen here
            console.log('No');
            sendText(req.body.From,generateMessageWithSignature(strings.immediateNoResponsesMessages));
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

            updateUserObject(conditionsForDeleteUser, updateForDeleteUser,  optionsForDeleteUser, null);

            console.log('==================== End: User Stop ====================');
        }

        else if ((new RegExp("START")).test(req.body.Body.toUpperCase())) 
        {
            console.log('==================== Begin: User Start ====================');
            // var checkStop = req.body.Body.substr(0,3).toUpperCase();
  
            var conditionsForDeleteUser = {phone: req.body.From}
              , updateForDeleteUser = { isActive: true }
              , optionsForDeleteUser = {multi: true } ;

            updateUserObject(conditionsForDeleteUser, updateForDeleteUser,  optionsForDeleteUser, null);

            
            console.log('==================== End: User Start ====================');
        }

        else if ((new RegExp("LEAVE GROUP")).test(req.body.Body.toUpperCase())) 
        {
            console.log('==================== Begin: User Leave Group ====================');
            var conditionsForLeaveGroup = {phone: req.body.From}
              , updateForLeaveGroup = { isActive: false, group: undefined }
              , optionsForLeaveGroup = {multi: true } ;

            updateUserObject(conditionsForLeaveGroup, updateForLeaveGroup,  optionsForLeaveGroup, strings.leaveMessage);

            console.log('==================== End: User Leave Group ====================');
        }

        else if ((new RegExp("HELP")).test(req.body.Body.toUpperCase())) 
        {
            sendText(req.body.From, strings.help);
        }

        // user sent some random message that didnt include the above
        else
        {
            sendText(req.body.From,strings.stopFailureMessage);   
        }
    }
});


// Some helper functions
function GetUser(body)
{
    return (body.split(" ")[1]);    
}

function GetKeyword(body)
{
    return (body.split(" ")[0].toUpperCase());    
}

//
function randomCafe (){
    return cafes[getRandomInt(0, cafes.length-1)];
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

module.exports = router;
