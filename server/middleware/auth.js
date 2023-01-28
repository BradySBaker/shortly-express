const models = require('../models');
const Promise = require('bluebird');

module.exports.createSession = (req, res, next) => {
  //If we have cookies-

    //If cookies in database
      //Do not create session
      //Set session variables
    //Else if cookies not in database
      //Create Session
      //Set session variables

  //If we dont have cookies-
    //Create Session
    //Set session variables
  if (!req.cookies.shortlyid) {
    models.Sessions.create()
      .then((queryResults) => {
        return models.Sessions.get({id: queryResults.insertId});
      })
      .then((data) => {
        req['session'] = { 'hash': data.hash}; 
        res.cookie('shortlyid', data.hash);
        next();
      })
      .catch((err) => {
        res.send(err);
      });
  } else {
    models.Sessions.get({hash: req.cookies.shortlyid})
      .then((data) => {
        if (data) {
          req['session'] = { 'hash': data.hash}; 
          if (data.userId) {
            models.Users.getUser(data.userId)
              .then((user) => {
                req.session['userId'] = user.id;
                req.session['user'] = {username: user.username};
                next();
              });
          } else {
            next();
          }
        } else {
          req.cookies = {};
          module.exports.createSession(req, res, next);
        }
      })
      .catch((err) => {
        console.log('ERROR=====>', err);
        res.send(err);
      });
  }
};

/************************************************************/
// Add additional authentication middleware functions below
/************************************************************/
