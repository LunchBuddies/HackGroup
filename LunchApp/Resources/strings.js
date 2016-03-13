var express = require('express');

module.exports = {
	"signature":'\n - TheLunchBuddies',
	"promptMessages":[
	    "Interested in lunch? Text \'YES\' by noon and we\'ll let you know who else is interested. ",
	    "Free for lunch? Text \'YES\' by noon and we\'ll let you know who else is interested. ",
	    "Free for lunch? Come on, you know you want to. Text \'YES\' by noon and we\'ll let you know who else is interested. "
	],
	"immediateYesResponsesMessages": [
	    "You've never made a better decision. Ever. Good call. Seriously. We\'ll text you at noon to let you know who\'s going.",
	    "Got it! We\'ll text you at noon to let you know who\'s going.",
	    "Lunch, lunch, lunchy-lunch lunch. We\'ll text you at noon to let you know who\'s going."
	],
	"immediateNoResponsesMessages":[
	    "Aww! We\'ll miss you."
	],
	"onlyOneAttendeeMessages": [
	    "Looks like no one else is interested today! Better luck next time."    
	],
	"joinFailureMessage" : ['Say that again? We didn\'t catch it! Text: Join <Your Name> to subscribe'],
	"stopMessage" : ['Sorry to see you go! Hope you will reconsider'],
	"stopFailureMessage" : ['Say that again? We didn\'t catch it! Text: STOP to unsubscribe'],
	"LeaveMessage" : "Your group is going to miss you! Text 'Join <YourName> <GroupName>' to join again!",
	"readdMessage" : ['We have added you to a group'],
	"help": "Possible Responses -\n+ Stop - Stop the service\n+ Join <YourName> <GroupName> - Join a specific group\n+ Leave Group - Leave your group",
	"successfulJoinConfirmation":"Glad to have you on board! You're all set to receive invites. Happy Lunching!"
}