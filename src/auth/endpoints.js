import jwt from 'jsonwebtoken';
import session from 'express-session';
import config from '../config';

export default {
  /** @function
   * @name setup
   * @param {object} app
   * @param {object} passport
   * @description Creates auth endpoint
   */
  setup(app, passport) {
    if (!config.authOptionsDisabled.indexOf('twitter') || config.authOptionsDisabled.indexOf('twitter') === -1) {
      const sessionObj = {
        secret: config.sessionSecret,
        resave: Boolean(config.sessionResave.toUpperCase() === 'YES'),
        saveUninitialized: Boolean(config.sessionSaveUninitialized.toUpperCase() === 'YES'),
      };
      sessionObj.cookie = { secure: Boolean(config.protocol.toLowerCase() === 'https') };
      app.use(session(sessionObj));
      passport.serializeUser((user, done) => {
        done(null, user);
      });

      passport.deserializeUser((user, done) => {
        done(null, user);
      });
    }
    const authMethods = Object.keys(config.authMethods);
    authMethods.forEach((authMethod) => {
      if (!(Array.isArray(config.authOptionsDisabled) && config.authOptionsDisabled.indexOf(authMethod) !== -1)) {
        const session = Boolean(config.passportSession.toUpperCase() === 'YES');
        const failureRedirect = config.authFailureRedirect;
        const authSuccessRedirect = config.authSuccessRedirect;
        const authOptionsObj = { failureRedirect };
        let passportAuthenticate = '';
        if (authMethod !== 'twitter') {
          const scope = config.authMethods[authMethod].scope;
          passportAuthenticate = passport.authenticate(authMethod, {scope, session});
          authOptionsObj.session = session;
        } else {
          passportAuthenticate = passport.authenticate(authMethod);
        }

        app.get(`/login/${authMethod}`,
          passportAuthenticate,
        );
        app.get(`/login/${authMethod}/callback`,
          passport.authenticate(authMethod, authOptionsObj),
          (req, res) => {
            const expiresIn = parseInt(config.tokenExpiresIn, 10);
            const maxAge = parseInt(config.cookieMaxAge, 10);
            const httpOnly = Boolean(config.httpOnlyCookie.toUpperCase() === 'YES');
            const cookieOptions = {maxAge, httpOnly};
            const token = jwt.sign(req.user, config.jwt.secret, {expiresIn});
            res.cookie('id_token', token, cookieOptions);
            if (config.environment === 'development' || config.environment === 'testing') {
              res.redirect(authSuccessRedirect);
            } else {
              // production and staging
            }
          },
        );
      }
    });
    app.get('/logout',
      (req, res) => {
        req.logout();
        res.clearCookie('id_token');
        const domainCheck = Boolean(config && config.authMethods.auth0 && config.authMethods.auth0.domain);
        const auth0Logout = Boolean(config.auth0Logout.toUpperCase() === 'YES');
        const host = ((config.port === 443 || config.port === 80) ? config.host : `${config.host}:${config.port}`);
        if (!(Array.isArray(config.authOptionsDisabled) && config.authOptionsDisabled.indexOf('auth0') !== -1) && domainCheck && auth0Logout) {
          res.redirect(`https://${config.auth0.domain}/v2/logout?returnTo=${config.protocol}%3A%2F%2F${host}${config.loggedOutScreen}`);
        } else {
          res.redirect(`${config.protocol}://${host}${config.loggedOutScreen}`);
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
