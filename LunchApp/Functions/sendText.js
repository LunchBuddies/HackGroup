var express = require('express'),
    TwilioNumber = '+14693400518',
    keys = require ('../Keys'),
    logHistoryEvent = require ('../Functions/logHistoryEvent'),
    client = require('twilio')(keys.TWILIO_ACCOUNT_SID, keys.TWILIO_AUTH_KEY);

module.exports = function (phoneNumber, message) {
  // Sends a single message to a given phone number
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
        }
    });
    console.log('==================== End: sendText ====================');

};

