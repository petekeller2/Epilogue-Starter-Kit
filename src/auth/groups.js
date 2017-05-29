import fs from 'fs-extra';
import epilogueAuth from './epilogueAuth';
import utilities from '../utilities';

export default {
  getJsonGroupPermissions(isTest, resourceName, groupResourceName, groupName, groupId) {
    let jsonPath = './groupPermissions.json';
    if (isTest) {
      jsonPath = 'test/testGroupPermissions.json';
    }
    return new Promise((resolve, reject) => {
      fs.readFile(jsonPath, 'utf8', (groupPermissionsErr, groupPermissionsData) => {
        if (groupPermissionsErr) {
          reject(`Error: ${groupPermissionsErr}`);
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
  getDbGroupPermissions(sequelize, resourceName, groupResourceName, groupName, groupId) {
    let queryString = 'SELECT permission FROM "GroupPermission"';
    queryString += ` where "resource" = '${resourceName}' and "groupResourceName" = ${groupResourceName}`;
    if ((typeof groupName === 'string') && (groupName.length > 0)) {
      queryString += ` and "groupName" = '${groupName}'`;
    }
    if ((typeof groupId === 'string') && (groupId.length > 0)) {
      queryString += ` and "groupID" = '${groupId}'`;
    }
    return sequelize.query(queryString, { type: sequelize.QueryTypes.SELECT })
      .then(permissionResults => permissionResults);
  },
  combinePermissions(permissionsArray, convertedPermissions) {
    let permissionsArrayReturn = permissionsArray;
    if (permissionsArray.length === 0) {
      permissionsArrayReturn = convertedPermissions;
    }
    return permissionsArrayReturn.map((bit, index) => bit || convertedPermissions[index]);
  },
  async accessCheck(testUserId, req, sequelize, resourceName, permissionsIndex) {
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
    })).then(unconvertedPermissions => [].concat(...unconvertedPermissions));
    // eslint-disable-next-line
    const convertedPermissionsArray = await Promise.all(combinedUnconvertedPermissions.map(async unconvertedPermissions => epilogueAuth.convertPermissions(unconvertedPermissions)));
    let returnBool = false;
    convertedPermissionsArray.forEach((convertedPermissions) => {
      if (convertedPermissions[permissionsIndex]) {
        returnBool = true;
      }
    });
    return returnBool;
  },
  addToUnconvertedPermissionsArray(tempGroupPermissions, unconvertedPermissionsArray) {
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
  getUserGroups(testUserId, req, sequelize) {
    const userId = ((req || {}).user || {}).id;
    if (testUserId) {
      return new Promise((resolve, reject) => {
        fs.readFile('test/testUserGroups.json', 'utf8', (testUserGroupsErr, testUserGroupsData) => {
          const testUserGroups = JSON.parse(testUserGroupsData);
          if (testUserGroups) {
            resolve(testUserGroups[testUserId]);
          } else {
            reject('Error in the testUserGroups.json file');
          }
        });
      });
    } else if (userId) {
      let queryString = 'SELECT permission FROM "UserGroupXref"';
      queryString += ` where "UserId" = '${userId}'`;
      return sequelize.query(queryString, { type: sequelize.QueryTypes.SELECT })
        .then(userGroupsResults => userGroupsResults);
    }
    return utilities.winstonWrapper('No user id and no test user id', 'info', false);
  },
};
