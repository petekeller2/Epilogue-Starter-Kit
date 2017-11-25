// @flow
import winston from 'winston';
import merge from 'deepmerge';
import defaultMilestones from './defaultMilestones';
import customMilestones from './customMilestones';
import groups from './groups';
import permissionConversions from './permissionConversions';
import config from '../config';
import utilities from '../utilities';
import epilogueSetup from '../epilogueSetup';
import testConfig from '../../test/testConfig.json';

export default {
  /** @function
   * @name ownerGroupCheckWrapper
   * @param {object} req
   * @param {string} functionName
   * @return {(boolean|Array)} False or Array
   * @description Helper function for isOwnerOfRegularResourceCheck, isOwnerOfGroupResourceCheck and isMemberOfGroupCheck
   */
  ownerGroupCheckWrapper(req: {}, functionName: string): boolean | [] {
    let reqUrlArray;
    if ((req || {}).url && this.hasUserId(req)) {
      reqUrlArray = req.url.split('/');
      reqUrlArray = reqUrlArray.filter(entry => entry.trim() !== '');
      return reqUrlArray;
    } else if (!this.hasUserId(req)) {
      utilities.winstonWrapper(`req.user.id missing in ${functionName}`, 'info');
      return false;
    } else {
      utilities.winstonWrapper(`req.url missing in ${functionName}`, 'info');
      return false;
    }
  },
  /** @function
   * @name hasUserId
   * @param {object} req
   * @return {boolean}
   */
  hasUserId(req: {}): boolean {
    return (((req || {}).user || {}).id);
  },
  /** @function
   * @name isOwnerOfRegularResourceCheck
   * @param {object} req
   * @param {Array} cleanedEndpointsArray
   * @param {Array} actionsList - ['list', 'create', 'read', 'update', 'delete']
   * @param {object} resource
   * @param {number} index - index of the action list
   * @return {boolean}
   * @description Checks if the user is the owner of a resource. Group ownership checking is done in another function
   */
  async isOwnerOfRegularResourceCheck(req: {}, cleanedEndpointsArray: [], actionsList: [], resource: {}, index: number): boolean {
    const reqUrlArray = this.ownerGroupCheckWrapper(req, this.name);
    if (reqUrlArray === false) {
      return reqUrlArray;
    }
    if (reqUrlArray[0] === 'users' && cleanedEndpointsArray.indexOf(reqUrlArray[2]) >= 0) {
      return this.usersUrlCheckHelper(req, reqUrlArray);
    } else if (cleanedEndpointsArray.indexOf(reqUrlArray[0]) >= 0) {
      const trueForCreateOrListReturn = this.trueForCreateOrList(actionsList, index, req);
      if (trueForCreateOrListReturn) {
        return trueForCreateOrListReturn;
      } else if (reqUrlArray[1]) {
        if (cleanedEndpointsArray.indexOf('users') && reqUrlArray[1] === req.user.id) {
          return true;
        } else {
          const findOneObj = this.buildFindOneObj(reqUrlArray, resource);
          const foundResource = await resource[2].findOne(findOneObj);
          return this.searchUserResourceCheckHelper(resource, foundResource, req);
        }
      } else {
        return utilities.winstonWrapper('Only one URL level deep for update/delete/read', 'info', false);
      }
    } else {
      return utilities.winstonWrapper('URL is not in either users/... or resource/... format', 'info', false);
    }
  },
  /** @function
   * @name buildFindOneObj
   * @param {Array} reqUrlArray
   * @param {Array} resource
   * @return {object}
   * @description Helper function for isOwnerOfRegularResourceCheck
   */
  buildFindOneObj(reqUrlArray: [], resource: []): {} {
    const findOneObj = {
      where: { id: reqUrlArray[1] },
    };
    if (resource[0] === 'User') {
      findOneObj.attributes = ['id'];
    } else {
      findOneObj.attributes = ['UserId'];
    }
    return findOneObj;
  },
  /** @function
   * @name usersUrlCheckHelper
   * @param {object} req
   * @param {Array} reqUrlArray
   * @return {boolean}
   * @description Helper function for isOwnerOfRegularResourceCheck
   */
  usersUrlCheckHelper(req: {}, reqUrlArray: []) {
    if (req.user.id === reqUrlArray[1]) {
      return true;
    } else {
      return utilities.winstonWrapper('Wrong user id using users/... url format', 'info', false);
    }
  },
  /** @function
   * @name searchUserResourceCheckHelper
   * @param {Array} resource
   * @param {object} foundResource
   * @param {object} req
   * @return {boolean}
   * @description Helper function for isOwnerOfRegularResourceCheck
   */
  searchUserResourceCheckHelper(resource: [], foundResource: {}, req: {}): boolean {
    if (resource[0] === 'User' && (foundResource || {}).id && foundResource.id === req.user.id) {
      return true;
    } else if ((foundResource || {}).UserId && foundResource.UserId === req.user.id) {
      return true;
    } else {
      const longMessage = `Can not update/delete/read resource, not owned by current user (current user: ${req.user.id})`;
      return utilities.winstonWrapper(longMessage, 'info', false);
    }
  },
  /** @function
   * @name isOwnerOfGroupResourceCheck
   * @param {object} req
   * @param {Array} actionsList - ['list', 'create', 'read', 'update', 'delete']
   * @param {object} resource
   * @param {number} index - index of the action list
   * @return {boolean}
   * @description Checks if the user is the group owner of a group resource
   */
  async isOwnerOfGroupResourceCheck(req: {}, actionsList: [], resource: {}, index: number): boolean {
    const reqUrlArray = this.ownerGroupCheckWrapper(req, this.name);
    if (reqUrlArray === false) {
      return reqUrlArray;
    }
    const trueForCreateOrListReturn = this.trueForCreateOrList(actionsList, index, req);
    if (trueForCreateOrListReturn) {
      return trueForCreateOrListReturn;
    } else {
      const foundResource = await resource[2].findOne({
        attributes: ['OwnerID'],
        where: { id: reqUrlArray[1] },
      });
      if ((foundResource || {}).OwnerID && foundResource.OwnerID === req.user.id) {
        return true;
      } else {
        return utilities.winstonWrapper('Can not update/delete/read group resource, not owned by current user', 'info', false);
      }
    }
  },
  /** @function
   * @name isMemberOfGroupCheck
   * @param {object} req
   * @param {Array} actionsList - ['list', 'create', 'read', 'update', 'delete']
   * @param {object} resource
   * @param {number} index - index of the action list
   * @param {object} awaitedGroupXrefModel
   * @return {boolean}
   * @description Checks if the user is a group member
   */
  async isMemberOfGroupCheck(req: {}, actionsList: [], resource: {}, index: number, awaitedGroupXrefModel: {}): boolean {
    const reqUrlArray = this.ownerGroupCheckWrapper(req, this.name);
    if (reqUrlArray === false) {
      return reqUrlArray;
    }
    const trueForCreateOrListReturn = this.trueForCreateOrList(actionsList, index, req);
    if (trueForCreateOrListReturn) {
      return trueForCreateOrListReturn;
    } else {
      const foundResource = await awaitedGroupXrefModel.findOne({
        attributes: ['UserId', 'groupID', 'groupResourceName'],
        where: { UserId: req.user.id, groupID: reqUrlArray[1], groupResourceName: resource[0] },
      });
      if (foundResource) {
        return true;
      } else {
        return utilities.winstonWrapper('Can not update/delete/read group resource, not a member', 'info', false);
      }
    }
  },
  /** @function
   * @name trueForCreateOrList
   * @param {Array} actionsList - ['list', 'create', 'read', 'update', 'delete']
   * @param {number} index - index of the action list
   * @param {object} req
   * @return {boolean}
   * @description Returns true for action is create or list and the user is not a guest
   */
  trueForCreateOrList(actionsList: [], index: number, req: {}): boolean {
    return Boolean((actionsList[index] === 'create' || actionsList[index] === 'list') && this.hasUserId(req));
  },
  /** @function
   * @name belongsToUserResourceCheck
   * @param {*} resourceAAs - Non-converted AAs
   * @return {boolean}
   * @description Returns true if the resource belongs to the User resource
   */
  belongsToUserResourceCheck(resourceAAs: any): boolean {
    let belongsToUserReturn = false;
    const convertedResourceAAs = epilogueSetup.convertAutoAssociations(resourceAAs);
    convertedResourceAAs.forEach((convertedResource) => {
      const aaType = Object.keys(convertedResource)[0];
      const resourceName = convertedResource[aaType];
      if ((aaType === 'belongsTo' || aaType === 'belongsToMany') && (resourceName === 'User')) {
        belongsToUserReturn = true;
      }
    });
    return belongsToUserReturn;
  },
  /** @function
   * @name setupAuthCheck
   * @param {map} resourcesFromSetup
   * @param {object} groupXrefModel
   * @param {object} database
   * @description Finishes milestone creation for the resources, with auth milestones being created for every resource
   */
  async setupAuthCheck(resourcesFromSetup: Map, groupXrefModel: {}, database: {}) {
    let permissions;
    let cleanedEndpointsArray;
    let currentUserOwnsResource;
    let memberOfGroup;
    let isGroup;
    let authMilestone = {};
    let combinedMilestones = {};
    const awaitedGroupXrefModel = await groupXrefModel;
    const isHttpTest = Boolean((config.environment === 'testing' || config.environment === 'staging') && testConfig.individualHttpTest === true);
    const validTestNumber = Boolean(testConfig.testCases[testConfig.testNumber - 1]);

    const winstonConfig = utilities.setUpWinstonLogger('logs/unauthorized.log');
    winston.loggers.add('unauthorized', {
      file: winstonConfig,
    });
    const unauthorizedLog = winston.loggers.get('unauthorized');

    const actionsList = ['list', 'create', 'read', 'update', 'delete'];
    const awaitedResourcesFromSetup = await resourcesFromSetup;
    let userAAs = awaitedResourcesFromSetup.get('User')[5];
    userAAs = epilogueSetup.convertAutoAssociations(userAAs, true);
    awaitedResourcesFromSetup.forEach((resource) => {
      authMilestone = {};
      for (let i = 0; i < actionsList.length; i += 1) {
        authMilestone[actionsList[i]] = {};
        // eslint-disable-next-line
        authMilestone[actionsList[i]].auth = ((req, res, context) => new Promise(async(resolve) => {
          // eslint-disable-next-line
          isGroup = resource[6];
          permissions = permissionConversions.convertRealOrTestPermissions(resource[1], resource[0], isHttpTest, validTestNumber);

          cleanedEndpointsArray = [];
          resource[3].forEach((endpoint) => {
            cleanedEndpointsArray.push(endpoint.replace(/\//gi, ''));
          });

          if (isHttpTest && validTestNumber && testConfig.testCases[testConfig.testNumber - 1].userID) {
            if (!req.user) {
              // eslint-disable-next-line
              req.user = {};
            }
            // eslint-disable-next-line
            req.user.id = testConfig.testCases[testConfig.testNumber - 1].userID;
          }

          if (req && req.user && req.user.id && (req.user.id !== '')) {
            if (isGroup === true) {
              currentUserOwnsResource = await this.isOwnerOfGroupResourceCheck(req, actionsList, resource, i);
              memberOfGroup = await this.isMemberOfGroupCheck(req, actionsList, resource, i, awaitedGroupXrefModel);
            } else {
              currentUserOwnsResource = await this.isOwnerOfRegularResourceCheck(req, cleanedEndpointsArray, actionsList, resource, i);
            }
          }

          if ((permissions[i] === true) && (currentUserOwnsResource === true)) {
            resolve(context.continue);
          } else if ((permissions[i + 5] === true) && (isGroup === true) && (memberOfGroup === true)) {
            resolve(context.continue);
          } else if ((permissions[i + 10] === true) && req && req.user && req.user.id && (req.user.id !== '')) {
            resolve(context.continue);
          } else if (permissions[i + 15] === true) {
            resolve(context.continue);
          } else if ((permissions[6] === true) && (groups.accessCheck(false, req, database, resource[0], i) === true)) {
            resolve(context.continue);
          } else {
            const unauthObj = {
              userID: ((req || {}).user || {}).id,
              resource: resource[0],
              ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
            };
            unauthorizedLog.info(unauthObj);
            res.status(401).send({ message: utilities.displayMessage('unauthorized') });
            resolve(context.stop);
          }
        }));

        const milestoneParamObj = {
          ownResource: [isHttpTest, validTestNumber, resource[1], database],
          listOwned: [resource[2], isHttpTest, validTestNumber, resource[1], awaitedGroupXrefModel],
          updateAsLoggedInUser: [],
          readGroup: [awaitedGroupXrefModel, isHttpTest, validTestNumber, resource[1]],
          updateGroupName: [awaitedGroupXrefModel, database],
          updateGroup: [awaitedGroupXrefModel],
          deleteGroup: [awaitedGroupXrefModel],
          deleteMessage: [utilities.displayMessage('deleteMessage')],
        };
        const sharedParameters = [actionsList, i, resource[5], resource[0], userAAs, resource[6]];
        const addMilestonesParams = [milestoneParamObj, sharedParameters, authMilestone];
        authMilestone = defaultMilestones.addMilestones(...addMilestonesParams);

        const totalParameters = [authMilestone, actionsList, i, resource, isHttpTest, validTestNumber];
        authMilestone = customMilestones.addMilestones(...totalParameters);
      }
      combinedMilestones = merge(authMilestone, resource[7]);
      resource[8].use(combinedMilestones);
    });
  },
};
