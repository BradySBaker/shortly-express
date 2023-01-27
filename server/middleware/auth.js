const models = require('../models');
const Promise = require('bluebird');

module.exports.createSession = (req, res, next) => {
  // return models.Sessions.create()
  console.log('request', req);
  return models.Sessions.create()
    .then((queryResults) => {
      //req.session to exist
      models.Sessions.get({id: queryResults.insertId})
        .then((data) => { req._setSessionVariable('hash', data.hash); console.log(req.session); next(); });
    })
    .catch((err) => {
      console.log('err', err);
      res.send(err);
      // next();
    });
};

/************************************************************/
// Add additional authentication middleware functions below
/************************************************************/
