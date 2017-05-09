import fs from 'fs-extra';
import epilogueAuth from './epilogueAuth';

export default {
  getJsonGroupPermissions(isTest, resourceName, groupResourceName, groupName, groupId) {
    let jsonPath = './groupPermissions.json';
    if (isTest) {
      jsonPath = '../../test/testGroupPermissions.json';
    }
    fs.readFile(jsonPath, 'utf8', (groupPermissionsErr, groupPermissionsData) => {
      const groupPermissions = JSON.parse(groupPermissionsData);
      const returnArray = [];
      Object.entries(groupPermissions).forEach(([resource, resourceArray]) => {
        if ((resource === resourceName) && (resourceArray[0] === groupResourceName)) {
          if ((typeof resourceArray[2] === 'string') && (resourceArray[2].length > 0) && (resourceArray[2] === groupName)) {
            returnArray.push(resourceArray[1]);
          } else if ((typeof resourceArray[3] === 'string') && (resourceArray[3].length > 0) && (resourceArray[3] === groupId)) {
            returnArray.push(resourceArray[1]);
          } else {
            returnArray.push(resourceArray[1]);
          }
        }
      });
      return returnArray;
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
    return permissionsArray.map((bit, index) => bit || convertedPermissions[index]);
  },
  async accessCheck(testUserId, req, sequelize, resourceName, permissionsIndex) {
    let tempGroupPermissions;
    let unconvertedPermissionsArray = [];
    const userGroups = await this.getUserGroups(testUserId, req, sequelize);

    return Promise.all(userGroups.map(async (group) => {
      tempGroupPermissions = await this.getJsonGroupPermissions(testUserId, resourceName, group.groupResourceName, group.groupName, group.groupID);
      unconvertedPermissionsArray = this.addToUnconvertedPermissionsArray(tempGroupPermissions, unconvertedPermissionsArray);
      tempGroupPermissions = await this.getDbGroupPermissions(sequelize, resourceName, group.groupResourceName, group.groupName, group.groupId);
      unconvertedPermissionsArray = this.addToUnconvertedPermissionsArray(tempGroupPermissions, unconvertedPermissionsArray);
    })).then((unconvertedPermissions) => {
      const convertedPermissionsArray = unconvertedPermissions.map(epilogueAuth.convertPermissions).reduce(this.combinePermissions, []);
      return Boolean(convertedPermissionsArray.reduce(this.combinePermissions, [])[permissionsIndex]);
    });
  },
  addToUnconvertedPermissionsArray(tempGroupPermissions, unconvertedPermissionsArray) {
    if (tempGroupPermissions) {
      if (typeof tempGroupPermissions === 'string') {
        unconvertedPermissionsArray.push(tempGroupPermissions);
      } else if (Array.isArray(tempGroupPermissions) === true) {
        unconvertedPermissionsArray.concat(tempGroupPermissions);
      }
    }
    return unconvertedPermissionsArray;
  },
  getUserGroups(testUserId, req, sequelize) {
    const userId = (testUserId) || ((req || {}).user || {}).id;
    let queryString = 'SELECT permission FROM "UserGroupXref"';
    queryString += ` where "UserId" = '${userId}'`;
    return sequelize.query(queryString, { type: sequelize.QueryTypes.SELECT })
      .then(userGroupsResults => userGroupsResults);
  },
};
