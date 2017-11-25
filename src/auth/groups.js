// @flow
import fs from 'fs-extra';
import permissionConversions from './permissionConversions';
import utilities from '../utilities';

export default {
  /** @function
   * @name getJsonGroupPermissions
   * @param {boolean} isTest
   * @param {string} resourceName
   * @param {string} groupResourceName
   * @param {string} groupName
   * @param {string} groupId
   * @return {Promise}
   */
  getJsonGroupPermissions(isTest: boolean, resourceName: string, groupResourceName: string, groupName: string, groupId: string): Promise {
    let jsonPath = './groupPermissions.json';
    if (isTest) {
      jsonPath = 'test/testGroupPermissions.json';
    }
    return new Promise((resolve, reject) => {
      fs.readFile(jsonPath, 'utf8', (groupPermissionsErr, groupPermissionsData) => {
        if (groupPermissionsErr) {
          reject(groupPermissionsErr);
        }
        const groupPermissions = JSON.parse(groupPermissionsData);
        const returnArray = [];
        Object.entries(groupPermissions).forEach(([resource, arrayOfGroupPermissionsArrays]) => {
          arrayOfGroupPermissionsArrays.forEach((groupPermissionsArray) => {
            if ((resource === resourceName) && (groupPermissionsArray[0] === groupResourceName)) {
              // eslint-disable-next-line
              const groupNameCheck = Boolean(groupPermissionsArray[2] && groupPermissionsArray[2].length > 0) && (groupPermissionsArray[2] === groupName);
              const groupIdCheck = Boolean(groupPermissionsArray[3] && groupPermissionsArray[3].length > 0) && (groupPermissionsArray[3] === groupId);
              if ((typeof groupPermissionsArray[2] === 'string') && (groupNameCheck === true)) {
                returnArray.push(groupPermissionsArray[1]);
              } else if ((typeof groupPermissionsArray[3] === 'string') && (groupIdCheck === true)) {
                returnArray.push(groupPermissionsArray[1]);
              } else {
                returnArray.push(groupPermissionsArray[1]);
              }
            }
          });
        });
        resolve(returnArray);
      });
    });
  },
  /** @function
   * @name getDbGroupPermissions
   * @param {object} sequelize
   * @param {string} resourceName
   * @param {string} groupResourceName
   * @param {string} groupName
   * @param {string} groupId
   * @return {Promise}
   */
  getDbGroupPermissions(sequelize: {}, resourceName: string, groupResourceName: string, groupName: string, groupId: string): Promise {
    let queryString = 'SELECT permission FROM "GroupPermission"';
    queryString += ` where "resource" = '${resourceName}' and "groupResourceName" = '${groupResourceName}'`;
    if ((typeof groupName === 'string') && (groupName.length > 0)) {
      queryString += ` and "groupName" = '${groupName}'`;
    }
    if ((typeof groupId === 'string') && (groupId.length > 0)) {
      queryString += ` and "groupID" = '${groupId}'`;
    }
    return sequelize.query(queryString, { type: sequelize.QueryTypes.SELECT })
      .then(permissionResults => permissionResults, error => utilities.winstonWrapper(`getDbGroupPermissions error: ${error}`));
  },
  /** @function
   * @name combinePermissions
   * @param {Array} permissionsArray
   * @param {Array} convertedPermissions
   * @return {Array}
   */
  combinePermissions(permissionsArray: [], convertedPermissions: []): [] {
    let permissionsArrayReturn = permissionsArray;
    if (permissionsArray.length === 0) {
      permissionsArrayReturn = convertedPermissions;
    }
    return permissionsArrayReturn.map((bit, index) => bit || convertedPermissions[index]);
  },
  /** @function
   * @name accessCheck
   * @param {*} testUserId - user id string or falsy value
   * @param {object} req
   * @param {object} sequelize
   * @param {string} resourceName
   * @param {number} permissionsIndex
   * @return {boolean}
   * @description Main function. Used in epilogueAuth.js
   */
  async accessCheck(testUserId: any, req, sequelize: {}, resourceName: {}, permissionsIndex: number): boolean {
    let tempGroupPermissions;
    let unconvertedPermissionsArray = [];
    const userGroups = await this.getUserGroups(testUserId, req, sequelize);

    const combinedUnconvertedPermissions = await Promise.all(userGroups.map(async (group) => {
      tempGroupPermissions = await this.getJsonGroupPermissions(testUserId, resourceName, group.groupResourceName, group.groupName, group.groupID);
      unconvertedPermissionsArray = this.addToUnconvertedPermissionsArray(tempGroupPermissions, unconvertedPermissionsArray);
      if (!testUserId) {
        tempGroupPermissions = await this.getDbGroupPermissions(sequelize, resourceName, group.groupResourceName, group.groupName, group.groupId);
        unconvertedPermissionsArray = this.addToUnconvertedPermissionsArray(tempGroupPermissions, unconvertedPermissionsArray);
      }
      return unconvertedPermissionsArray;
    })).then(
      unconvertedPermissions => [].concat(...unconvertedPermissions),
      error => utilities.winstonWrapper(`accessCheck error: ${error}`),
    );
    // eslint-disable-next-line
    const convertedPermissionsArray = await Promise.all(combinedUnconvertedPermissions.map(async unconvertedPermissions => permissionConversions.convertPermissions(unconvertedPermissions)));
    return convertedPermissionsArray.reduce(this.combinePermissions, [])[permissionsIndex];
  },
  /** @function
   * @name addToUnconvertedPermissionsArray
   * @param {*} tempGroupPermissions
   * @param {Array} unconvertedPermissionsArray
   * @return {Array}
   */
  addToUnconvertedPermissionsArray(tempGroupPermissions: any, unconvertedPermissionsArray: []): [] {
    let unconvertedPermissionsArrayReturn = unconvertedPermissionsArray;
    if (tempGroupPermissions) {
      if (typeof tempGroupPermissions === 'string') {
        unconvertedPermissionsArrayReturn.push(tempGroupPermissions);
      } else if (Array.isArray(tempGroupPermissions) === true) {
        unconvertedPermissionsArrayReturn = unconvertedPermissionsArrayReturn.concat(tempGroupPermissions);
      }
    }
    return unconvertedPermissionsArrayReturn;
  },
  /** @function
   * @name getUserGroups
   * @param {string} testUserId
   * @param {object} req
   * @param {object} sequelize
   * @return {Promise}
   */
  getUserGroups(testUserId: string, req: {}, sequelize: {}): Promise {
    const userId = ((req || {}).user || {}).id;
    if (testUserId) {
      return new Promise((resolve, reject) => {
        fs.readFile('test/testUserGroups.json', 'utf8', (testUserGroupsErr, testUserGroupsData) => {
          const testUserGroups = JSON.parse(testUserGroupsData);
          if (testUserGroups) {
            resolve(testUserGroups[testUserId]);
          } else {
            // eslint-disable-next-line
            reject('Error in the testUserGroups.json file');
          }
        });
      });
    } else if (userId) {
      let queryString = 'SELECT permission FROM "UserGroupXref"';
      queryString += ` where "UserId" = '${userId}'`;
      return sequelize.query(queryString, { type: sequelize.QueryTypes.SELECT })
        .then(userGroupsResults => userGroupsResults, error => utilities.winstonWrapper(`getUserGroups error: ${error}`));
    }
    return utilities.winstonWrapper('No user id and no test user id', 'info', false);
  },
};
