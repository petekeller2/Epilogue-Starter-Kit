import winston from 'winston';
import merge from 'deepmerge';
import config from '../config';
import epilogueSetup from '../epilogueSetup';
import testConfig from '../../test/testConfig.json';

// todo reduce code duplication. Update functions here when the User resource is replaced
export default {
  /** @function
   * @name isOwnerOfRegularResourceCheck
   * @param {object} req
   * @param {Array} cleanedEndpointsArray
   * @param {Array} actionsList - ['list', 'create', 'read', 'update', 'delete']
   * @param {object} resource
   * @param {number} index - index of the action list
   * @return boolean
   * @description Checks if the user is the owner of a resource. Group ownership checking is done in another function
   * @todo Replace actionsList and index with action. Extract code duplication from this function and similar ones
   */
  async isOwnerOfRegularResourceCheck(req, cleanedEndpointsArray, actionsList, resource, index) {
    let reqUrlArray;
    if ((req || {}).url && ((req || {}).user || {}).id) {
      reqUrlArray = req.url.split('/');
      reqUrlArray = reqUrlArray.filter(entry => entry.trim() !== '');
      if (reqUrlArray[0] === 'users' && cleanedEndpointsArray.indexOf(reqUrlArray[2]) >= 0) {
        if (req.user.id === reqUrlArray[1]) {
          return true;
        } else {
          if (winston.info) {
            winston.info('Wrong user id using users/... url format');
          }
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
              if (winston.info) {
                winston.info(`Can\'t update/delete/read resource, not owned by current user (current user: ${req.user.id})`);
              }
              return false;
            }
          }
        } else {
          if (winston.info) {
            winston.info('Only one URL level deep for update/delete/read');
          }
          return false;
        }
      } else {
        if (winston.info) {
          winston.info('URL is not in either users/... or resource/... format');
        }
        return false;
      }
    } else if (!(((req || {}).user || {}).id)) {
      if (winston.info) {
        winston.info('req.user.id missing in isOwnerOfRegularResourceCheck');
      }
      return false;
    } else {
      if (winston.info) {
        winston.info('req.url missing in isOwnerOfRegularResourceCheck');
      }
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
    let reqUrlArray;
    if ((req || {}).url && ((req || {}).user || {}).id) {
      reqUrlArray = req.url.split('/');
      reqUrlArray = reqUrlArray.filter(entry => entry.trim() !== '');
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
          if (winston.info) {
            winston.info('Can\'t update/delete/read group resource, not owned by current user');
          }
          return false;
        }
      }
    } else if (!(((req || {}).user || {}).id)) {
      if (winston.info) {
        winston.info('req.user.id missing in isOwnerOfGroupResourceCheck');
      }
      return false;
    } else {
      if (winston.info) {
        winston.info('req.url missing in isOwnerOfGroupResourceCheck');
      }
      return false;
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
    let reqUrlArray;
    if ((req || {}).url && ((req || {}).user || {}).id) {
      reqUrlArray = req.url.split('/');
      reqUrlArray = reqUrlArray.filter(entry => entry.trim() !== '');
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
          if (winston.info) {
            winston.info('Can\'t update/delete/read group resource, not a member');
          }
          return false;
        }
      }
    } else if (!(((req || {}).user || {}).id)) {
      if (winston.info) {
        winston.info('req.user.id missing in isMemberOfGroupCheck');
      }
      return false;
    } else {
      if (winston.info) {
        winston.info('req.url missing in isMemberOfGroupCheck');
      }
      return false;
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
    if ((actionsList[index] === 'create' || actionsList[index] === 'list') && (((req || {}).user || {}).id)) {
      // console.log('true for trueForCreateOrList');
      return true;
    } else {
      // console.log('false for trueForCreateOrList');
      return false;
    }
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
   * @name belongsToUserResourceCheck
   * @param {map} resourcesFromSetup
   * @param {object} groupXrefModel
   * @description Finishes milestone creation for the resources, with auth milestones being created for every resource
   * @todo Move the standard create and list milestones into new functions that will be called conditionally depending on config variables.
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
          if (permissions[i] === true && currentUserOwnsResource === true) {
            // console.log('first section passed');
            resolve(context.continue);
          } else if (permissions[i + 5] === true && isGroup === true && memberOfGroup === true) {
            // console.log('second section passed');
            resolve(context.continue);
          } else if (permissions[i + 10] === true && req && req.user && req.user.id && req.user.id !== '') {
            // console.log('third section passed');
            resolve(context.continue);
          } else if (permissions[i + 15] === true) {
            // console.log('fourth section passed');
            resolve(context.continue);
          } else {
            res.status(401).send({ message: 'Unauthorized' });
            resolve(context.stop);
          }
        }));
        if (actionsList[i] === 'create') {
          authMilestone[actionsList[i]].write = {};
          // eslint-disable-next-line
          authMilestone[actionsList[i]].write.before = ((req, res, context) => new Promise(async(resolve) => {
            if (resource[6] === true) {
              if (((req || {}).body) && ((req || {}).user || {}).id) {
                // eslint-disable-next-line
                req.body.OwnerID = req.user.id;
              }
            }
            if ((userAAs.indexOf(resource[0]) >= 0) || (this.belongsToUserResourceCheck(resource[5]))) {
              if (((req || {}).body) && ((req || {}).user || {}).id) {
                // eslint-disable-next-line
                req.body.UserId = req.user.id;
              }
            }
            resolve(context.continue);
          }));
        } else if ((actionsList[i] === 'list')) {
          authMilestone[actionsList[i]].fetch = {};
          // eslint-disable-next-line
          authMilestone[actionsList[i]].fetch.before = ((req, res, context) => new Promise(async(resolve) => {
            permissions = this.convertRealOrTestPermissions(resource[1], resource[0], isHttpTest, validTestNumber);
            if (permissions[0] === true && permissions[5] === false && permissions[10] === false && permissions[15] === false) {
              if ((((req || {}).user || {}).id)) {
                if ((resource[0] === 'User') || (userAAs.indexOf(resource[0]) >= 0) || (this.belongsToUserResourceCheck(resource[5]))) {
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
                    winston.warning('With these permissions, users can only list resources that belong to them, but this resource can\'t belong to anyone');
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
        }
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
    const permissionsReturn = [];
    for (let i = 0; i < 20; i += 1) {
      permissionsReturn.push(false);
    }
    if (!Number.isFinite(permissionsInput)) {
      if (winston.warning) {
        winston.warning('Infinite number!');
      }
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
      } else if (winston.warning) {
        winston.warning('Permission bit not a one or a zero!');
      }
      if ((i % 4) === 3) {
        permissionsReturnIndex += 1;
      }
      permissionsReturnIndex += 1;
    }
    return permissionsReturn.reverse();
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

    let numberSubStringStart;
    if (!Number.isNaN(Number(permissionsInput))) {
      return this.convertNumberPermissions(Number(permissionsInput));
    } else if (permissionsInputCleaned.indexOf('0x') > -1) {
      numberSubStringStart = permissionsInputCleaned.indexOf('0x');
    } else if (permissionsInputCleaned.indexOf('0o') > -1) {
      numberSubStringStart = permissionsInputCleaned.indexOf('0o');
    } else if (permissionsInputCleaned.indexOf('0b') > -1) {
      numberSubStringStart = permissionsInputCleaned.indexOf('0b');
    } else if (/\d/.test(permissionsInputCleaned)) {
      if (winston.warning) {
        winston.warning('Can not mix strings and numbers!');
      }
      return permissionsReturn;
    }
    if (numberSubStringStart || numberSubStringStart === 0) {
      if (!Number.isNaN(Number(permissionsInputCleaned.substr(numberSubStringStart)))) {
        return this.convertNumberPermissions(Number(permissionsInputCleaned.substr(numberSubStringStart)));
      } else if (winston.warning) {
        winston.warning('NaN, but should be a number!');
      }
    }

    permissionsInputCleaned = permissionsInputCleaned.replace(/^\s+/g, '');
    permissionsInputCleaned = permissionsInputCleaned.replace(/n\/a/g, '|');
    permissionsInputCleaned = permissionsInputCleaned.replace(/na/g, '|');
    permissionsInputCleaned = permissionsInputCleaned.replace(/n/g, '|');
    permissionsInputCleaned = permissionsInputCleaned.replace(/x/g, '|');
    permissionsInputCleaned = permissionsInputCleaned.replace(/\s+\|/g, '|');
    permissionsInputCleaned = permissionsInputCleaned.replace(/\|\s+/g, '|');
    permissionsInputCleaned = permissionsInputCleaned.replace(/\s+/g, '|');
    permissionsInputCleaned = permissionsInputCleaned.replace(/\*/g, 'lcrud');
    permissionsInputCleaned = permissionsInputCleaned.replace(/list|ls/g, 'l');
    permissionsInputCleaned = permissionsInputCleaned.replace(/read/g, 'r');
    permissionsInputCleaned = permissionsInputCleaned.replace(/update|upd/g, 'u');
    permissionsInputCleaned = permissionsInputCleaned.replace(/destroy|dstr/g, 'd');
    permissionsInputCleaned = permissionsInputCleaned.replace(/[^lcrud|]/g, '');
    permissionsInputCleaned = permissionsInputCleaned.replace(/d(?!\|)/g, 'd|');
    permissionsInputCleaned = permissionsInputCleaned.replace(/u(?!\||d)/g, 'u|');
    permissionsInputCleaned = permissionsInputCleaned.replace(/r(?!\||d|u)/g, 'r|');
    permissionsInputCleaned = permissionsInputCleaned.replace(/c(?!\||d|u|r)/g, 'c|');
    permissionsInputCleaned = permissionsInputCleaned.replace(/l(?!\||d|u|r|c)/g, 'l|');

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
      if (permissionKey.toLowerCase() === 'owner') {
        sectionMultiplier = 0;
      } else if (permissionKey.toLowerCase() === 'group') {
        sectionMultiplier = 1;
      } else if (permissionKey.toLowerCase() === 'loggedinuser') {
        sectionMultiplier = 2;
      } else if (permissionKey.toLowerCase() === 'anyuser') {
        sectionMultiplier = 3;
      } else if (winston.warning) {
        winston.warning('unhandled permission section!');
      }
      if (Array.isArray(permissionsInput[permissionKey])) {
        permissionsSectionArrayLength = permissionsInput[permissionKey].length;
        for (let arrayIndex = 0; arrayIndex < permissionsSectionArrayLength; arrayIndex += 1) {
          if ((typeof permissionsInput[permissionKey][arrayIndex]) === 'string') {
            permissionArrayElement = (permissionsInput[permissionKey][arrayIndex]).toLowerCase();
            permissionsReturnIndex = (sectionMultiplier * 5);
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
            } else if (winston.warning) {
              winston.warning('Unhandled resource operation!');
            }
          } else if (winston.warning) {
            winston.warning('permissionsInput[permissionKey][arrayIndex] should be a string!');
          }
        }
      } else if (winston.warning) {
        winston.warning('permissionsInput[permissionKey] should be an array!');
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
        if (winston.warning) {
          winston.warning('permissionsInput not a string, object, number or array!');
        }
        return this.createInitPermissionsArray(true);
      }
    } else {
      if (winston.warning) {
        winston.warning('no permissionsInput!');
      }
      return this.createInitPermissionsArray(true);
    }
  },
  /** @function
   * @name convertRealOrTestPermissions
   * @param {*} permissionsInput
   * @param {string} resourceName
   * @param {*} isHttpTest - Should be boolean or something that is clearly truthy or falsy
   * @param {*} validTestNumber - Should be boolean or something that is clearly truthy or falsy
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
