import passport from 'passport';
import Auth0Strategy from 'passport-auth0';
import FacebookStrategy from 'passport-facebook';
import GoogleStrategy from 'passport-google-oauth20';
import TwitterStrategy from 'passport-twitter';
import config from '../config';
import MainError from '../custom/errors/';

export default {
  /**
   @name passportOptions
   @type object
   @description Storing the passport strategy for easier iteration
   */
  passportOptions: {
    auth0: Auth0Strategy,
    facebook: FacebookStrategy,
    google: GoogleStrategy,
    twitter: TwitterStrategy,
  },
  /** @function
   * @name getFromProfile
   * @param {object} profile
   * @return object
   * @description Makes the profile objects from many strategies uniform
   */
  getFromProfile(profile) {
    const returnObj = {};
    returnObj.username = (profile || {}).displayName;
    /* eslint no-underscore-dangle: ["error", { "allow": ["_json"] }]*/
    if (!returnObj.username) {
      returnObj.username = ((profile || {})._json || {}).first_name;
      if (returnObj.username) {
        returnObj.username += ' ';
      }
      returnObj.username += ((profile || {})._json || {}).last_name;
    }
    returnObj.emailAddress = ((profile || {})._json || {}).email;
    if (!returnObj.emailAddress) {
      returnObj.emailAddress = ((profile || {})._json || {}).emails;
      if (returnObj.emailAddress) {
        returnObj.emailAddress = (returnObj.emailAddress[0] || {}).value;
      }
    }
    returnObj.profilePicture = ((((profile || {})._json || {}).picture || {}).data || {}).url;
    if (!returnObj.profilePicture) {
      returnObj.profilePicture = ((profile || {})._json || {}).profile_image_url_https;
    }
    if (!returnObj.profilePicture) {
      returnObj.profilePicture = (((profile || {})._json || {}).image || {}).url;
    }
    if (!returnObj.profilePicture) {
      returnObj.profilePicture = ((profile || {})._json || {}).picture;
    }
    return returnObj;
  },
  /** @function
   * @name setup
   * @param {map} resourcesFromSetup
   * @return object
   * @description Sets up passport
   * @todo Update this function when the User resource can be set from config.js
   */
  setup(resourcesFromSetup) {
    let passportConfig = {};
    Object.entries(this.passportOptions).forEach(([passportOptionName, PassportStrategy]) => {
      passportConfig = {
        callbackURL: config[passportOptionName].callbackURL,
        passReqToCallback: true,
      };
      if (passportOptionName === 'twitter') {
        passportConfig.consumerKey = config[passportOptionName].id;
        passportConfig.consumerSecret = config[passportOptionName].secret;
        passportConfig.userProfileURL = 'https://api.twitter.com/1.1/account/verify_credentials.json?include_email=true';
      } else {
        passportConfig.clientID = config[passportOptionName].id;
        passportConfig.clientSecret = config[passportOptionName].secret;
      }
      if (passportOptionName === 'auth0') {
        passportConfig.domain = config[passportOptionName].domain;
      }
      if (passportOptionName === 'facebook') {
        passportConfig.profileFields = config[passportOptionName].profileFields;
      }
      if (!(Array.isArray(config.authOptionsDisabled) && config.authOptionsDisabled.indexOf(passportOptionName) !== -1)) {
        passport.use(new PassportStrategy(passportConfig, (req, accessToken, refreshToken, extraParams, profile, done) => {
          const authAttempt = async () => {
            // console.log('req.user', req.user);
            // console.log('profile', profile);
            let id = ((req || {}).user || {}).id;
            if (!id) {
              id = (profile || {}).id;
            }
            const awaitedResourcesFromSetup = await resourcesFromSetup;
            const userResource = awaitedResourcesFromSetup.get('User')[2];
            if (!userResource) {
              throw new MainError('The User resource was not found during an auth attempt!', 'Error');
            }
            const foundUser = await userResource.findOne({
              attributes: ['id', 'username', 'emailAddress', 'profilePicture'],
              where: { id },
            });
            if (foundUser) {
              const foundId = foundUser.id;
              const foundUsername = foundUser.username;
              const foundEmailAddress = foundUser.emailAddress;
              const foundProfilePicture = foundUser.profilePicture;
              if (foundEmailAddress && foundId && foundUsername && foundProfilePicture) {
                done(null, {
                  id: foundId,
                  username: foundUsername,
                  emailAddress: foundEmailAddress,
                  profilePicture: foundProfilePicture,
                });
              } else if (foundId) {
                const userData = this.getFromProfile(profile);
                done(null, {
                  id: foundId,
                  username: userData.username,
                  emailAddress: userData.emailAddress,
                  profilePicture: userData.profilePicture,
                });
              } else {
                done();
              }
            } else {
              const userData = this.getFromProfile(profile);
              const user = await userResource.create({
                id,
                username: userData.username,
                emailAddress: userData.emailAddress,
                profilePicture: userData.profilePicture,
              });
              done(null, {
                id: user.id,
                username: user.username,
                emailAddress: user.emailAddress,
                profilePicture: user.profilePicture,
              });
            }
          };
          authAttempt().catch(done);
        }));
      }
    });
    return passport;
  },
};
