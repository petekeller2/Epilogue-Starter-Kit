import merge from 'deepmerge';
import epilogueAuth from './epilogueAuth';
import config from '../config';

// todo: jsdoc
export default {
  addMilestones(milestoneParamObj, sharedParameters, authMilestone) {
    let totalParameters = [];
    Object.entries(milestoneParamObj).forEach(([milestoneParamObjKey, milestoneParamObjVal]) => {
      if (!(Array.isArray(config.defaultMilestonesDisabled) && config.defaultMilestonesDisabled.indexOf(milestoneParamObjKey) !== -1)) {
        totalParameters = sharedParameters.concat(milestoneParamObjVal);
        authMilestone = this[milestoneParamObjKey](authMilestone, ...totalParameters);
      }
    });
    return authMilestone;
  },
  ownResource(totalAuthMilestone, actionsList, i, aa, name, userAAs, isGroup) {
    if (actionsList[i] === 'create') {
      const authMilestone = {};
      authMilestone[actionsList[i]] = {};
      authMilestone[actionsList[i]].write = {};
      // eslint-disable-next-line
      authMilestone[actionsList[i]].write.before = ((req, res, context) => new Promise(async (resolve) => {
        if (isGroup === true) {
          if (((req || {}).body) && ((req || {}).user || {}).id) {
            // eslint-disable-next-line
            req.body.OwnerID = req.user.id;
          }
        }
        if ((userAAs.indexOf(name) >= 0) || (epilogueAuth.belongsToUserResourceCheck(aa))) {
          if (((req || {}).body) && ((req || {}).user || {}).id) {
            // eslint-disable-next-line
            req.body.UserId = req.user.id;
          }
        }
        resolve(context.continue);
      }));
      return merge(authMilestone, totalAuthMilestone);
    }
    return totalAuthMilestone;
  },
  listOwned(totalAuthMilestone, actionsList, i, aa, name, userAAs, isHttpTest, validTestNumber, permissions, permissionsInput) {
    if ((actionsList[i] === 'list')) {
      const authMilestone = {};
      authMilestone[actionsList[i]] = {};
      authMilestone[actionsList[i]].fetch = {};
      // eslint-disable-next-line
      authMilestone[actionsList[i]].fetch.before = ((req, res, context) => new Promise(async(resolve) => {
        permissions = epilogueAuth.convertRealOrTestPermissions(permissionsInput, name, isHttpTest, validTestNumber);
        if (permissions[0] === true && permissions[10] === false && permissions[15] === false) {
          if ((((req || {}).user || {}).id)) {
            if ((resource[0] === 'User') || (userAAs.indexOf(name) >= 0) || (epilogueAuth.belongsToUserResourceCheck(aa))) {
              const findAllObj = {
                all: true,
              };
              if (resource[0] === 'User') {
                findAllObj.where = { id: req.user.id };
              } else {
                findAllObj.where = { UserId: req.user.id };
              }
              return resource[2].findAll(findAllObj)
                .then((result) => {
                  // eslint-disable-next-line
                  context.instance = result;
                })
                .then(() => resolve(context.skip));
            } else {
              if (winston.warning) {
                // eslint-disable-next-line
                winston.warning('With these permissions, users can only list resources that belong to them, but this resource can not belong to anyone');
              }
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
