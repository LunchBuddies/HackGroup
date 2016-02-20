var express = require('express');
//var client = require('')('AC5f80a9d16d712b11f6af27e006e51761', 'a29ae5d040fb1ffa437c81ab365a02ae');

var text = require ('textbelt');
var router = express.Router();

var opt ={
    fromAddr: '19723658656@txt.att.net'
}

text.sendText('17174601902', 'A sample text message!', opt, function(err) {
  if (err) {
    console.log(err);
  }
});

// var number = '+19723658656';
/*var numbers = [ '+17174601902', '+19723658656']

for (i = 0; i < numbers.length; i++) { 
    client.sendMessage( {

        to: numbers[i], // Any number Twilio can deliver to
        from: '+14693400518', // A number you bought from Twilio and can use for outbound communication
        body: 'word to your father.' // body of the SMS message

    }, function(err, responseData) { //this function is executed when a response is received from Twilio

        if (!err) { // "err" is an error received during the request, if any

            // "responseData" is a JavaScript object containing data received from Twilio.
            // A sample response from sending an SMS message is here (click "JSON" to see how the data appears in JavaScript):
            // http://www.twilio.com/docs/api/rest/sending-sms#example-1

            console.log(responseData.from); // outputs "+14506667788"
            console.log(responseData.body); // outputs "word to your mother."

        }
    });
}*/
    



module.exports = router;