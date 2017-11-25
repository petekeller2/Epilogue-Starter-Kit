// @flow
import merge from 'deepmerge';
import epilogueAuth from './epilogueAuth';
import permissionConversions from './permissionConversions';
import utilities from '../utilities';
import config from '../config';

export default {
  /** @function
   * @name addMilestones
   * @param {object} milestoneParamObj
   * @param {Array} sharedParameters
   * @param {object} authMilestone
   * @return {object}
   * @description Returns all of the allowed default milestones plus the milestones the function was given
   */
  addMilestones(milestoneParamObj: {}, sharedParameters: [], authMilestone: {}): {} {
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
   * @return {object}
   * @description Helper function that returns a user's id conditionally. Note that if guest is returned, a guest user must exist
   */
  returnUserId(req: {}, guestIfNoUser: boolean): {} {
    if ((((req || {}).body) && ((req || {}).user || {}).id) && req.user.id.length > 0) {
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
   * @param {number} i - actionsList index
   * @param {*} aa
   * @param {string} name
   * @param {Array} userAAs
   * @param {boolean} isGroup
   * @param {boolean} isHttpTest
   * @param {boolean} validTestNumber
   * @param {*} permissionsInput
   * @param {object} sequelize
   * @return {object}
   * @description Returns a possibly modified version of totalAuthMilestone. When an instance of a resource is created,
   *  the UserId and/or OwnerID column is updated
   */
  ownResource(totalAuthMilestone, actionsList, i, aa, name, userAAs, isGroup, isHttpTest, validTestNumber, permissionsInput, sequelize) {
    if (actionsList[i] === 'create') {
      const authMilestone = {};
      authMilestone[actionsList[i]] = {};
      authMilestone[actionsList[i]].write = {};
      // eslint-disable-next-line
      authMilestone[actionsList[i]].write.before = ((req, res, context) => new Promise(async (resolve) => {
        const userId = this.returnUserId(req, false);
        const permissions = permissionConversions.convertRealOrTestPermissions(permissionsInput, name, isHttpTest, validTestNumber);
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
          res.status(401).send({ message: utilities.displayMessage('unauthorized') });
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
   * @return {Promise}
   */
  isAdmin(userId: string, sequelize: {}, debug: boolean): Promise {
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
   * @return {boolean}
   * @description Note that group create permissions must be false
   */
  adminsOnly(permissions: []): boolean {
    return Boolean((permissions[1] === true) && (permissions[6] === false) && (permissions[11] === false) && (permissions[16] === false));
  },
  /** @function
   * @name ownResource
   * @param {object} totalAuthMilestone
   * @param {Array} actionsList
   * @param {number} i - actionsList index
   * @param {*} aa
   * @param {string} name
   * @param {Array} userAAs
   * @param {object} model
   * @param {boolean} isHttpTest
   * @param {boolean} validTestNumber
   * @param {*} permissionsInput
   * @param {boolean} isGroup
   * @param {object} awaitedGroupXrefModel
   * @return {object}
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
        const permissions = permissionConversions.convertRealOrTestPermissions(permissionsInput, name, isHttpTest, validTestNumber);
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
  /** @function
   * @name listOwnedOnly
   * @param {string} name
   * @param {object} req
   * @param {boolean} groupCheck
   * @param {object} model
   * @return {Promise}
   * @description Used by listOwned
   */
  listOwnedOnly(name: string, req: {}, groupCheck: boolean, model: {}): Promise {
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
  /** @function
   * @name listGroupsAssociatedWith
   * @param {object} req
   * @param {object} model
   * @param {string} name
   * @param {object} awaitedGroupXrefModel
   * @return {Promise}
   * @description Used by listOwned
   */
  listGroupsAssociatedWith(req: {}, model: {}, name: string, awaitedGroupXrefModel: {}): Promise {
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
   * @name readGroup
   * @param {object} totalAuthMilestone
   * @param {Array} actionsList
   * @param {number} i - actionsList index
   * @param {*} aa
   * @param {string} name
   * @param {Array} userAAs
   * @param {object} awaitedGroupXrefModel
   * @param {boolean} isGroup
   * @param {boolean} isHttpTest
   * @param {boolean} validTestNumber
   * @param {*} permissionsInput
   * @return {object}
   * @description Returns a possibly modified version of totalAuthMilestone.
   */
  readGroup(totalAuthMilestone, actionsList, i, aa, name, userAAs, isGroup, awaitedGroupXrefModel, isHttpTest, validTestNumber, permissionsInput) {
    const permissions = permissionConversions.convertRealOrTestPermissions(permissionsInput, name, isHttpTest, validTestNumber);
    const permissionsBool = Boolean((permissions[7] === true) && (permissions[12] === false) && (permissions[12] === false));
    if ((actionsList[i] === 'read') && (isGroup === true) && (permissionsBool)) {
      const authMilestone = {};
      authMilestone[actionsList[i]] = {};
      authMilestone[actionsList[i]].fetch = {};
      // eslint-disable-next-line
      authMilestone[actionsList[i]].fetch.before = ((req, res, context) => new Promise(async (resolve) => {
        if (((req || {}).url) && (((req || {}).user || {}).id)) {
          let reqUrlArray = req.url.split('/');
          reqUrlArray = reqUrlArray.filter(entry => entry.trim() !== '');
          const searchId = reqUrlArray[reqUrlArray.length - 1];
          const findObj = {
            where: {
              groupID: searchId,
              groupResourceName: name,
              UserId: req.user.id,
            },
          };
          const findResults = await awaitedGroupXrefModel.findOne(findObj);
          if (findResults && findResults.UserId === req.user.id) {
            resolve(context.continue);
          } else {
            // If you want membership in the group xref to be required for even owners of the resource,
            // comment out context.continue and comment in the lines under it
            resolve(context.continue);
            // res.status(401).send({ message: utilities.displayMessage('unauthorized') });
            // resolve(context.stop);
          }
        } else {
          res.status(401).send({ message: utilities.displayMessage('unauthorized') });
          resolve(context.stop);
        }
      }));
      return merge(authMilestone, totalAuthMilestone);
    }
    return totalAuthMilestone;
  },
  /** @function
   * @name updateGroupName
   * @param {object} totalAuthMilestone
   * @param {Array} actionsList
   * @param {number} i - actionsList index
   * @param {*} aa
   * @param {string} name
   * @param {Array} userAAs
   * @param {boolean} isGroup
   * @param {object} awaitedGroupXrefModel
   * @param {object} sequelize
   * @return {object}
   * @description Returns a possibly modified version of totalAuthMilestone. TODO: add UserGroupXref to awaitedResourcesFromSetup map
   */
  updateGroupName(totalAuthMilestone, actionsList, i, aa, name, userAAs, isGroup, awaitedGroupXrefModel, sequelize): {} {
    if ((actionsList[i] === 'update') && (name === 'UserGroupXref')) {
      const authMilestone = {};
      authMilestone[actionsList[i]] = {};
      authMilestone[actionsList[i]].fetch = {};
      // eslint-disable-next-line
      authMilestone[actionsList[i]].fetch.before = ((req, res, context) => new Promise(async (resolve) => {
        if ((((req || {}).body || {}).groupID) && (((req || {}).user || {}).id) && (((req || {}).body || {}).groupName)) {
          const findObj = {
            where: {
              groupID: req.body.groupID,
              UserId: req.user.id,
            },
          };
          const findResults = await awaitedGroupXrefModel.findOne(findObj);
          if (findResults && findResults.UserId === req.user.id) {
            const updateObj = {
              where: {
                groupID: req.body.groupID,
              },
            };
            return awaitedGroupXrefModel.update({
              groupName: req.body.groupName,
            }, updateObj)
              .then(() => {
                let queryString = 'UPDATE permission "GroupPermission"';
                queryString += `  set "groupName" = '${req.body.groupName}' where "groupID" = '${req.body.groupID}'`;
                return sequelize.query(queryString, { type: sequelize.QueryTypes.UPDATE })
                  .then(() => resolve(context.continue), error => utilities.winstonWrapper(`Update group name error: ${error}`));
              });
          } else {
            resolve(context.continue);
          }
        } else {
          resolve(context.continue);
        }
      }));
      return merge(authMilestone, totalAuthMilestone);
    }
    return totalAuthMilestone;
  },
  /** @function
   * @name updateGroup
   * @param {object} totalAuthMilestone
   * @param {Array} actionsList
   * @param {number} i - actionsList index
   * @param {*} aa
   * @param {string} name
   * @param {Array} userAAs
   * @param {boolean} isGroup
   * @param {object} awaitedGroupXrefModel
   * @return {object}
   * @description Returns a possibly modified version of totalAuthMilestone.
   */
  updateGroup(totalAuthMilestone, actionsList, i, aa, name, userAAs, isGroup, awaitedGroupXrefModel): {} {
    if ((actionsList[i] === 'update') && (isGroup === true)) {
      const authMilestone = {};
      authMilestone[actionsList[i]] = {};
      authMilestone[actionsList[i]].fetch = {};
      // eslint-disable-next-line
      authMilestone[actionsList[i]].fetch.before = ((req, res, context) => new Promise(async (resolve) => {
        if ((((req || {}).body || {}).id) && (((req || {}).user || {}).id)) {
          const findObj = {
            where: {
              groupID: req.body.id,
              groupResourceName: name,
              UserId: req.user.id,
            },
          };
          const findResults = await awaitedGroupXrefModel.findOne(findObj);
          if (findResults && findResults.UserId === req.user.id) {
            const {
              id, groupID, groupName, groupResourceName,
            } = req.body;
            const updateObj = {
              where: {
                groupID: req.body.id,
                groupResourceName: name,
              },
            };
            return awaitedGroupXrefModel.update({
              id, groupID, groupName, groupResourceName,
            }, updateObj)
              .then(() => resolve(context.continue), error => utilities.winstonWrapper(`Delete group milestone error: ${error}`));
          } else {
            resolve(context.continue);
          }
        } else {
          resolve(context.continue);
        }
      }));
      return merge(authMilestone, totalAuthMilestone);
    }
    return totalAuthMilestone;
  },
  /** @function
   * @name deleteGroup
   * @param {object} totalAuthMilestone
   * @param {Array} actionsList
   * @param {number} i - actionsList index
   * @param {*} aa
   * @param {string} name
   * @param {Array} userAAs
   * @param {object} awaitedGroupXrefModel
   * @param {boolean} isGroup
   * @return {object}
   * @description Returns a possibly modified version of totalAuthMilestone. Deletes GroupXref rows.
   */
  deleteGroup(totalAuthMilestone, actionsList, i, aa, name, userAAs, isGroup, awaitedGroupXrefModel): {} {
    if ((actionsList[i] === 'delete') && (isGroup === true)) {
      const authMilestone = {};
      authMilestone[actionsList[i]] = {};
      authMilestone[actionsList[i]].fetch = {};
      // eslint-disable-next-line
      authMilestone[actionsList[i]].fetch.before = ((req, res, context) => new Promise(async (resolve) => {
        if (((req || {}).url) && (((req || {}).user || {}).id)) {
          let reqUrlArray = req.url.split('/');
          reqUrlArray = reqUrlArray.filter(entry => entry.trim() !== '');
          const groupID = reqUrlArray.pop();
          const deleteObj = {
            where: {
              groupID,
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
   * @param {number} i - actionsList index
   * @param {*} aa
   * @param {string} name
   * @param {Array} userAAs
   * @param {string} message
   * @param {boolean} isGroup
   * @return {object}
   * @description Returns a possibly modified version of totalAuthMilestone.
   */
  deleteMessage(totalAuthMilestone: {}, actionsList: [], i: number, aa: any, name: string, userAAs: [], isGroup: boolean, message: string): {} {
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
   * @param {number} i - actionsList index
   * @return {object}
   * @description Returns a possibly modified version of totalAuthMilestone. Adds updatedBy to body
   */
  updateAsLoggedInUser(totalAuthMilestone: {}, actionsList: [], i: number): {} {
    if (actionsList[i] === 'update') {
      const authMilestone = {};
      authMilestone[actionsList[i]] = {};
      authMilestone[actionsList[i]].fetch = {};
      // eslint-disable-next-line
      authMilestone[actionsList[i]].fetch.before = ((req, res, context) => new Promise(async (resolve) => {
        req.body.updatedBy = this.returnUserId(req, false);
        resolve(context.continue);
      }));
      return merge(authMilestone, totalAuthMilestone);
    }
    return totalAuthMilestone;
  },
};
