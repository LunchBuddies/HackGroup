

var express = require('express');
var keys = require ('../Keys');
var client = require('twilio')(keys.TWILIO_ACCOUNT_SID, keys.TWILIO_AUTH_KEY);
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

/*var confirmedAttendeesTest = [
    {phone: '+16026164854'},
    {phone: '+14802367962'},
    {phone: '+19723658656'}
];*/

var promptTime = '00 40 15 * * 0-6';
var confirmationTime = '00 41 15 * * 0-6'

var promptMessage = 'Are you in for lunch at noon? Yes or No';
var confirmationMessage = 'Confirmed, see you at noon!';

//basic cron job
new CronJob({
 cronTime: promptTime,
 onTick: function(){
    sendGroupTexts(users, promptMessage)
},
start: true,
timeZone: 'America/Los_Angeles'
});

new CronJob({
 cronTime: confirmationTime,
 onTick: function(){
    sendDifferentGroupTexts(generateConfirmationMessages(confirmedAttendees))
},
start: true,
timeZone: 'America/Los_Angeles'
});

function lookUpName(phoneNumber, userList)
{
  for (counter=0;counter<userList.length;counter++)
   {
     var storedphone=userList[counter].phone;
            
     if(phoneNumber.localeCompare(storedphone)==0)
            return userList[counter].name;
   }

}

// This function will create the confirmation message for an input phone number
function generateOtherAttendeesString(phoneNumber)
{
    var interestedNames=[];
    var interestedPhones=[];

    for (counter=0;counter<confirmedAttendees.length;counter++)
     {
         var tempPhone=confirmedAttendees[counter].phone;
                
         if(phoneNumber.localeCompare(tempPhone)!=0)
         {
                var data = {phone:tempPhone};
                interestedPhones.push(data);
         }
     }

   for (attendeeCounter=0;attendeeCounter<interestedPhones.length;attendeeCounter++)
     {
        var checkPhone= interestedPhones[attendeeCounter].phone;

          for (counter=0;counter<users.length;counter++)
           {
                 var storedphone=users[counter].phone;
                 var storedname =users[counter].name;
                        
                 if(checkPhone.localeCompare(storedphone)==0)
                     {              
                            interestedNames.push(storedname);
                            break;
                     }
           }
    }

  return(interestedNames.join());
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
        // TODO: break to logic for each if {...} into its own function
        // to clean up the code
        // 
        // User sends any variation of yes
        if ((new RegExp("YES")).test(req.body.Body.toUpperCase()) 
          || (new RegExp("YEA")).test(req.body.Body.toUpperCase())
          || (new RegExp("YA")).test(req.body.Body.toUpperCase()))
        {
            // User responded yes to text message
            // TODO: Add user to lunch list
            console.log('Yes: ' + req.body.From);
            sendText(req.body.From,'Good choice! Can\'t wait!', true);

            var data = {phone:req.body.From};
            confirmedAttendees.push(data);
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

            sendText(req.body.From,'Aww! We\'ll miss you!', true);
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

        else if ((new RegExp("REGISTER")).test(req.body.Body.toUpperCase()))
        {
            // Add new user
            // TODO: break apart string and add user, no need to ask for # because it is
            // hidden is the POST request
            // 
            // TODO: How do we get their name?
        }

        // user sent some random message that didnt include the above
        // TODO - make sure user can send multiple texts to us
        else
        {
            sendText(req.body.From,'Say that again? We didn\'t catch it!', true);   
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

// Sends the same message to a group of users 
function sendGroupTexts (groupOfUsers, message)
{
  for (counter=0;counter<groupOfUsers.length;counter++)
  {
     sendText(groupOfUsers[counter].phone,message, true)
   }
}
//Accepts an array of objects which contain a phone number and 
//the message to be sent to that number
function sendDifferentGroupTexts(responseList){
  for (counter=0;counter<responseList.length;counter++)
  {
     sendText(responseList[counter].phone,responseList[counter].message, true)
   }
}

//Returns an array of objects with the phone number and message text 
//for that confirmed attendee
function generateConfirmationMessages(listOfAttendees){
    var responseList = [];
    for(counter=0; counter<listOfAttendees.length;counter++){
        var messageString = generateOtherAttendeesString(listOfAttendees[counter].phone);
        var data = {phone: listOfAttendees[counter].phone, message: messageString};
        responseList.push(data);
    }

    return responseList;
}

// Sends a single message to a given phone number
function sendText(phoneNumber, message, retry){
    client.sendMessage( {

        to: phoneNumber, // Any number Twilio can deliver to
        from: TwilioNumber, 
        body: message // body of the SMS message

    }, function(err, responseData) { //this function is executed when a response is received from Twilio

        if (!err) { // "err" is an error received during the request, if any

            console.log(responseData.from + ' ' + responseData.body); // outputs "+14506667788"
            // console.log(responseData.body); // outputs "word to your mother."

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
}

module.exports = router;
// Nick is annoying
// so is mandeep