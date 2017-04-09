const config = {
  // if process.env is not being set, you may need to set 'Defaults env_keep +=' in the /etc/sudoers
  environment: process.env.NODE_ENV || 'development', // development, testing, staging or production
  protocol: process.env.PROTOCOL || 'https',
  httpsCert: process.env.HTTPS_CERT || 'path/to/https/server.crt',
  httpsKey: process.env.HTTPS_KEY || 'path/to/https/key.pem',
  allowBadCertForDev: process.env.ALLOW_BAD_CERT_FOR_DEV || 'YES',
  relativePaths: process.env.RELATIVE_PATHS || 'YES',
  auth0Logout: process.env.AUTH0_LOGOUT || 'NO',
  port: process.env.PORT || 4000,
  host: process.env.WEBSITE_HOSTNAME || 'localhost',
  dbString: process.env.DATABASE_URL || '<DB_URL>',
  urlencodedExtended: process.env.URL_ENCODED_EXTENDED || 'NO',
  force: process.env.FORCE || 'YES', // YES to clear the db on server restart
  sessionSecret: process.env.SESSION_SECRET || '<SESSION_SECRET>',
  sessionResave: process.env.SESSION_RESAVE || 'NO',
  sessionSaveUninitialized: process.env.SESSION_SAVE_UNINITIALIZED || 'YES',
  authOptionsDisabled: process.env.AUTH_OPTIONS_DISABLED || ['twitter'], // OAuth 2.0 preferred
  disabledDefaultMilestones: process.env.DISABLED_DEFAULT_MILESTONES || [],
  tokenExpiresIn: process.env.TOKEN_EXPIRES_IN || (60 * 60 * 24 * 180), // 180 days
  cookieMaxAge: process.env.COOKIE_MAX_AGE || (60 * 60 * 24 * 180 * 1000), // 180,000 days
  authFailureRedirect: process.env.AUTH_FAILURE_REDIRECT || '/authFailure',
  authSuccessRedirect: process.env.AUTH_SUCCESS_REDIRECT || '/getUserDataTest',
  loggedOutScreen: process.env.LOGGED_OUT_SCREEN || '/loggedOutScreen',
  passportSession: process.env.PASSPORT_SESSION || 'NO',
  httpOnlyCookie: process.env.HTTP_ONLY_COOKIE || 'YES',
  authMethods: {
    auth0: {
      id: process.env.AUTH0_CLIENT_ID || '<AUTH0_CLIENT_ID>',
      secret: process.env.AUTH0_CLIENT_SECRET || '<AUTH0_CLIENT_SECRET>',
      domain: process.env.AUTH0_DOMAIN || '<DOMAIN>.auth0.com',
      callbackURL: process.env.AUTH0_CALLBACK_URL || '/login/auth0/callback',
      scope: process.env.AUTH0_SCOPE || ['email'],
    },
    facebook: {
      id: process.env.FACEBOOK_CLIENT_ID || '<FACEBOOK_CLIENT_ID>',
      secret: process.env.FACEBOOK_CLIENT_SECRET || '<FACEBOOK_CLIENT_SECRET>',
      callbackURL: process.env.FACEBOOK_CALLBACK_URL || '/login/facebook/callback',
      // eslint-disable-next-line
      profileFields: process.env.FACEBOOK_PROFILE_FIELDS || ['id', 'email', 'picture.type(large)', 'gender', 'link', 'locale', 'name', 'timezone', 'updated_time', 'verified'],
      scope: process.env.FACEBOOK_SCOPE || ['email', 'public_profile', 'user_friends'],
    },
    google: {
      id: process.env.GOOGLE_CLIENT_ID || '<GOOGLE_CLIENT_ID>',
      secret: process.env.GOOGLE_CLIENT_SECRET || '<GOOGLE_CLIENT_SECRET>',
      callbackURL: process.env.GOOGLE_CALLBACK_URL || '/login/google/callback',
      scope: process.env.GOOGLE_SCOPE || ['email', 'profile'],
    },
    twitter: {
      id: process.env.TWITTER_CONSUMER_KEY || '<TWITTER_CONSUMER_KEY>',
      secret: process.env.TWITTER_CONSUMER_SECRET || '<TWITTER_CONSUMER_SECRET>',
      callbackURL: process.env.TWITTER_CALLBACK_URL || '/login/twitter/callback',
    },
  },
  jwt: {
    secret: process.env.JWT_SECRET || '<JWT_SECRET>',
    credentialsRequired: process.env.CREDENTIALS_REQUIRED || 'NO',
  },
  tests: {
    exitOnFinishingTests: process.env.EXIT_ON_FINISHING_TEST || 'YES',
  },
  winston: {
    tailable: process.env.TAILABLE_WINSTON || 'YES',
    maxsize: process.env.MAXSIZE_WINSTON || 50000,
    maxFiles: process.env.MAX_FILES_WINSTON || 5,
    zippedArchive: process.env.ZIPPED_ARCHIVE_WINSTON || 'YES',
  }
};
module.exports = config;
