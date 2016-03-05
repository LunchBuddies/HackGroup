var express = require('express');
var user = require('../routes/text');

// This is done, but needs to import the user model once that has been fixed
module.exports = function (_conditionsForUpdateDB, _updateForUpdateDB, _optionsForResetDB) 
{
    user.update(_conditionsForUpdateDB, _updateForUpdateDB, function callback (err, numAffected) {
      // numAffected is the number of updated documents
      console.log('updateuserobject: updated status for ' + _conditionsForUpdateDB.phone)
      // console.log(numAffected);

      console.log("the updateuserobject message is: " + _confirmation);

      var text = generateMessageWithSignature(_confirmation);

      console.log ("the message for text in updateuserobject: "+ text);

        // sendText(_conditionsForUpdateDB.phone, text );
    });
}