let srcOrBuild;
if (process.env.NODE_ENV === 'staging' || process.env.NODE_ENV === 'production') {
  srcOrBuild = 'build';
} else {
  srcOrBuild = 'src';
}
const config = require(`../../${srcOrBuild}/config`);
const utilities = require(`../../${srcOrBuild}/utilities`);

import fs from 'fs-extra';
import winston from 'winston';
import testConfig from '../testConfig.json';

const winstonConfig = utilities.setUpWinstonLogger('logs/testCaseGeneration.log');
winston.loggers.add('testCaseGeneration', {
  file: winstonConfig,
});
const testCaseGeneration = winston.loggers.get('testCaseGeneration');

export default {
  /** @function
   * @name setPermissionString
   * @param {number} originalCounter
   * @returns {string}
   * @description Used by permissionsTests
   */
  setPermissionString(originalCounter) {
    const permissionStringArray = ['lcrud', 'lcrud', 'lcrud', 'lcrud'];
    let counter = originalCounter;
    while (counter > 0) {
      counter -= 1;
      permissionStringArray[counter] = '-----';
    }
    permissionStringArray.reverse();
    return permissionStringArray.join('|');
  },
  /** @function
   * @name createPermissionsTestObject
   * @param {array} permissionSectionOfTestCase - The test case's resources' permissions
   * @param {string} userID
   * @param {string} comment
   * @returns {object}
   * @description Creates an individual access test case
   */
  createPermissionsTestObject(permissionSectionOfTestCase, userID, comment) {
    const testCase = {};
    testCase.___comment = comment;
    testCase.permissions = permissionSectionOfTestCase;
    testCase.userID = userID;
    testCase.aaOrAccess = 'access';
    testCase.generatedByTestsCasesJs = true;
    return testCase;
  },
  /** @function
   * @name permissionsTests
   * @description Creates permissions (aka access) test cases in testConfig.json
   */
  permissionsTests() {
    if (Array.isArray(testConfig.generationConfig.userIDs)) {
      for (let i = 0; i < testConfig.generationConfig.userIDs.length; i += 1) {
        let permissionSectionOfTestCase = [];
        if (parseInt(testConfig.generationConfig.randomPermissionCases, 10) > 0) {
          for (let i3 = 0; i3 < parseInt(testConfig.generationConfig.randomPermissionCases, 10); i3 += 1) {
            permissionSectionOfTestCase = [];
            for (let i2 = 0; i2 < testConfig.generationConfig.resources.length; i2 += 1) {
              // random bits 1048575 (20 bits max in decimal)
              permissionSectionOfTestCase.push(testConfig.generationConfig.resources[i2]);
              permissionSectionOfTestCase.push(Math.floor(Math.random() * 65535));
            }
            testConfig.testCases.push(this.createPermissionsTestObject(permissionSectionOfTestCase, testConfig.generationConfig.userIDs[i], 'random'));
          }
        }
        if ((Array.isArray(testConfig.generationConfig.customPermissionCases)) && (testConfig.generationConfig.customPermissionCases.length > 0)) {
          permissionSectionOfTestCase = testConfig.generationConfig.customPermissions;
          testConfig.testCases.push(this.createPermissionsTestObject(permissionSectionOfTestCase, testConfig.generationConfig.userIDs[i], 'custom'));
        }
        if (testConfig.generationConfig.defaultPermissionCases === true) {
          for (let i3 = 0; i3 < 4; i3 += 1) {
            permissionSectionOfTestCase = [];
            for (let i2 = 0; i2 < testConfig.generationConfig.resources.length; i2 += 1) {
              permissionSectionOfTestCase.push(testConfig.generationConfig.resources[i2]);
              permissionSectionOfTestCase.push(this.setPermissionString(i3));
            }
            testConfig.testCases.push(this.createPermissionsTestObject(permissionSectionOfTestCase, testConfig.generationConfig.userIDs[i], 'default'));
          }
        }
      }
    }
  },
  /** @function
   * @name aaTests
   * @description Creates an individual auto association test case
   */
  aaTests() {
    let aaObject = {};
    testConfig.generationConfig.autoAssociations.forEach((aa) => {
      aaObject = {
        aaOrAccess: 'aa',
        permissions: [],
        association: {
          parent: 'User',
          aa,
          child: 'Todo',
        },
        userID: '',
        generatedByTestsCasesJs: true,
      };
      testConfig.testCases.push(aaObject);
    });
  },
  /** @function
   * @name generateTestCases
   * @description Creates test cases in testConfig.json
   * @todo aaTests is commented out because the tests in httpTests/autoAssociations/associations.js are missing
   */
  generateTestCases() {
    return new Promise((resolve, reject) => {
      if (!(typeof testConfig.generationConfig === 'object')) {
        resolve('generateTestCases called but generationConfig is missing');
      }

      // remove at the beginning as well in case the previous attempt at running the tests failed
      if (testConfig.generationConfig.removePreviousGeneratedTestCases === true) {
        testConfig.testCases = testConfig.testCases.filter((testCase) => {
          if (testCase.generatedByTestsCasesJs !== true) {
            return testCase;
          }
        });
      }

      if (!(Array.isArray(testConfig.testCases)) || (testConfig.overwriteTestCases === true)) {
        testConfig.testCases = [];
      }

      if (!(Array.isArray(testConfig.generationConfig.userIDs)) || testConfig.generationConfig.userIDs.length < 1) {
        if (testConfig.generationConfig.guestUser !== true) {
          reject('no users for the generated tests');
        }
      }

      if ((testConfig.generationConfig.guestUser === true) && !(testConfig.generationConfig.userIDs.includes(''))) {
        testConfig.generationConfig.userIDs.push('');
      }

      if (!(Array.isArray(testConfig.generationConfig.resources))) {
        testConfig.generationConfig.resources = [];
      }

      this.permissionsTests();
      // this.aaTests(); // todo: uncomment this after the tests are created

      testConfig.testsCasesHaveBeenGenerated = true;
      fs.writeFile('./test/testConfig.json', JSON.stringify(testConfig, null, 2), (err) => {
        if (err) return testCaseGeneration.error(err);
        resolve('test cases inserted');
      });
    });
  },
};
