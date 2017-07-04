import winston from 'winston';
import merge from 'deepmerge';
import defaultMilestones from './defaultMilestones';
import customMilestones from './customMilestones';
import groups from './groups';
import config from '../config';
import utilities from '../utilities';
import epilogueSetup from '../epilogueSetup';
import testConfig from '../../test/testConfig.json';

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
  hasUserId(req) {
    return (((req || {}).user || {}).id);
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
   * @param {object} reqUrlArray
   * @param {Array} resource
   * @return {object}
   * @description Helper function for isOwnerOfRegularResourceCheck
   */
  buildFindOneObj(reqUrlArray, resource) {
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
   * @param {object} reqUrlArray
   * @return {boolean}
   * @description Helper function for isOwnerOfRegularResourceCheck
   */
  usersUrlCheckHelper(req, reqUrlArray) {
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
  searchUserResourceCheckHelper(resource, foundResource, req) {
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
   * @return boolean
   * @description Checks if the user is the group owner of a group resource
   */
  async isOwnerOfGroupResourceCheck(req, actionsList, resource, index) {
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
   * @return boolean
   * @description Checks if the user is a group member
   */
  async isMemberOfGroupCheck(req, actionsList, resource, index, awaitedGroupXrefModel) {
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
   * @return boolean
   * @description Returns true for action is create or list and the user is not a guest
   */
  trueForCreateOrList(actionsList, index, req) {
    return Boolean((actionsList[index] === 'create' || actionsList[index] === 'list') && this.hasUserId(req));
  },
  /** @function
   * @name belongsToUserResourceCheck
   * @param {*} resourceAAs - Non-converted AAs
   * @return boolean
   * @description Returns true if the resource belongs to the User resource
   */
  belongsToUserResourceCheck(resourceAAs) {
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
  async setupAuthCheck(resourcesFromSetup, groupXrefModel, database) {
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
          readGroup: [awaitedGroupXrefModel, isHttpTest, validTestNumber, resource[1]],
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
   * @name reverseInputInBinary
   * @param {string} inputInBinary
   * @return {string}
   * @description Helper function for convertNumberPermissions
   */
  reverseInputInBinary(inputInBinary) {
    let inputInBinaryBackwards = '';
    for (let i = inputInBinary.length - 1; i >= 0; i -= 1) {
      inputInBinaryBackwards += inputInBinary[i];
    }
    return inputInBinaryBackwards;
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
    const inputInBinaryBackwards = this.reverseInputInBinary(inputInBinary);
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
   * @param {string} permissionsInputPartiallyCleaned
   * @return {string}
   * @description Regex cleaning on the partially cleaned permissions string
   */
  stringPermissionsRegex(permissionsInputPartiallyCleaned) {
    let permissionsInputCleanedReturn = permissionsInputPartiallyCleaned.replace(/^\s+/g, '');
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
   * @name getNumberSubStringStart
   * @param {string} permissionsInputCleaned
   * @return {*}
   * @description Helper function for numericStringPermissions
   */
  getNumberSubStringStart(permissionsInputCleaned) {
    if (permissionsInputCleaned.indexOf('0x') > -1) {
      return permissionsInputCleaned.indexOf('0x');
    } else if (permissionsInputCleaned.indexOf('0o') > -1) {
      return permissionsInputCleaned.indexOf('0o');
    } else if (permissionsInputCleaned.indexOf('0b') > -1) {
      return permissionsInputCleaned.indexOf('0b');
    } else {
      return false;
    }
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
    const numberSubStringStart = this.getNumberSubStringStart(permissionsInputCleaned);
    if (!Number.isNaN(Number(permissionsInput))) {
      returnValue = this.convertNumberPermissions(Number(permissionsInput));
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
   * @name shiftStringPermissionElements
   * @param {Array} permissionsArray
   * @param {String} permissionsInputCleaned
   * @return {Array}
   * @description Helper function for buildStringPermissionReturn
   */
  shiftStringPermissionElements(permissionsArray, permissionsInputCleaned) {
    const checkSubString = permissionsInputCleaned.slice(0, permissionsInputCleaned.split('|', 2).join('|').length);
    if (checkSubString.search(/[lcrud]/g) === -1) {
      const permissionsReturn = permissionsArray;
      permissionsReturn.splice(15, 5);
      for (let i = 0; i < 5; i += 1) {
        permissionsReturn.unshift(false);
      }
      return permissionsReturn;
    } else {
      return permissionsArray;
    }
  },
  /** @function
   * @name buildStringPermissionTrueIndex
   * @param {string} permissionLetter
   * @param {number} section
   * @return {*}
   * @description Helper function for buildStringPermissionReturn
   */
  buildStringPermissionTrueIndex(permissionLetter, section) {
    if (permissionLetter === 'l') {
      return (section * 5);
    } else if (permissionLetter === 'c') {
      return ((section * 5) + 1);
    } else if (permissionLetter === 'r') {
      return ((section * 5) + 2);
    } else if (permissionLetter === 'u') {
      return ((section * 5) + 3);
    } else if (permissionLetter === 'd') {
      return ((section * 5) + 4);
    } else {
      return false;
    }
  },
  /** @function
   * @name buildStringPermissionReturn
   * @param {number} lengthOfSection
   * @param {string} permissionsInputCleaned
   * @param {number} letterIndex
   * @param {number} section
   * @param {Array} permissionsReturn
   * @return {Array}
   * @description Helper function for convertStringPermissions
   */
  buildStringPermissionReturn(lengthOfSection, permissionsInputCleaned, letterIndex, section, permissionsReturn) {
    let lengthOfSectionCopy = lengthOfSection;
    let letterIndexCopy = letterIndex;
    const permissionsReturnCopy = permissionsReturn;
    for (let lcrudIndex = 0; lcrudIndex < lengthOfSectionCopy; lcrudIndex += 1) {
      const permissionLetter = permissionsInputCleaned.charAt(letterIndexCopy);
      const permissionIndex = this.buildStringPermissionTrueIndex(permissionLetter, section);
      if (permissionIndex !== false) {
        permissionsReturnCopy[permissionIndex] = true;
      } else if (permissionLetter) {
        lengthOfSectionCopy += 1;
      }
      letterIndexCopy += 1;
    }
    return [permissionsReturnCopy, letterIndexCopy];
  },
  /** @function
   * @name getSectionInfo
   * @param {boolean} nonPipeIndexFound
   * @param {number} nextNonPipeIndex
   * @param {string} permissionsInputCleaned
   * @param {string} findSectionLengthSubString
   * @param {number} lengthOfSection
   * @param {number} section
   * @return {Array}
   * @description Helper function for convertStringPermissions
   */
  getSectionInfo(nonPipeIndexFound, nextNonPipeIndex, permissionsInputCleaned, findSectionLengthSubString, lengthOfSection, section) {
    let lengthOfSectionCopy = lengthOfSection;
    let nonPipeIndexFoundCopy = nonPipeIndexFound;
    let nextNonPipeIndexCopy = nextNonPipeIndex;
    let sectionCopy = section;
    let findSectionLengthSubStringCopy = findSectionLengthSubString;
    while (nonPipeIndexFoundCopy === false && nextNonPipeIndexCopy < permissionsInputCleaned.length) {
      if (findSectionLengthSubStringCopy.indexOf('|') > 0) {
        lengthOfSectionCopy = (findSectionLengthSubStringCopy.substr(0, findSectionLengthSubStringCopy.indexOf('|'))).length;
        nonPipeIndexFoundCopy = true;
      } else {
        if (findSectionLengthSubStringCopy.indexOf('|') === 0 && sectionCopy === 0) {
          sectionCopy += 1;
        } else if (findSectionLengthSubStringCopy.indexOf('||') === 0) {
          sectionCopy += 1;
        }
        nextNonPipeIndexCopy += 1;
        findSectionLengthSubStringCopy = permissionsInputCleaned.substr(nextNonPipeIndexCopy);
      }
    }
    return [lengthOfSectionCopy, sectionCopy];
  },
  /** @function
   * @name convertStringPermissions
   * @param {string} permissionsInput
   * @return {Array}
   * @description Sends number strings to convertNumberPermissions, otherwise, string permissions are converted
   */
  convertStringPermissions(permissionsInput) {
    let permissionsReturn = this.createInitPermissionsArray(false);
    let permissionsInputCleaned = permissionsInput.toLowerCase();

    const numericReturn = this.numericStringPermissions(permissionsInput, permissionsInputCleaned, permissionsReturn);
    if (numericReturn !== false) {
      return numericReturn;
    }

    permissionsInputCleaned = this.stringPermissionsRegex(permissionsInputCleaned);

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

        let sectionArguments = [nonPipeIndexFound, nextNonPipeIndex, permissionsInputCleaned];
        sectionArguments = sectionArguments.concat([findSectionLengthSubString, lengthOfSection, section]);
        const sectionInfo = this.getSectionInfo(...sectionArguments);
        lengthOfSection = sectionInfo[0];
        section = sectionInfo[1];

        const buildArguments = [lengthOfSection, permissionsInputCleaned, letterIndex, section, permissionsReturn];
        const permissionsReturnAndLetterIndex = this.buildStringPermissionReturn(...buildArguments);
        permissionsReturn = permissionsReturnAndLetterIndex[0];
        letterIndex = permissionsReturnAndLetterIndex[1];
      }
    }
    return this.shiftStringPermissionElements(permissionsReturn, permissionsInputCleaned);
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
   * @name getSectionMultiplier
   * @param {string} permissionKey
   * @return {*}
   * @description Helper function for convertObjectPermissions
   */
  getSectionMultiplier(permissionKey) {
    if (permissionKey.toLowerCase() === 'owner') {
      return 0;
    } else if (permissionKey.toLowerCase() === 'group') {
      return 1;
    } else if (permissionKey.toLowerCase() === 'loggedinuser') {
      return 2;
    } else if (permissionKey.toLowerCase() === 'anyuser') {
      return 3;
    } else {
      utilities.winstonWrapper('unhandled permission section!', 'warning');
      return null;
    }
  },
  /** @function
   * @name buildObjectPermissionsReturn
   * @param {Array} permissionsReturn
   * @param {string} permissionArrayElement
   * @param {number} permissionsReturnIndex
   * @return {Array}
   * @description Used in convertObjectPermissions
   */
  buildObjectPermissionsReturn(permissionsReturn, permissionArrayElement, permissionsReturnIndex) {
    const permissionsReturnCopy = permissionsReturn;
    let permissionsReturnIndexCopy = permissionsReturnIndex;
    if (permissionArrayElement === 'list' || permissionArrayElement === 'l') {
      permissionsReturnCopy[permissionsReturnIndexCopy] = true;
    } else if (permissionArrayElement[0] === 'c') { // create or c
      permissionsReturnIndexCopy += 1;
      permissionsReturnCopy[permissionsReturnIndexCopy] = true;
    } else if (permissionArrayElement[0] === 'r') { // read or r
      permissionsReturnIndexCopy += 2;
      permissionsReturnCopy[permissionsReturnIndexCopy] = true;
    } else if (permissionArrayElement[0] === 'u') { // update or u
      permissionsReturnIndexCopy += 3;
      permissionsReturnCopy[permissionsReturnIndexCopy] = true;
    } else if (permissionArrayElement[0] === 'd') { // delete or d
      permissionsReturnIndexCopy += 4;
      permissionsReturnCopy[permissionsReturnIndexCopy] = true;
    } else {
      utilities.winstonWrapper('Unhandled resource operation!', 'warning');
    }
    return permissionsReturnCopy;
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
    let permissionsReturn = this.createInitPermissionsArray();
    const propertiesLength = Object.keys(permissionsInput).length;
    for (let propertyIndex = 0; propertyIndex < propertiesLength; propertyIndex += 1) {
      permissionKey = Object.keys(permissionsInput)[propertyIndex];
      sectionMultiplier = this.getSectionMultiplier(permissionKey);
      if (Array.isArray(permissionsInput[permissionKey])) {
        permissionsSectionArrayLength = permissionsInput[permissionKey].length;
        for (let arrayIndex = 0; arrayIndex < permissionsSectionArrayLength; arrayIndex += 1) {
          if ((typeof permissionsInput[permissionKey][arrayIndex]) === 'string') {
            permissionArrayElement = (permissionsInput[permissionKey][arrayIndex]).toLowerCase();
            permissionsReturnIndex = (sectionMultiplier * 5);
            permissionsReturn = this.buildObjectPermissionsReturn(permissionsReturn, permissionArrayElement, permissionsReturnIndex);
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
