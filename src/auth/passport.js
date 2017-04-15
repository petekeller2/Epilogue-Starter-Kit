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
    /* eslint no-underscore-dangle: ["error", { "allow": ["_json"] }]*/
    const profileJson = ((profile || {})._json || {});
    returnObj.username = this.getUsername(profile, profileJson);
    returnObj.emailAddress = this.getEmailAddress(profileJson);
    returnObj.profilePicture = this.getProfilePicture(profileJson);
    return returnObj;
  },
  /** @function
   * @name getUsername
   * @param {object} profile
   * @param {object} profileJson
   * @return string
   * @description Helper function for getFromProfile
   */
  getUsername(profile, profileJson) {
    let username = (profile || {}).displayName;
    if (!username) {
      username = profileJson.first_name;
      if (username) {
        username += ' ';
      }
      username += profileJson.last_name;
    }
    return username;
  },
  /** @function
   * @name getEmailAddress
   * @param {object} profileJson
   * @return string
   * @description Helper function for getFromProfile
   */
  getEmailAddress(profileJson) {
    let emailAddress = profileJson.email;
    if (!emailAddress) {
      emailAddress = profileJson.emails;
      if (emailAddress) {
        emailAddress = (emailAddress[0] || {}).value;
      }
    }
    return emailAddress;
  },
  /** @function
   * @name getProfilePicture
   * @param {object} profileJson
   * @return string
   * @description Helper function for getFromProfile
   */
  getProfilePicture(profileJson) {
    let profilePicture = ((profileJson.picture || {}).data || {}).url;
    if (!profilePicture) {
      profilePicture = profileJson.profile_image_url_https;
    }
    if (!profilePicture) {
      profilePicture = (profileJson.image || {}).url;
    }
    if (!profilePicture) {
      profilePicture = profileJson.picture;
    }
    return profilePicture;
  },
  /** @function
   * @name getId
   * @param {object} req
   * @param {object} profile
   * @return string
   * @description Helper function for setup
   */
  getId(req, profile) {
    let id = ((req || {}).user || {}).id;
    if (!id) {
      id = (profile || {}).id;
    }
    return id;
  },
  /** @function
   * @name userResourceCheck
   * @param {object} userResource
   * @description Helper function for setup
   */
  userResourceCheck(userResource) {
    if (!userResource) {
      throw new MainError('The User resource was not found during an auth attempt!', 'Error');
    }
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
        callbackURL: config.authMethods[passportOptionName].callbackURL,
        passReqToCallback: true,
      };
      if (passportOptionName === 'twitter') {
        passportConfig.consumerKey = config.authMethods[passportOptionName].id;
        passportConfig.consumerSecret = config.authMethods[passportOptionName].secret;
        passportConfig.userProfileURL = 'https://api.twitter.com/1.1/account/verify_credentials.json?include_email=true';
      } else {
        passportConfig.clientID = config.authMethods[passportOptionName].id;
        passportConfig.clientSecret = config.authMethods[passportOptionName].secret;
      }
      if (passportOptionName === 'auth0') {
        passportConfig.domain = config.authMethods[passportOptionName].domain;
      }
      if (passportOptionName === 'facebook') {
        passportConfig.profileFields = config.authMethods[passportOptionName].profileFields;
      }
      if (!(Array.isArray(config.authOptionsDisabled) && config.authOptionsDisabled.indexOf(passportOptionName) !== -1)) {
        passport.use(new PassportStrategy(passportConfig, (req, accessToken, refreshToken, extraParams, profile, done) => {
          const authAttempt = async () => {
            const id = this.getId(req, profile);
            const awaitedResourcesFromSetup = await resourcesFromSetup;
            const userResource = awaitedResourcesFromSetup.get('User')[2];
            this.userResourceCheck(userResource);
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
