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
   * @param {boolean} guestIfNoUser
   * @return object
   * @description Helper function that returns a user's id conditionally. Note that if guest is returned, a guest user must exist
   */
  returnUserId(req, guestIfNoUser) {
    if (((req || {}).body) && ((req || {}).user || {}).id) {
      return req.user.id;
    } else if (guestIfNoUser === true) {
      return 'guest';
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
   * @param {boolean} isHttpTest
   * @param {boolean} validTestNumber
   * @param {*} permissionsInput
   * @param {object} sequelize
   * @return object
   * @description Returns a possibly modified version of totalAuthMilestone. When an instance of a resource is created,
   *  the UserID and/or OwnerID column is updated
   */
  ownResource(totalAuthMilestone, actionsList, i, aa, name, userAAs, isGroup, isHttpTest, validTestNumber, permissionsInput, sequelize) {
    if (actionsList[i] === 'create') {
      const authMilestone = {};
      authMilestone[actionsList[i]] = {};
      authMilestone[actionsList[i]].write = {};
      // eslint-disable-next-line
      authMilestone[actionsList[i]].write.before = ((req, res, context) => new Promise(async (resolve) => {
        const userId = this.returnUserId(req, false);
        const permissions = epilogueAuth.convertRealOrTestPermissions(permissionsInput, name, isHttpTest, validTestNumber);
        const isAdminResult = await this.isAdmin(userId, sequelize, false);
        if ((isAdminResult === true) || (this.adminsOnly(permissions) === false)) {
          if (isGroup === true) {
            req.body.OwnerID = userId;
          }
          if ((userAAs.indexOf(name) >= 0) || (epilogueAuth.belongsToUserResourceCheck(aa))) {
            req.body.UserId = userId;
          }
          req.body.updatedBy = userId;
          resolve(context.continue);
        } else {
          res.status(401).send({ message: 'Unauthorized' });
          resolve(context.stop);
        }
      }));
      return merge(authMilestone, totalAuthMilestone);
    }
    return totalAuthMilestone;
  },
  /** @function
   * @name isAdmin
   * @param {string} userId
   * @param {object} sequelize
   * @param {boolean} debug
   * @return promise
   */
  isAdmin(userId, sequelize, debug) {
    return sequelize.query(`SELECT * FROM "Admins" where "AdminId" = '${userId}'`, { type: sequelize.QueryTypes.SELECT })
      .then((adminResults) => {
        if (debug === true) {
          utilities.winstonWrapper(`admin user check: ${adminResults}`);
        }
        return Boolean(adminResults.length);
      }, error => utilities.winstonWrapper(`isAdmin error: ${error}`));
  },
  /** @function
   * @name adminsOnly
   * @param {Array} permissions
   * @return boolean
   * @description Note that group create permissions must be false
   */
  adminsOnly(permissions) {
    return Boolean((permissions[1] === true) && (permissions[6] === false) && (permissions[11] === false) && (permissions[16] === false));
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
   * @param {boolean} isGroup
   * @param {object} awaitedGroupXrefModel
   * @return object
   * @description Returns a possibly modified version of totalAuthMilestone. Only list owned resources under certain permissions
   */
  // eslint-disable-next-line
  listOwned(totalAuthMilestone, actionsList, i, aa, name, userAAs, isGroup, model, isHttpTest, validTestNumber, permissionsInput, awaitedGroupXrefModel) {
    if ((actionsList[i] === 'list')) {
      const authMilestone = {};
      authMilestone[actionsList[i]] = {};
      authMilestone[actionsList[i]].fetch = {};
      // eslint-disable-next-line
      authMilestone[actionsList[i]].fetch.before = ((req, res, context) => new Promise(async(resolve) => {
        const permissions = epilogueAuth.convertRealOrTestPermissions(permissionsInput, name, isHttpTest, validTestNumber);
        const groupCheck = Boolean(isGroup && (permissions[5] === false));
        if (((permissions[0] === true) || (isGroup && (permissions[5] === true))) && permissions[10] === false && permissions[15] === false) {
          if ((((req || {}).user || {}).id)) {
            if ((name === 'User') || (userAAs.indexOf(name) >= 0) || (epilogueAuth.belongsToUserResourceCheck(aa)) || groupCheck) {
              // eslint-disable-next-line
              context.instance = await this.listOwnedOnly(name, req, groupCheck, model, context);
              resolve(context.skip);
            } else if (isGroup) {
              // eslint-disable-next-line
              context.instance = await this.listGroupsAssociatedWith(req, model, name, awaitedGroupXrefModel, context);
              resolve(context.skip);
            } else {
              let longMessage = 'With these permissions, users can only list resources that belong to them, ';
              longMessage += 'but this resource can not belong to anyone';
              utilities.winstonWrapper(longMessage, 'warning');
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
  listOwnedOnly(name, req, groupCheck, model) {
    const findAllObj = {
      all: true,
    };
    if (name === 'User') {
      findAllObj.where = { id: req.user.id };
    } else if (groupCheck) {
      findAllObj.where = { OwnerID: req.user.id };
    } else {
      findAllObj.where = { UserId: req.user.id };
    }
    return model.findAll(findAllObj);
  },
  listGroupsAssociatedWith(req, model, name, awaitedGroupXrefModel) {
    const findAllObj = {
      all: true,
      where: { OwnerID: req.user.id },
    };
    return model.findAll(findAllObj)
      .then((ownerResult) => {
        const findAllMemberObj = {
          all: true,
        };
        findAllMemberObj.where = {
          UserId: req.user.id,
          groupResourceName: name,
        };
        return awaitedGroupXrefModel.findAll(findAllMemberObj)
          .then((memberResult) => {
            const ownedGroupArray = [];
            let groupMemberOfArray = [];
            ownerResult.forEach((ownedGroup) => {
              ownedGroupArray.push(ownedGroup.dataValues);
            });
            memberResult.forEach((groupMemberOf) => {
              groupMemberOfArray.push(groupMemberOf.dataValues);
            });
            return Promise.all(groupMemberOfArray.map((unconvertedPermissions) => {
              const findGroupObj = {
                where: { id: unconvertedPermissions.groupID },
              };
              return model.findOne(findGroupObj);
            })).then((groupsMemberBelongsTo) => {
              groupMemberOfArray = [];
              groupsMemberBelongsTo.forEach((groupMemberOf) => {
                groupMemberOfArray.push(groupMemberOf.dataValues);
              });
              return [...groupMemberOfArray, ...ownedGroupArray];
            }, error => utilities.winstonWrapper(`List Groups Associated With (Promise.all) Error: ${error}`));
          }, error => utilities.winstonWrapper(`List Groups Associated With (Member) Error: ${error}`));
      }, error => utilities.winstonWrapper(`List Groups Associated With (Own) Error: ${error}`));
  },
  /** @function
   * @name deleteGroup
   * @param {object} totalAuthMilestone
   * @param {Array} actionsList
   * @param {number} i
   * @param {*} aa
   * @param {string} name
   * @param {Array} userAAs
   * @param {object} awaitedGroupXrefModel
   * @param {boolean} isGroup
   * @return object
   * @description Returns a possibly modified version of totalAuthMilestone. Deletes GroupXref rows.
   */
  deleteGroup(totalAuthMilestone, actionsList, i, aa, name, userAAs, isGroup, awaitedGroupXrefModel) {
    if ((actionsList[i] === 'delete') && (isGroup === true)) {
      const authMilestone = {};
      authMilestone[actionsList[i]] = {};
      authMilestone[actionsList[i]].fetch = {};
      // eslint-disable-next-line
      authMilestone[actionsList[i]].fetch.before = ((req, res, context) => new Promise(async (resolve) => {
        if ((((req || {}).body || {}).id)) {
          const deleteObj = {
            where: {
              groupId: req.body.id,
              groupResourceName: name,
            },
          };
          return awaitedGroupXrefModel.destroy(deleteObj)
            .then(() => resolve(context.continue), error => utilities.winstonWrapper(`Delete group milestone error: ${error}`));
        } else {
          resolve(context.continue);
        }
      }));
      return merge(authMilestone, totalAuthMilestone);
    }
    return totalAuthMilestone;
  },
  /** @function
   * @name deleteMessage
   * @param {object} totalAuthMilestone
   * @param {Array} actionsList
   * @param {number} i
   * @param {*} aa
   * @param {string} name
   * @param {Array} userAAs
   * @param {string} message
   * @param {boolean} isGroup
   * @return object
   * @description Returns a possibly modified version of totalAuthMilestone.
   */
  deleteMessage(totalAuthMilestone, actionsList, i, aa, name, userAAs, isGroup, message) {
    if (actionsList[i] === 'delete') {
      const authMilestone = {};
      authMilestone[actionsList[i]] = {};
      authMilestone[actionsList[i]].write = {};
      // eslint-disable-next-line
      authMilestone[actionsList[i]].write.after = ((req, res, context) => new Promise(async (resolve) => {
        // eslint-disable-next-line
        context.instance = {
          message,
        };
        resolve(context.continue);
      }));
      return merge(authMilestone, totalAuthMilestone);
    }
    return totalAuthMilestone;
  },
  /** @function
   * @name updateAsLoggedInUser
   * @param {object} totalAuthMilestone
   * @param {Array} actionsList
   * @param {number} i
   * @return object
   * @description Returns a possibly modified version of totalAuthMilestone. Adds updatedBy to body
   */
  updateAsLoggedInUser(totalAuthMilestone, actionsList, i) { //  aa, name, userAAs
    if ((actionsList[i] === 'update')) {
      const authMilestone = {};
      authMilestone[actionsList[i]] = {};
      authMilestone[actionsList[i]].update = {};
      // eslint-disable-next-line
      authMilestone[actionsList[i]].update.before = ((req, res, context) => new Promise(async (resolve) => {
        req.body.updatedBy = this.returnUserId(req, false);
        resolve(context.continue);
      }));
      return merge(authMilestone, totalAuthMilestone);
    }
    return totalAuthMilestone;
  },
};
