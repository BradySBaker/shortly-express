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

module.exports.assignUser = function(req, res, next, data) {
  //module.Session.userId({id: sessionId}, {userId: currentUsersId})
  var sessionData = null;
  models.Sessions.get({hash: req.session.hash})
    .then((data) => {
      sessionData = data;
      return models.Users.checkUser(req.body.username);
    })
    .then((userData) => {
      models.Sessions.setUserId({id: sessionData.id}, {userId: userData.id});
      next();
    })
    .catch((err) => {
      console.log(err);
      res.send(err);
    });
};

module.exports.deleteSession = function(req, res, next) {
  models.Sessions.deleteUserSession({hash: req.session.hash})
    .then(() => {
      delete req['session'];
      delete req['cookie'];
      res.cookie('shortlyid', undefined);
      console.log(res);
      next();
    })
    .catch((err) => {
      console.log(err);
    });
};