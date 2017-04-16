import epilogue from 'epilogue';
import merge from 'deepmerge';
import utilities from './utilities';
import Resources from './resources';
import testConfig from '../test/testConfig.json';

export default {
  /** @function
   * @name setupEpilogue
   * @param {object} app
   * @param {object} database
   * @param {object} Sequelize
   * @return {object}
   * @description Does initEpilogue and createGroupXrefTable. Returns the results from createGroupXrefTable
   */
  setupEpilogue(app, database, Sequelize) {
    this.initEpilogue(app, database);
    return this.createGroupXrefTable(database, Sequelize);
  },
  /** @function
   * @name initEpilogue
   * @param {object} app
   * @param {object} database
   * @description Initializes Epilogue
   */
  async initEpilogue(app, database) {
    await epilogue.initialize({
      app,
      sequelize: database,
    });
  },
  /** @function
   * @name initEpilogue
   * @param {object} database
   * @param {object} Sequelize
   * @param {object} groupXrefModel
   * @return {map}
   * @description Builds the resources from the resources folder and returns a map of the resources.
   *              The creation of the resources will be finished in epilogueAuth.js. The map creation
   *              is finished here
   * @todo replace the hard coded 'User' with a config variable
   */
  async setupResources(database, Sequelize, groupXrefModel) {
    const awaitedGroupXrefModel = await groupXrefModel;
    // build all models for next step
    let tempResource = [];
    const modelNames = [];
    let hasUser = false;
    let isGroup;
    await Resources.map((resource) => {
      tempResource = resource;
      isGroup = resource[6];
      if (tempResource[0] === 'User') {
        hasUser = true;
      }
      if (isGroup === true) {
        tempResource[2] = resource[2].setup(database, Sequelize, tempResource[0], isGroup);
      } else {
        tempResource[2] = resource[2].setup(database, Sequelize, tempResource[0]);
      }
      modelNames.push(tempResource[0]);
      return tempResource;
    });
    utilities.throwErrorConditionally(hasUser, 'The User resource is required!');

    // the next step (see: build all models for next step)
    let model;
    let endpoints;
    let extension;
    let autoAssociations;
    let autoAssociationsConverted;
    let autoAssociationsIndex;
    let autoAssociationType;
    let autoAssociationsTest;
    let autoAssociationsTestCheck;
    const returnResourceMap = new Map();
    await Resources.forEach(async (resource) => {
      model = resource[2];
      endpoints = resource[3];
      extension = resource[4];
      autoAssociations = resource[5];
      autoAssociationsTest = false;
      autoAssociationsTestCheck = Boolean(testConfig.individualHttpTest === true && testConfig.testCases[testConfig.testNumber - 1]);
      if (autoAssociationsTestCheck && testConfig.testCases[testConfig.testNumber - 1].aaOrAccess === 'aa') {
        if (resource[0] === testConfig.testCases[testConfig.testNumber - 1].association.parent) {
          autoAssociationsTest = true;
          autoAssociationsIndex = modelNames.indexOf(testConfig.testCases[testConfig.testNumber - 1].association.child);
          model[testConfig.testCases[testConfig.testNumber - 1].association.aa](Resources[autoAssociationsIndex][2]);
        }
      }
      if (autoAssociations && !(autoAssociationsTest === true)) {
        autoAssociationsConverted = this.convertAutoAssociations(autoAssociations, false);
        autoAssociationsConverted.forEach((aaConvertedElement) => {
          autoAssociationType = Object.keys(aaConvertedElement)[0];
          autoAssociationsIndex = modelNames.indexOf(aaConvertedElement[autoAssociationType]);
          if (autoAssociationsIndex >= 0) {
            model[autoAssociationType](Resources[autoAssociationsIndex][2]);
          }
        });
      }
      if (resource[0] === 'User') {
        model.hasMany(awaitedGroupXrefModel);
      }
      let resourceParam = {
        model,
        endpoints,
      };
      resourceParam = merge(resourceParam, extension);

      const usableResource = await epilogue.resource(resourceParam);
      if (resource[7]) {
        usableResource.use(resource[7]);
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
   * @todo When the User Resource is replaced, change the documentation
   */
  async createGroupXrefTable(database, sequelize) {
    const groupXref = await database.define('UserGroupXref', {
      groupID: sequelize.STRING,
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
   * @name convertAutoAssociations
   * @param {*} aaInput
   * @param {boolean} getResourcesNames
   * @return {Array}
   * @description Converts aaInput to auto association array. See wiki for detailed overview
   */
  convertAutoAssociations(aaInput, getResourcesNames) {
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
  aaBuildFromObject(aaInput, getResourcesNames, aaReturn) {
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
  aaBuildFromArray(aaInput, getResourcesNames, aaReturn) {
    const aaReturnCopy = aaReturn;
    aaInput.forEach((aaElement) => {
      if (aaElement) {
        let eleToPush;
        if ((typeof aaElement) === 'string') {
          (getResourcesNames === true) ? eleToPush = aaElement : eleToPush = { hasMany: aaElement };
        } else if ((typeof aaElement) === 'object') {
          (getResourcesNames === true) ? eleToPush = aaElement[Object.keys(aaElement)[0]] : eleToPush = aaElement;
        }
        aaReturnCopy.push(eleToPush);
      }
    });
    return aaReturnCopy;
  },
};
