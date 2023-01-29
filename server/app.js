const express = require('express');
const path = require('path');
const utils = require('./lib/hashUtils');
const partials = require('express-partials');
const Auth = require('./middleware/auth');
const Auth2 = require('./middleware/cookieParser');
const models = require('./models');

const app = express();

app.set('views', `${__dirname}/views`);
app.set('view engine', 'ejs');
app.use(partials());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));
app.use(Auth2);
app.use(Auth.createSession);

app.get('/', Auth.verifySession, 
  (req, res) => {
    res.render('index');
  });

app.get('/create', Auth.verifySession,
  (req, res) => {
    res.render('index');
  });

app.get('/login',
  (req, res) => {
    res.render('login');
  });
   
app.get('/links', Auth.verifySession,
  (req, res, next) => {
    models.Links.getAll()
      .then(links => {
        res.status(200).send(links);
      })
      .error(error => {
        res.status(500).send(error);
      });
  });

app.post('/links', 
  (req, res, next) => {
    var url = req.body.url;
    if (!models.Links.isValidUrl(url)) {
      // send back a 404 if link is not valid
      return res.sendStatus(404);
    }

    return models.Links.get({ url })
      .then(link => {
        if (link) {
          throw link;
        }
        return models.Links.getUrlTitle(url);
      })
      .then(title => {
        return models.Links.create({
          url: url,
          title: title,
          baseUrl: req.headers.origin
        });
      })
      .then(results => {
        return models.Links.get({ id: results.insertId });
      })
      .then(link => {
        throw link;
      })
      .error(error => {
        res.status(500).send(error);
      })
      .catch(link => {
        res.status(200).send(link);
      });
  });

/************************************************************/
// Write your authentication routes here
/************************************************************/
app.post('/signup', (req, res) => {
  // does user exists?
  models.Users.checkUser(req.body.username)
    .then((data) => {
      if (data) {
        res.redirect('/signup');
      } else {
        models.Users.create({username: req.body.username, password: req.body.password});
        Auth.assignUser(req, res, () => {
          console.log('Redirecting to index in /signup route');
          res.redirect('/');
        });
      }
    })
    .catch ((err) => {
      console.log('THIS NODE ERROR', err);
      res.send(err);
    });
});

app.post('/login', (req, res) => {
  models.Users.checkUser(req.body.username)
    .then((data) => {
      if (data) {
        if (models.Users.compare(req.body.password, data.password, data.salt)) {
          Auth.assignUser(req, res, () => {
            res.redirect('/');
          });
        } else {
          res.redirect('/login');
        }
      } else {
        res.redirect('/login');
      }
    })
    .catch ((err) => {
      console.log('Check User Error', err);
      res.send(err);
    });
});

app.get('/logout', (req, res) => {
  Auth.deleteSession(req, res, () => {
    res.redirect('/login');
  });
});
/************************************************************/
// Handle the code parameter route last - if all other routes fail
// assume the route is a short code and try and handle it here.
// If the short-code doesn't exist, send the user to '/'
/************************************************************/

app.get('/:code', (req, res, next) => {

  return models.Links.get({ code: req.params.code })
    .tap(link => {

      if (!link) {
        throw new Error('Link does not exist');
      }
      return models.Clicks.create({ linkId: link.id });
    })
    .tap(link => {
      return models.Links.update(link, { visits: link.visits + 1 });
    })
    .then(({ url }) => {
      res.redirect(url);
    })
    .error(error => {
      res.status(500).send(error);
    })
    .catch(() => {
      console.log('Redirecting to index!');
      res.redirect('/');
    });
});

module.exports = app;
