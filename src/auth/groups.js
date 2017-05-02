import fs from 'fs-extra';

export default {
  getJsonGroupPermissions(isTest) {
    let jsonPath = './groupPermissions.json';
    if (isTest) {
      jsonPath = '../test/testGroupPermissions.json';
    }
    fs.readFile(jsonPath, 'utf8', (testGroupPermissionsErr, testGroupPermissionsData) => {
      const groupPermissions = JSON.parse(testGroupPermissionsData);
      Object.entries(groupPermissions).forEach(([resource, resourceArray]) => {

      });
    });
  },
  getDbGroupPermissions() {

  },
};
