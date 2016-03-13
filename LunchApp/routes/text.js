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
    strings = require ('../Resources/strings'),
    logHistoryEvent = require ('../Functions/logHistoryEvent');

// Grab JSON config files in this order:
//   1. Arguments passed to node
//   2. production.js
//   3. development.js
nconf.argv().file('prod','./config/production.json' ).file('dev','./config/development.json' );

if (nconf.get('enviornment') == 'dev') 
{
    console.log("----- Loaded DEV config");
}
else if (nconf.get('enviornment') == 'prod') 
{
    console.log("----- Loaded PROD config");
}


// if nconf is using dev config, set cron to first just after deployed to server
var promptTime,
    confirmTime;
if (nconf.get('enviornment') == 'dev')
{
    console.log ('----- Using DEV cron jobs');
    promptTime = new Date();
    promptTime.setSeconds(0);
    promptTime.setMinutes(promptTime.getMinutes()+ 1);
    
    confirmTime = new Date();
    confirmTime.setSeconds(0);
    confirmTime.setMinutes(confirmTime.getMinutes() + 2);
}

// If we are in a production enviornment, set to normal cron times
else if (nconf.get('enviornment') == 'prod')
{
    console.log ('----- Using PROD cron jobs');
    promptTime = '00 00 11 * * 1-5',
    confirmTime = '00 00 12 * * 1-5';
}


console.log('----- Set times: done');


// ------------------------- Message Strings -----------------------------


//Message which is sent when we aren't able to add a user
var joinFailureMessage = ["We didn\'t catch that! To subscribe, text 'JOIN' <YourName> <GroupName>'"];

//Message which is sent when a user sends "LEAVE GROUP"
var LeaveMessage = ["We're sure your friends will miss you. Thanks for the memories! If you change your mind, text 'JOIN <YourName> <GroupName>' and keep the good times rolling!"];

//Message which is sent when the user is added to a group
var successfulJoinConfirmation = ["Glad to have you on board! You're all set to receive invites. Happy Lunching!"]

//Message which is sent if the user responds after we've sent the confirmation
var groupAlreadyLeft = ["Ah, you're a tad late! We've already sent out the list of attendees today. If you hurry you may be able to catch 'em..."]

//Message which is sent if we don't recognize what they said
var genericUnknownCommandResponse = ["Whoops, we didn\'t recognize that command..."]

//Message which is sent if a user tries to join and they're already in a group
var alreadyInGroup = ["You can only join one group at a time, and it looks like you're already in one. Text 'LEAVE GROUP' to leave your current group"]

//Message which is sent if someone tries to send "Who" after we've sent the confirmation
var triedWhoAfterSentConfirmation = ["Oops, you can only use WHO command before noon. "]

//Generates a message from an array of messages and appends the default signature
function generateMessageWithSignature(messageArray, signature){
    if (nconf.get('enviornment') == 'dev') {
        console.log("generateMessageWithSignature has message as: "+ messageArray);
    }

    if (signature = 'undefined'){
        signature = strings.signature;
    }

    var text = messageArray[getRandomInt(0, messageArray.length-1)] + signature;
    if (nconf.get('enviornment') == 'dev')
    {
        console.log("the text value in signature is: "+ text);
    }
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
    cronTime: promptTime,
    onTick: function(){
        promptCronLogic ();
    },
    start: true,
    timeZone: 'America/Los_Angeles'
});
console.log('----- Start prompt cron: done');

// Cron job that confirms to users at lunch time
new CronJob({
    cronTime: confirmTime,
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
        if (nconf.get('enviornment') == 'dev'){

            console.log('for phone: '+ phone + ' the message is: '+ messageString);         
        }

        sendText (phone,messageString);
        
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
    console.log('==================== Start: JoinLogic ====================');

    var messageSplit = _message.split (' ');
    if (messageSplit[0].toUpperCase() != 'JOIN')
    {
        return;
    }

    if (messageSplit.length != 3)
    {
        console.log ('join needs 3 parameters');

        // send text
        sendText(_phone, "Join requires 3 parameters: Join <YourName> <GroupName>"); 

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
            if (nconf.get('enviornment') == 'dev') {
                console.log(results);
            }

            // If the user is active, they are already in a group
            if (result[0].isActive)
            {

                sendText(_phone, "You're already in a group! Text 'Leave Group' to leave current group");

                return;
            }

            // if they are not active, add them 
            else 
            {
                logHistoryEvent('Join', _phone, {group: messageSplit[2].toUpperCase()});
                var conditionsForUpdateDB = { 'phone': _phone }
                , updateForUpdateDB = { 'group': messageSplit[2].toUpperCase(), isActive: true };
                
                console.log("send read message" + successfulJoinConfirmation);

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

            sendText(_phone, "Join requires 3 parameters: Join <YourName> <GroupName>"); 

            return;
        }
        
        console.log ('User has sent enough params');

        // Actually add the user 
        insertUser (messageSplit[1], _phone, messageSplit[2]);
    });

    console.log('==================== End: JoinLogic ====================');

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

                sendText(req.body.From, generateMessageWithSignature(groupAlreadyLeft), true);
            }     

            console.log('==================== End: YES ====================');

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

                sendText(req.body.From,'Confirmation window is between 11-12 on weekdays.');

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
                sendText(_phone, generateMessageWithSignature(triedWhoAfterSentConfirmation), true);
            }

            console.log('==================== End: Who ====================');
        }

        // user sent some random message that didnt include the above
        else
        {

            sendText(req.body.From,strings.stopFailureMessage);   

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
    return cafesList[getRandomInt(0, cafesList.length-1)].name;
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

module.exports = router;
