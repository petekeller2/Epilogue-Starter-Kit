import jwt from 'jsonwebtoken';
import session from 'express-session';
import config from '../config';

export default {
  /** @function
   * @name setup
   * @param {object} app
   * @param {object} passport
   * @description Creates auth endpoint
   * @todo Reduce code duplication. Enable and disable endpoints through the config.js file. Set the expiration time in config.js
   */
  setup(app, passport) {
    if (!config.authOptionsDisabled.indexOf('twitter') || config.authOptionsDisabled.indexOf('twitter') === -1) {
      const sessionObj = {
        secret: config.sessionSecret,
        resave: false,
        saveUninitialized: true,
      };
      if (config.protocol.toLowerCase() === 'https') {
        sessionObj.cookie = { secure: true };
      } else {
        sessionObj.cookie = { secure: false };
      }
      app.use(session(sessionObj));
      passport.serializeUser((user, done) => {
        done(null, user);
      });

      passport.deserializeUser((user, done) => {
        done(null, user);
      });
    }
    if (!(Array.isArray(config.authOptionsDisabled) && config.authOptionsDisabled.indexOf('facebook') !== -1)) {
      app.get('/login/facebook',
        passport.authenticate('facebook', { scope: ['email', 'public_profile', 'user_friends'], session: false }),
      );
      app.get('/login/facebook/callback',
        passport.authenticate('facebook', { failureRedirect: '/authFailure', session: false }),
        (req, res) => {
          const expiresIn = 60 * 60 * 24 * 180; // 180 days
          const token = jwt.sign(req.user, config.jwt.secret, { expiresIn });
          res.cookie('id_token', token, { maxAge: 1000 * expiresIn, httpOnly: true });
          if (config.environment === 'development' || config.environment === 'testing') {
            res.redirect('/getUserDataTest');
          } else {
            // production and staging
          }
        },
      );
    }
    if (!(Array.isArray(config.authOptionsDisabled) && config.authOptionsDisabled.indexOf('google') !== -1)) {
      app.get('/login/google',
        passport.authenticate('google', { scope: ['email', 'profile'], session: false }),
      );
      app.get('/login/google/callback',
        passport.authenticate('google', { failureRedirect: '/authFailure', session: false }),
        (req, res) => {
          const expiresIn = 60 * 60 * 24 * 180; // 180 days
          const token = jwt.sign(req.user, config.jwt.secret, { expiresIn });
          res.cookie('id_token', token, { maxAge: 1000 * expiresIn, httpOnly: true });
          if (config.environment === 'development' || config.environment === 'testing') {
            res.redirect('/getUserDataTest');
          } else {
            // production and staging
          }
        },
      );
    }
    if (!(Array.isArray(config.authOptionsDisabled) && config.authOptionsDisabled.indexOf('twitter') !== -1)) {
      app.get('/login/twitter',
        passport.authenticate('twitter'),
      );
      app.get('/login/twitter/callback',
        passport.authenticate('twitter', { failureRedirect: '/authFailure' }),
        (req, res) => {
          const expiresIn = 60 * 60 * 24 * 180; // 180 days
          const token = jwt.sign(req.user, config.jwt.secret, { expiresIn });
          res.cookie('id_token', token, { maxAge: 1000 * expiresIn, httpOnly: true });
          if (config.environment === 'development' || config.environment === 'testing') {
            res.redirect('/getUserDataTest');
          } else {
            // production and staging
          }
        },
      );
    }
    if (!(Array.isArray(config.authOptionsDisabled) && config.authOptionsDisabled.indexOf('auth0') !== -1)) {
      app.get('/login/auth0',
        passport.authenticate('auth0', { scope: ['email'], session: false }),
      );
      app.get('/login/auth0/callback',
        passport.authenticate('auth0', { failureRedirect: '/authFailure', session: false }),
        (req, res) => {
          const expiresIn = 60 * 60 * 24 * 180; // 180 days
          const token = jwt.sign(req.user, config.jwt.secret, { expiresIn });
          res.cookie('id_token', token, { maxAge: 1000 * expiresIn, httpOnly: true });
          if (config.environment === 'development' || config.environment === 'testing') {
            res.redirect('/getUserDataTest');
          } else {
            // production and staging
          }
        },
      );
    }
    app.get('/logout',
      (req, res) => {
        req.logout();
        res.clearCookie('id_token');
        let domainCheck = false;
        let auth0Logout = false;
        if (config && config.auth0 && config.auth0.domain) {
          domainCheck = true;
        }
        if (config.auth0Logout.toUpperCase() === 'YES') {
          auth0Logout = true;
        }
        if (!(Array.isArray(config.authOptionsDisabled) && config.authOptionsDisabled.indexOf('auth0') !== -1) && domainCheck && auth0Logout) {
          if (config.port === 443 || config.port === 80) {
            res.redirect(`https://${config.auth0.domain}/v2/logout?returnTo=${config.protocol}%3A%2F%2F${config.host}/loggedOutScreen`);
          } else {
            res.redirect(`https://${config.auth0.domain}/v2/logout?returnTo=${config.protocol}%3A%2F%2F${config.host}:${config.port}/loggedOutScreen`);
          }
        } else if (config.port === 443 || config.port === 80) {
          res.redirect(`${config.protocol}://${config.host}/loggedOutScreen`);
        } else {
          res.redirect(`${config.protocol}://${config.host}:${config.port}/loggedOutScreen`);
        }
      },
    );
    app.get('/authFailure',
      (req, res) => {
        res.end('Auth Failure!');
      },
    );
    if (config.environment === 'development' || config.environment === 'testing') {
      app.get('/getUserDataTest',
        (req, res) => {
          if (req.user) {
            res.json(req.user);
          } else {
            res.end('No user data found');
          }
        },
      );

      app.get('/loggedOutScreen',
        (req, res) => {
          if (req.user) {
            res.end('still logged in :(');
          } else {
            res.end('logged out');
          }
        },
      );
    }
  },
};
