import merge from 'deepmerge';
import epilogueAuth from './epilogueAuth';
import utilities from '../utilities';
import config from '../config';

export default {
  /** @function
   * @name addMilestones
   * @param {object} milestoneParamObj
   * @param {Array} sharedParameters
   * @param {object} authMilestone
   * @return object
   * @description Returns all of the allowed default milestones plus the milestones the function was given
   */
  addMilestones(milestoneParamObj, sharedParameters, authMilestone) {
    let totalParameters = [];
    let authMilestoneReturn = authMilestone;
    Object.entries(milestoneParamObj).forEach(([milestoneParamObjKey, milestoneParamObjVal]) => {
      if (!(Array.isArray(config.disabledDefaultMilestones) && config.disabledDefaultMilestones.indexOf(milestoneParamObjKey) !== -1)) {
        totalParameters = sharedParameters.concat(milestoneParamObjVal);
        authMilestoneReturn = this[milestoneParamObjKey](authMilestoneReturn, ...totalParameters);
      }
    });
    return authMilestoneReturn;
  },
  /** @function
   * @name returnUserId
   * @param {object} req
   * @return object
   * @description Helper function that returns a user's id conditionally
   */
  returnUserId(req) {
    if (((req || {}).body) && ((req || {}).user || {}).id) {
      return req.user.id;
    }
    return null;
  },
  /** @function
   * @name ownResource
   * @param {object} totalAuthMilestone
   * @param {Array} actionsList
   * @param {number} i
   * @param {*} aa
   * @param {string} name
   * @param {Array} userAAs
   * @param {boolean} isGroup
   * @return object
   * @description Returns a possibly modified version of totalAuthMilestone. When an instance of a resource is created,
   *  the UserID and/or OwnerID column is updated
   */
  ownResource(totalAuthMilestone, actionsList, i, aa, name, userAAs, isGroup) {
    if (actionsList[i] === 'create') {
      const authMilestone = {};
      authMilestone[actionsList[i]] = {};
      authMilestone[actionsList[i]].write = {};
      // eslint-disable-next-line
      authMilestone[actionsList[i]].write.before = ((req, res, context) => new Promise(async (resolve) => {
        if (isGroup === true) {
          req.body.OwnerID = this.returnUserId(req);
        }
        if ((userAAs.indexOf(name) >= 0) || (epilogueAuth.belongsToUserResourceCheck(aa))) {
          req.body.UserId = this.returnUserId(req);
        }
        resolve(context.continue);
      }));
      return merge(authMilestone, totalAuthMilestone);
    }
    return totalAuthMilestone;
  },
  /** @function
   * @name ownResource
   * @param {object} totalAuthMilestone
   * @param {Array} actionsList
   * @param {number} i
   * @param {*} aa
   * @param {string} name
   * @param {Array} userAAs
   * @param {object} model
   * @param {boolean} isHttpTest
   * @param {boolean} validTestNumber
   * @param {*} permissionsInput
   * @return object
   * @description Returns a possibly modified version of totalAuthMilestone. Only list owned resources under certain permissions
   */
  listOwned(totalAuthMilestone, actionsList, i, aa, name, userAAs, model, isHttpTest, validTestNumber, permissionsInput) {
    if ((actionsList[i] === 'list')) {
      const authMilestone = {};
      authMilestone[actionsList[i]] = {};
      authMilestone[actionsList[i]].fetch = {};
      // eslint-disable-next-line
      authMilestone[actionsList[i]].fetch.before = ((req, res, context) => new Promise(async(resolve) => {
        const permissions = epilogueAuth.convertRealOrTestPermissions(permissionsInput, name, isHttpTest, validTestNumber);
        if (permissions[0] === true && permissions[10] === false && permissions[15] === false) {
          if ((((req || {}).user || {}).id)) {
            if ((name === 'User') || (userAAs.indexOf(name) >= 0) || (epilogueAuth.belongsToUserResourceCheck(aa))) {
              const findAllObj = {
                all: true,
              };
              if (name === 'User') {
                findAllObj.where = { id: req.user.id };
              } else {
                findAllObj.where = { UserId: req.user.id };
              }
              return model.findAll(findAllObj)
                .then((result) => {
                  // eslint-disable-next-line
                  context.instance = result;
                })
                .then(() => resolve(context.skip));
            } else {
              // eslint-disable-next-line
              utilities.winstonWrapper('With these permissions, users can only list resources that belong to them, but this resource can not belong to anyone', 'warning');
              // eslint-disable-next-line
              context.include = [];
            }
          } else {
            // eslint-disable-next-line
            context.include = null;
          }
        }
        resolve(context.continue);
      }));
      return merge(authMilestone, totalAuthMilestone);
    }
    return totalAuthMilestone;
  },
};
