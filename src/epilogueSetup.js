// @flow
import epilogue from 'epilogue';
import merge from 'deepmerge';
import utilities from './utilities';
import Resources from './resources';
import config from './config';
import testConfig from '../test/testConfig.json';

export default {
  /** @function
   * @name setupEpilogue
   * @param {object} app
   * @param {object} database
   * @param {object} Sequelize
   * @return {object}
   * @description Does initEpilogue, createAdminsTable and createGroupXrefTable. Returns the results from createGroupXrefTable
   */
  setupEpilogue(app: {}, database: {}, Sequelize: {}): {} {
    this.initEpilogue(app, database);
    this.createAdminsTable(database, Sequelize);
    this.createGroupPermissionTable(database, Sequelize);
    return this.createGroupXrefTable(database, Sequelize);
  },
  /** @function
   * @name initEpilogue
   * @param {object} app
   * @param {object} database
   * @description Initializes Epilogue
   */
  async initEpilogue(app: {}, database: {}): {} {
    await epilogue.initialize({
      app,
      sequelize: database,
    });
  },
  /** @function
   * @name setupResources
   * @param {object} database
   * @param {object} Sequelize
   * @param {object} groupXrefModel
   * @return {map}
   * @description Builds the resources from the resources folder and returns a map of the resources.
   *              The creation of the resources will be finished in epilogueAuth.js. The map creation
   *              is finished here
   */
  async setupResources(database: {}, Sequelize: {}, groupXrefModel: {}): Map {
    const awaitedGroupXrefModel = await groupXrefModel;
    // build all models for next step
    let tempResource = [];
    const modelNames = [];
    let hasUser = false;
    await Resources.map((resource) => {
      tempResource = resource;
      const isGroup = resource[6];
      const model = resource[2];
      if (tempResource[0] === 'User') {
        hasUser = true;
      }
      if (isGroup === true) {
        tempResource[2] = model.setup(database, Sequelize, tempResource[0], isGroup);
      } else {
        tempResource[2] = model.setup(database, Sequelize, tempResource[0]);
      }
      modelNames.push(tempResource[0]);
      return tempResource;
    });
    let userErrorMessage = config.messages.userResourceNotFound;
    if (config.environment === 'development' || config.environment === 'testing') {
      userErrorMessage = config.messages.userResourceNotFoundDev;
    }
    utilities.throwErrorConditionally(hasUser, userErrorMessage);

    // the next step (see 'build all models for next step' above)
    let autoAssociationsConverted;
    let autoAssociationsIndex;
    let autoAssociationType;
    let autoAssociationsTest;
    let autoAssociationsTestCheck;
    const returnResourceMap = new Map();
    await Resources.forEach(async (resource) => {
      const [name, , model, endpoints, extension, autoAssociations, , specificMilestones] = resource;
      autoAssociationsTest = false;
      autoAssociationsTestCheck = Boolean(testConfig.individualHttpTest === true && testConfig.testCases[testConfig.testNumber - 1]);
      if (autoAssociationsTestCheck && testConfig.testCases[testConfig.testNumber - 1].aaOrAccess === 'aa') {
        if (name === testConfig.testCases[testConfig.testNumber - 1].association.parent) {
          autoAssociationsTest = true;
          autoAssociationsIndex = modelNames.indexOf(testConfig.testCases[testConfig.testNumber - 1].association.child);
          model[testConfig.testCases[testConfig.testNumber - 1].association.aa](Resources[autoAssociationsIndex][2]);
        }
      }
      if (autoAssociations && !(autoAssociationsTest === true)) {
        autoAssociationsConverted = this.convertAutoAssociations(autoAssociations, false);
        autoAssociationsConverted.forEach((aaConvertedElement) => {
          [autoAssociationType] = Object.keys(aaConvertedElement);
          autoAssociationsIndex = modelNames.indexOf(aaConvertedElement[autoAssociationType]);
          if (autoAssociationsIndex >= 0) {
            model[autoAssociationType](Resources[autoAssociationsIndex][2]);
          }
        });
      }
      if (name === 'User') {
        model.hasMany(awaitedGroupXrefModel);
      }
      let resourceParam = {
        model,
        endpoints,
      };
      resourceParam = merge(resourceParam, extension);

      const usableResource = await epilogue.resource(resourceParam);
      if (specificMilestones) {
        usableResource.use(specificMilestones);
      }

      tempResource = resource;
      tempResource.push(usableResource);
      returnResourceMap.set(tempResource[0], tempResource);
    });
    return returnResourceMap;
  },
  /** @function
   * @name createGroupXrefTable
   * @param {object} database
   * @param {object} sequelize
   * @return {object}
   * @description Returns the UserGroupXref model. This resource is owned by the User resource
   */
  async createGroupXrefTable(database: {}, sequelize: {}): {} {
    const groupXref = await database.define('UserGroupXref', {
      groupID: sequelize.STRING,
      groupName: sequelize.STRING,
      groupResourceName: sequelize.STRING,
    });
    const XrefResourceParam = {
      model: groupXref,
      endpoints: ['/userGroupXrefs', '/userGroupXrefs/:id'],
    };
    await epilogue.resource(XrefResourceParam);
    return groupXref;
  },
  /** @function
   * @name createGroupPermissionTable
   * @param {object} database
   * @param {object} sequelize
   * @return {object}
   * @description Used in auth/groups.js
   */
  async createGroupPermissionTable(database: {}, sequelize: {}): {} {
    const groupPermissions = await database.define('GroupPermission', {
      groupID: sequelize.STRING,
      groupName: sequelize.STRING,
      groupResourceName: sequelize.STRING,
      resource: sequelize.STRING,
      permission: sequelize.STRING,
    });
    const GroupPermissionResourceParam = {
      model: groupPermissions,
      endpoints: ['/groupPermissions', '/groupPermissions/:id'],
    };
    await epilogue.resource(GroupPermissionResourceParam);
    return groupPermissions;
  },
  /** @function
   * @name createAdminsTable
   * @param {object} database
   * @param {object} sequelize
   * @return {object}
   * @description Returns the admins model. Admin Id is the admin user's user id
   */
  async createAdminsTable(database: {}, sequelize: {}): {} {
    const admins = await database.define('Admins', {
      AdminId: sequelize.STRING,
    });
    const AdminsParam = {
      model: admins,
      endpoints: ['/admins', '/admins/:id'],
    };
    await epilogue.resource(AdminsParam);
    return admins;
  },
  /** @function
   * @name convertAutoAssociations
   * @param {*} aaInput
   * @param {boolean} getResourcesNames
   * @return {Array}
   * @description Converts aaInput to an auto association array
   */
  convertAutoAssociations(aaInput: any, getResourcesNames: boolean): [] {
    let aaReturn = [];
    if ((typeof aaInput) === 'string') {
      if (aaInput) {
        let cleanedInput = aaInput.replace(/^\s+/g, '');
        cleanedInput = cleanedInput.replace(/\|/g, ',');
        cleanedInput = cleanedInput.replace(/\s+,/g, ',');
        cleanedInput = cleanedInput.replace(/,\s+/g, ',');
        cleanedInput = cleanedInput.replace(/\s+$/g, '');
        cleanedInput = cleanedInput.replace(/\s+/g, ',');
        if (cleanedInput.split(',').length > 0) {
          if (getResourcesNames === true) {
            return this.convertAutoAssociations(cleanedInput.split(','), true);
          } else {
            return this.convertAutoAssociations(cleanedInput.split(','), false);
          }
        }
        if (getResourcesNames === true) {
          aaReturn.push(aaInput);
        } else {
          aaReturn.push({ hasMany: aaInput });
        }
      }
    } else if ((typeof aaInput) === 'object') {
      aaReturn = this.aaBuildFromObject(aaInput, getResourcesNames, aaReturn);
    }
    return aaReturn;
  },
  /** @function
   * @name aaBuildFromObject
   * @param {*} aaInput
   * @param {boolean} getResourcesNames
   * @param {Array} aaReturn
   * @return {Array}
   * @description Helper function for convertAutoAssociations
   */
  aaBuildFromObject(aaInput: any, getResourcesNames: boolean, aaReturn: []): [] {
    if (Array.isArray(aaInput)) {
      return this.aaBuildFromArray(aaInput, getResourcesNames, aaReturn);
    } else if (getResourcesNames === true) {
      aaReturn.push(aaInput[Object.keys(aaInput)[0]]);
    } else {
      aaReturn.push(aaInput);
    }
    return aaReturn;
  },
  /** @function
   * @name aaBuildFromArray
   * @param {*} aaInput
   * @param {boolean} getResourcesNames
   * @param {Array} aaReturn
   * @return {Array}
   * @description Helper function for aaBuildFromObject
   */
  aaBuildFromArray(aaInput: any, getResourcesNames: boolean, aaReturn: []): [] {
    const aaReturnCopy = aaReturn;
    aaInput.forEach((aaElement) => {
      if (aaElement) {
        let eleToPush;
        if ((typeof aaElement) === 'string') {
          eleToPush = (getResourcesNames === true) ? aaElement : { hasMany: aaElement };
        } else if ((typeof aaElement) === 'object') {
          eleToPush = (getResourcesNames === true) ? aaElement[Object.keys(aaElement)[0]] : aaElement;
        }
        aaReturnCopy.push(eleToPush);
      }
    });
    return aaReturnCopy;
  },
};
