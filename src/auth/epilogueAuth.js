import winston from 'winston';
import merge from 'deepmerge';
import defaultMilestones from './defaultMilestones';
import customMilestones from './customMilestones';
import config from '../config';
import utilities from '../utilities';
import epilogueSetup from '../epilogueSetup';
import testConfig from '../../test/testConfig.json';

// todo: Update functions here when the User resource is replaced with config
// todo: string that matches a User type resource
export default {
  /** @function
   * @name ownerGroupCheckWrapper
   * @param {object} req
   * @param {string} functionName
   * @return {*} False or Array
   * @description Helper function for isOwnerOfRegularResourceCheck, isOwnerOfGroupResourceCheck and isMemberOfGroupCheck
   */
  ownerGroupCheckWrapper(req, functionName) {
    let reqUrlArray;
    if ((req || {}).url && ((req || {}).user || {}).id) {
      reqUrlArray = req.url.split('/');
      reqUrlArray = reqUrlArray.filter(entry => entry.trim() !== '');
      return reqUrlArray;
    } else if (!(((req || {}).user || {}).id)) {
      utilities.winstonWrapper(`req.user.id missing in ${functionName}`, 'info');
      return false;
    } else {
      utilities.winstonWrapper(`req.url missing in ${functionName}`, 'info');
      return false;
    }
  },
  /** @function
   * @name isOwnerOfRegularResourceCheck
   * @param {object} req
   * @param {Array} cleanedEndpointsArray
   * @param {Array} actionsList - ['list', 'create', 'read', 'update', 'delete']
   * @param {object} resource
   * @param {number} index - index of the action list
   * @return boolean
   * @description Checks if the user is the owner of a resource. Group ownership checking is done in another function
   */
  async isOwnerOfRegularResourceCheck(req, cleanedEndpointsArray, actionsList, resource, index) {
    const reqUrlArray = this.ownerGroupCheckWrapper(req, this.name);
    if (reqUrlArray === false) {
      return reqUrlArray;
    }
    if (reqUrlArray[0] === 'users' && cleanedEndpointsArray.indexOf(reqUrlArray[2]) >= 0) {
      if (req.user.id === reqUrlArray[1]) {
        return true;
      } else {
        utilities.winstonWrapper('Wrong user id using users/... url format', 'info');
        return false;
      }
    } else if (cleanedEndpointsArray.indexOf(reqUrlArray[0]) >= 0) {
      if (this.trueForCreateOrList(actionsList, index, req)) {
        return this.trueForCreateOrList(actionsList, index, req);
      } else if (reqUrlArray[1]) {
        if (cleanedEndpointsArray.indexOf('users') && reqUrlArray[1] === req.user.id) {
          return true;
        } else {
          const findOneObj = {
            where: { id: reqUrlArray[1] },
          };
          if (resource[0] === 'User') {
            findOneObj.attributes = ['id'];
          } else {
            findOneObj.attributes = ['UserId'];
          }
          const foundResource = await resource[2].findOne(findOneObj);
          if (resource[0] === 'User' && (foundResource || {}).id && foundResource.id === req.user.id) {
            return true;
          } else if ((foundResource || {}).UserId && foundResource.UserId === req.user.id) {
            return true;
          } else {
            utilities.winstonWrapper(`Can not update/delete/read resource, not owned by current user (current user: ${req.user.id})`, 'info');
            return false;
          }
        }
      } else {
        utilities.winstonWrapper('Only one URL level deep for update/delete/read', 'info');
        return false;
      }
    } else {
      utilities.winstonWrapper('URL is not in either users/... or resource/... format', 'info');
      return false;
    }
  },
  /** @function
   * @name isOwnerOfGroupResourceCheck
   * @param {object} req
   * @param {Array} actionsList - ['list', 'create', 'read', 'update', 'delete']
   * @param {object} resource
   * @param {number} index - index of the action list
   * @return boolean
   * @description Checks if the user is the group owner of a group resource
   */
  async isOwnerOfGroupResourceCheck(req, actionsList, resource, index) {
    const reqUrlArray = this.ownerGroupCheckWrapper(req, this.name);
    if (reqUrlArray === false) {
      return reqUrlArray;
    }
    if (this.trueForCreateOrList(actionsList, index, req)) {
      return this.trueForCreateOrList(actionsList, index, req);
    } else {
      const foundResource = await resource[2].findOne({
        attributes: ['OwnerID'],
        where: { id: reqUrlArray[1] },
      });
      if ((foundResource || {}).OwnerID && foundResource.OwnerID === req.user.id) {
        return true;
      } else {
        utilities.winstonWrapper('Can not update/delete/read group resource, not owned by current user', 'info');
        return false;
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
   * @return boolean
   * @description Checks if the user is a group member
   */
  async isMemberOfGroupCheck(req, actionsList, resource, index, awaitedGroupXrefModel) {
    const reqUrlArray = this.ownerGroupCheckWrapper(req, this.name);
    if (reqUrlArray === false) {
      return reqUrlArray;
    }
    if (this.trueForCreateOrList(actionsList, index, req)) {
      return this.trueForCreateOrList(actionsList, index, req);
    } else {
      const foundResource = await awaitedGroupXrefModel.findOne({
        attributes: ['userID', 'groupID', 'groupResourceName'],
        where: { userID: req.user.id, groupID: reqUrlArray[1], groupResourceName: resource[0] },
      });
      if (foundResource) {
        return true;
      } else {
        utilities.winstonWrapper('Can not update/delete/read group resource, not a member', 'info');
        return false;
      }
    }
  },
  /** @function
   * @name trueForCreateOrList
   * @param {Array} actionsList - ['list', 'create', 'read', 'update', 'delete']
   * @param {number} index - index of the action list
   * @param {object} req
   * @return boolean
   * @description Returns true for action is create or list and the user is not a guest
   */
  trueForCreateOrList(actionsList, index, req) {
    return Boolean((actionsList[index] === 'create' || actionsList[index] === 'list') && (((req || {}).user || {}).id));
  },
  /** @function
   * @name belongsToUserResourceCheck
   * @param {*} resourceAAs - Non-converted AAs
   * @return boolean
   * @description Returns true if the resource belongs to the User resource
   * @todo Update this documentation when the User resource is replaced
   */
  belongsToUserResourceCheck(resourceAAs) {
    let belongsToUserReturn = false;
    const convertedResourceAAs = epilogueSetup.convertAutoAssociations(resourceAAs);
    convertedResourceAAs.forEach(([aaType, resourceName]) => {
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
   * @description Finishes milestone creation for the resources, with auth milestones being created for every resource
   */
  async setupAuthCheck(resourcesFromSetup, groupXrefModel) {
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

    const winstonConfig = {
      tailable: utilities.yesTrueNoFalse(config.winston.tailable),
      maxsize: config.winston.maxsize,
      maxFiles: config.winston.maxFiles,
      zippedArchive: utilities.yesTrueNoFalse(config.winston.zippedArchive),
    };

    winstonConfig.filename = 'logs/unauthorized.log';
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

          isGroup = resource[6];
          permissions = this.convertRealOrTestPermissions(resource[1], resource[0], isHttpTest, validTestNumber);

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

          if (isGroup === true) {
            currentUserOwnsResource = await this.isOwnerOfGroupResourceCheck(req, actionsList, resource, i);
            memberOfGroup = await this.isMemberOfGroupCheck(req, actionsList, resource, i, awaitedGroupXrefModel);
          } else {
            currentUserOwnsResource = await this.isOwnerOfRegularResourceCheck(req, cleanedEndpointsArray, actionsList, resource, i);
          }

          if ((permissions[i] === true) && (currentUserOwnsResource === true)) {
            resolve(context.continue);
          } else if ((permissions[i + 5] === true) && (isGroup === true) && (memberOfGroup === true)) {
            resolve(context.continue);
          } else if ((permissions[i + 10] === true) && req && req.user && req.user.id && (req.user.id !== '')) {
            resolve(context.continue);
          } else if (permissions[i + 15] === true) {
            resolve(context.continue);
            // VVV --- else if (group stuff) { ---- VVV
          } else {
            const unauthObj = {
              userID: ((req || {}).user || {}).id,
              resource: resource[0],
            };
            unauthorizedLog.info(unauthObj);
            res.status(401).send({ message: 'Unauthorized' });
            resolve(context.stop);
          }
        }));

        const milestoneParamObj = {
          ownResource: [isGroup],
          listOwned: [resource[2], isHttpTest, validTestNumber, resource[1]],
        };
        const sharedParameters = [actionsList, i, resource[5], resource[0], userAAs];
        const addMilestonesParams = [milestoneParamObj, sharedParameters, authMilestone];
        authMilestone = defaultMilestones.addMilestones(...addMilestonesParams);

        const totalParameters = [authMilestone, actionsList, i, resource, isHttpTest, validTestNumber];
        authMilestone = customMilestones.addMilestones(...totalParameters);
      }
      combinedMilestones = merge(authMilestone, resource[7]);
      resource[8].use(combinedMilestones);
    });
  },
  /** @function
   * @name createInitPermissionsArray
   * @param {*} defaultBool - should be a boolean or something that is clearly meant to be truthy or falsy
   * @return {Array}
   * @description Creates a 20 boolean array with all true or all false
   */
  createInitPermissionsArray(defaultBool) {
    let defaultPermissions = false;
    if (defaultBool) {
      defaultPermissions = true;
    }
    const permissionsReturn = [];
    for (let i = 0; i < 20; i += 1) {
      permissionsReturn.push(defaultPermissions);
    }
    return permissionsReturn;
  },
  /** @function
   * @name convertNumberPermissions
   * @param {number} permissionsInput
   * @return {Array}
   * @description For number permissions, read being true means list is true as well (list permissions can't be directly set)
   */
  convertNumberPermissions(permissionsInput) {
    const permissionsReturn = this.createInitPermissionsArray(false);
    if (!Number.isFinite(permissionsInput)) {
      utilities.winstonWrapper('Infinite number!', 'warning');
      return permissionsReturn;
    }
    const inputInBinary = permissionsInput.toString(2);
    let inputInBinaryBackwards = '';
    for (let i = inputInBinary.length - 1; i >= 0; i -= 1) {
      inputInBinaryBackwards += inputInBinary[i];
    }
    let permissionsBit;
    let permissionsReturnIndex = 0;
    for (let i = 0; i < inputInBinaryBackwards.length; i += 1) {
      permissionsBit = inputInBinaryBackwards.charAt(i);
      if (permissionsBit === '1') {
        permissionsReturn[permissionsReturnIndex] = true;
        if ((i % 4) === 2) {
          permissionsReturn[permissionsReturnIndex + 2] = true;
        }
      } else if (permissionsBit === '0') {
        permissionsReturn[permissionsReturnIndex] = false;
      } else {
        utilities.winstonWrapper('Permission bit not a one or a zero!', 'warning');
      }
      if ((i % 4) === 3) {
        permissionsReturnIndex += 1;
      }
      permissionsReturnIndex += 1;
    }
    return permissionsReturn.reverse();
  },
  /** @function
   * @name stringPermissionsRegex
   * @param {string} permissionsInputCleaned
   * @return {string}
   * @description Does regex cleaning on the partially cleaned permissions string
   */
  stringPermissionsRegex(permissionsInputCleaned) {
    let permissionsInputCleanedReturn = permissionsInputCleaned.replace(/^\s+/g, '');
    permissionsInputCleanedReturn = permissionsInputCleanedReturn.replace(/n\/a/g, '|');
    permissionsInputCleanedReturn = permissionsInputCleanedReturn.replace(/na/g, '|');
    permissionsInputCleanedReturn = permissionsInputCleanedReturn.replace(/n/g, '|');
    permissionsInputCleanedReturn = permissionsInputCleanedReturn.replace(/x/g, '|');
    permissionsInputCleanedReturn = permissionsInputCleanedReturn.replace(/\s+\|/g, '|');
    permissionsInputCleanedReturn = permissionsInputCleanedReturn.replace(/\|\s+/g, '|');
    permissionsInputCleanedReturn = permissionsInputCleanedReturn.replace(/\s+/g, '|');
    permissionsInputCleanedReturn = permissionsInputCleanedReturn.replace(/\*/g, 'lcrud');
    permissionsInputCleanedReturn = permissionsInputCleanedReturn.replace(/list|ls/g, 'l');
    permissionsInputCleanedReturn = permissionsInputCleanedReturn.replace(/read/g, 'r');
    permissionsInputCleanedReturn = permissionsInputCleanedReturn.replace(/update|upd/g, 'u');
    permissionsInputCleanedReturn = permissionsInputCleanedReturn.replace(/destroy|dstr/g, 'd');
    permissionsInputCleanedReturn = permissionsInputCleanedReturn.replace(/[^lcrud|]/g, '');
    permissionsInputCleanedReturn = permissionsInputCleanedReturn.replace(/d(?!\|)/g, 'd|');
    permissionsInputCleanedReturn = permissionsInputCleanedReturn.replace(/u(?!\||d)/g, 'u|');
    permissionsInputCleanedReturn = permissionsInputCleanedReturn.replace(/r(?!\||d|u)/g, 'r|');
    permissionsInputCleanedReturn = permissionsInputCleanedReturn.replace(/c(?!\||d|u|r)/g, 'c|');
    permissionsInputCleanedReturn = permissionsInputCleanedReturn.replace(/l(?!\||d|u|r|c)/g, 'l|');
    return permissionsInputCleanedReturn;
  },
  /** @function
   * @name numericStringPermissions
   * @param {string} permissionsInput
   * @param {string} permissionsInputCleaned
   * @param {Array} permissionsReturn
   * @return {*} False or Array
   * @description Returns permissions array if string is numeric. Returns permissionsReturn as is if numbers and strings are mixed
   */
  numericStringPermissions(permissionsInput, permissionsInputCleaned, permissionsReturn) {
    let returnValue = false;
    let numberSubStringStart = null;
    if (!Number.isNaN(Number(permissionsInput))) {
      returnValue = this.convertNumberPermissions(Number(permissionsInput));
    } else if (permissionsInputCleaned.indexOf('0x') > -1) {
      numberSubStringStart = permissionsInputCleaned.indexOf('0x');
    } else if (permissionsInputCleaned.indexOf('0o') > -1) {
      numberSubStringStart = permissionsInputCleaned.indexOf('0o');
    } else if (permissionsInputCleaned.indexOf('0b') > -1) {
      numberSubStringStart = permissionsInputCleaned.indexOf('0b');
    } else if (/\d/.test(permissionsInputCleaned)) {
      utilities.winstonWrapper('Can not mix strings and numbers!', 'warning');
      returnValue = permissionsReturn;
    }
    if (numberSubStringStart || numberSubStringStart === 0) {
      if (!Number.isNaN(Number(permissionsInputCleaned.substr(numberSubStringStart)))) {
        returnValue = this.convertNumberPermissions(Number(permissionsInputCleaned.substr(numberSubStringStart)));
      } else {
        utilities.winstonWrapper('NaN, but should be a number!', 'warning');
      }
    }
    return returnValue;
  },
  /** @function
   * @name convertStringPermissions
   * @param {string} permissionsInput
   * @return {Array}
   * @description Sends number strings to convertNumberPermissions, otherwise, string permissions are converted
   */
  convertStringPermissions(permissionsInput) {
    const permissionsReturn = this.createInitPermissionsArray();
    let permissionsInputCleaned = permissionsInput.toLowerCase();

    const numericReturn = this.numericStringPermissions(permissionsInput, permissionsInputCleaned, permissionsReturn);
    if (numericReturn !== false) {
      return numericReturn;
    }

    permissionsInputCleaned = this.stringPermissionsRegex(permissionsInputCleaned);

    let permissionIndex = 0;
    let permissionLetter;
    let lengthOfSection;
    let letterIndex = 0;
    let findSectionLengthSubString;
    let nextNonPipeIndex;
    let nonPipeIndexFound;
    while (letterIndex < permissionsInputCleaned.length) {
      for (let section = 0; section < 4; section += 1) {
        findSectionLengthSubString = permissionsInputCleaned.substr(letterIndex);
        nextNonPipeIndex = letterIndex;
        nonPipeIndexFound = false;
        lengthOfSection = findSectionLengthSubString.length;
        while (nonPipeIndexFound === false && nextNonPipeIndex < permissionsInputCleaned.length) {
          if (findSectionLengthSubString.indexOf('|') > 0) {
            lengthOfSection = (findSectionLengthSubString.substr(0, findSectionLengthSubString.indexOf('|'))).length;
            nonPipeIndexFound = true;
          } else {
            if (findSectionLengthSubString.indexOf('|') === 0 && section === 0) {
              section += 1;
            } else if (findSectionLengthSubString.indexOf('||') === 0) {
              section += 1;
            }
            nextNonPipeIndex += 1;
            findSectionLengthSubString = permissionsInputCleaned.substr(nextNonPipeIndex);
          }
        }
        // todo move to function
        for (let lcrudIndex = 0; lcrudIndex < lengthOfSection; lcrudIndex += 1) {
          permissionLetter = permissionsInputCleaned.charAt(letterIndex);
          if (permissionLetter === 'l') {
            permissionIndex = section * 5;
            permissionsReturn[permissionIndex] = true;
          } else if (permissionLetter === 'c') {
            permissionIndex = (section * 5) + 1;
            permissionsReturn[permissionIndex] = true;
          } else if (permissionLetter === 'r') {
            permissionIndex = (section * 5) + 2;
            permissionsReturn[permissionIndex] = true;
          } else if (permissionLetter === 'u') {
            permissionIndex = (section * 5) + 3;
            permissionsReturn[permissionIndex] = true;
          } else if (permissionLetter === 'd') {
            permissionIndex = (section * 5) + 4;
            permissionsReturn[permissionIndex] = true;
          } else if (permissionLetter) {
            lengthOfSection += 1;
          }
          letterIndex += 1;
        }
      }
    }
    return permissionsReturn;
  },
  /** @function
   * @name convertArrayPermissions
   * @param {Array} permissionsInput
   * @return {Array}
   */
  convertArrayPermissions(permissionsInput) {
    const permissionsReturn = [];
    permissionsInput.forEach((permissionsElement) => {
      if ((typeof permissionsElement) === 'boolean') {
        permissionsReturn.push(permissionsElement);
      }
    });
    for (let i = permissionsReturn.length; i < 20; i += 1) {
      permissionsReturn.push(false);
    }
    return permissionsReturn;
  },
  /** @function
   * @name convertObjectPermissions
   * @param {object} permissionsInput
   * @return {Array}
   * @description Object of arrays with strings as elements. Non-string elements are meaningless
   */
  convertObjectPermissions(permissionsInput) {
    let permissionKey;
    let sectionMultiplier;
    let permissionArrayElement;
    let permissionsReturnIndex;
    let permissionsSectionArrayLength;
    const permissionsReturn = this.createInitPermissionsArray();
    const propertiesLength = Object.keys(permissionsInput).length;
    for (let propertyIndex = 0; propertyIndex < propertiesLength; propertyIndex += 1) {
      permissionKey = Object.keys(permissionsInput)[propertyIndex];
      // todo move to function
      if (permissionKey.toLowerCase() === 'owner') {
        sectionMultiplier = 0;
      } else if (permissionKey.toLowerCase() === 'group') {
        sectionMultiplier = 1;
      } else if (permissionKey.toLowerCase() === 'loggedinuser') {
        sectionMultiplier = 2;
      } else if (permissionKey.toLowerCase() === 'anyuser') {
        sectionMultiplier = 3;
      } else {
        utilities.winstonWrapper('unhandled permission section!', 'warning');
      }
      if (Array.isArray(permissionsInput[permissionKey])) {
        permissionsSectionArrayLength = permissionsInput[permissionKey].length;
        for (let arrayIndex = 0; arrayIndex < permissionsSectionArrayLength; arrayIndex += 1) {
          if ((typeof permissionsInput[permissionKey][arrayIndex]) === 'string') {
            permissionArrayElement = (permissionsInput[permissionKey][arrayIndex]).toLowerCase();
            permissionsReturnIndex = (sectionMultiplier * 5);
            // todo: move to function
            if (permissionArrayElement === 'list' || permissionArrayElement === 'l') {
              permissionsReturn[permissionsReturnIndex] = true;
            } else if (permissionArrayElement === 'create' || permissionArrayElement === 'c') {
              permissionsReturnIndex += 1;
              permissionsReturn[permissionsReturnIndex] = true;
            } else if (permissionArrayElement === 'read' || permissionArrayElement === 'r') {
              permissionsReturnIndex += 2;
              permissionsReturn[permissionsReturnIndex] = true;
            } else if (permissionArrayElement === 'update' || permissionArrayElement === 'u') {
              permissionsReturnIndex += 3;
              permissionsReturn[permissionsReturnIndex] = true;
            } else if (permissionArrayElement === 'destroy' || permissionArrayElement === 'd') {
              permissionsReturnIndex += 4;
              permissionsReturn[permissionsReturnIndex] = true;
            } else {
              utilities.winstonWrapper('Unhandled resource operation!', 'warning');
            }
          } else {
            utilities.winstonWrapper('permissionsInput[permissionKey][arrayIndex] should be a string!', 'warning');
          }
        }
      } else {
        utilities.winstonWrapper('permissionsInput[permissionKey] should be an array!', 'warning');
      }
    }
    return permissionsReturn;
  },
  /** @function
   * @name convertPermissions
   * @param {*} permissionsInput
   * @return {Array}
   * @description Passes permissions to the other permissions functions based on input type
   */
  convertPermissions(permissionsInput) {
    if (permissionsInput) {
      if ((typeof permissionsInput) === 'string') {
        return this.convertStringPermissions(permissionsInput);
      } else if ((typeof permissionsInput) === 'object') {
        if (Array.isArray(permissionsInput)) {
          return this.convertArrayPermissions(permissionsInput);
        } else {
          return this.convertObjectPermissions(permissionsInput);
        }
      } else if ((typeof permissionsInput) === 'number') {
        return this.convertNumberPermissions(permissionsInput);
      } else {
        utilities.winstonWrapper('permissionsInput not a string, object, number or array!', 'warning');
        return this.createInitPermissionsArray(true);
      }
    } else {
      utilities.winstonWrapper('no permissionsInput!', 'warning');
      return this.createInitPermissionsArray(true);
    }
  },
  /** @function
   * @name convertRealOrTestPermissions
   * @param {*} permissionsInput
   * @param {string} resourceName
   * @param {boolean} isHttpTest - Should be boolean or something that is clearly truthy or falsy
   * @param {boolean} validTestNumber - Should be boolean or something that is clearly truthy or falsy
   * @return {Array}
   * @description Passes real permissions or test permissions to convertPermissions
   */
  convertRealOrTestPermissions(permissionsInput, resourceName, isHttpTest, validTestNumber) {
    if (isHttpTest && validTestNumber && testConfig.testCases[testConfig.testNumber - 1].aaOrAccess === 'access') {
      const testPermissionsArray = testConfig.testCases[testConfig.testNumber - 1].permissions;
      if (testPermissionsArray.indexOf(resourceName) >= 0) {
        return this.convertPermissions(testPermissionsArray[testPermissionsArray.indexOf(resourceName) + 1]);
      }
    }
    return this.convertPermissions(permissionsInput);
  },
};
