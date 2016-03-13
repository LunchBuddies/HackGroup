var express = require('express'),
    user = require('../Models/user'),
	logHistoryEvent = require ('../Functions/logHistoryEvent'),
	strings = require('../Resources/strings');

// This is done, but needs to import the user model once that has been fixed
module.exports = function (_conditionsForUpdateDB, _updateForUpdateDB, _optionsForResetDB, _confirmation) 
{
	if (_updateForUpdateDB == {})
	{
		console.warn ('----- UdateUser: WARN - no updates specified')
		return;
	}
    user.update(_conditionsForUpdateDB, _updateForUpdateDB, function callback (err, numAffected) {
      // numAffected is the number of updated documents
      console.log('updateuserobject: updated status for ' + _conditionsForUpdateDB.phone)
      // console.log(numAffected);

      console.log("the updateuserobject message is: " + _confirmation);

      if (_confirmation != null || _confirmation != '')
      {
      	return;
      }
      var text = _confirmation + strings.signature;
      	console.log('=== Send: ' + text);
		  sendText(_conditionsForUpdateDB.phone, text );
    });
}