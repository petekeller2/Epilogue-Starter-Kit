let srcOrBuild;
if (process.env.NODE_ENV === 'staging' || process.env.NODE_ENV === 'production') {
  srcOrBuild = 'build';
} else {
  srcOrBuild = 'src';
}
const config = require(`../../../${srcOrBuild}/config`);

import assert from 'assert';
import request from 'request';
import winston from 'winston';
import utilities from '../../../src/utilities';
import testConfig from '../../testConfig.json';
import epilogueAuth from '../../../src/auth/epilogueAuth';

if (config.environment === 'testing' || config.environment === 'staging') {
  winston.info('testConfig.testNumber in access.js', testConfig.testNumber);
  const testPermissionsArray = testConfig.testCases[testConfig.testNumber - 1].permissions;
  let shouldBe = true;
  let testPermissionsForResource = testPermissionsArray[testPermissionsArray.indexOf('Todo') + 1];
  console.log('testPermissionsForResource', testPermissionsForResource);
  describe(`Todo (${testPermissionsForResource}) (${testConfig.testCases[testConfig.testNumber - 1].userID})`, () => {
    it('list', done => {
      const options = utilities.createRequestOptions('todos');
      request.get(options, (error, res) => {
        console.log('res.body', res.body);
        let matches = res.body.match(/wake up/g) || res.body.match(/sleep/g) || res.body.match(/gym/g);
        // console.log(matches);
        if (matches && matches.length > 0) {
          matches = true;
        } else {
          matches = false;
        }
        if (((epilogueAuth.convertPermissions(testPermissionsForResource))[15] === false) && (testConfig.testCases[testConfig.testNumber - 1].userID.length === 0)) {
          shouldBe = false;
        } else if (((epilogueAuth.convertPermissions(testPermissionsForResource))[5] === false) && ((epilogueAuth.convertPermissions(testPermissionsForResource))[10] === false) && ((epilogueAuth.convertPermissions(testPermissionsForResource))[15] === false) && (testConfig.testCases[testConfig.testNumber - 1].userID !== '12345') && (testConfig.testCases[testConfig.testNumber - 1].userID !== 'abc123') && (testConfig.testCases[testConfig.testNumber - 1].userID !== '')) {
          shouldBe = false;
        } else if (((epilogueAuth.convertPermissions(testPermissionsForResource))[15] === false) && ((epilogueAuth.convertPermissions(testPermissionsForResource))[10] === false) && ((epilogueAuth.convertPermissions(testPermissionsForResource))[0] === false)) {
          shouldBe = false;
        } else {
          shouldBe = true;
        }
        assert.equal(shouldBe, matches);
        done();
      });
    }).timeout(0);
    it('create', done => {
      const options = utilities.createRequestOptions('todos');
      options.json = {
        id: 4,
        task: 'go to store',
        dueDate: '12/21/17'
      };
      if (testConfig.testCases[testConfig.testNumber - 1].userID.length > 0) {
        options.json.UserId = testConfig.testCases[testConfig.testNumber - 1].userID;
      }
      // console.log('options', options);
      request.post(
        options,
        (error, response, body) => {
          console.log('error', error);
          console.log('response.body', response.body);
          // console.log('res', res.body);
          const matches = (response.body.id === 4);
          console.log('matches', matches);
          console.log('matchesBool', matches);
          console.log('permissions', epilogueAuth.convertPermissions(testPermissionsForResource));
          // console.log('testConfig.testCases[testConfig.testNumber - 1].userID', testConfig.testCases[testConfig.testNumber - 1].userID);
          if (((epilogueAuth.convertPermissions(testPermissionsForResource))[16] === false) && (testConfig.testCases[testConfig.testNumber - 1].userID.length === 0)) {
            shouldBe = false;
            console.log('should not be able to create without being logged in')
          } else if (((epilogueAuth.convertPermissions(testPermissionsForResource))[16] === false) && ((epilogueAuth.convertPermissions(testPermissionsForResource))[11] === false) && ((epilogueAuth.convertPermissions(testPermissionsForResource))[1] === false)) {
            shouldBe = false;
            console.log('no one should be able to create')
          } else {
            shouldBe = true;
          }
          console.log('shouldBeBool', shouldBe);
          assert.equal(shouldBe, matches);
          done();
        }
      );
    }).timeout(0);
    it('read', done => {
      const options = utilities.createRequestOptions('todos/2');
      request.get(options, (error, res) => {
        // console.log('error', error);
        // console.log('res read', res.body);
        let matches = res.body.match(/sleep/g);
        // console.log(matches);
        if (matches && matches.length > 0) {
          matches = true;
        } else {
          matches = false;
        }
        console.log('read matches', matches);
        console.log('read user id', testConfig.testCases[testConfig.testNumber - 1].userID);
        console.log('read user id length', testConfig.testCases[testConfig.testNumber - 1].userID.length);
        console.log('epilogueAuth.convertPermissions(testPermissionsForResource)[17]', (epilogueAuth.convertPermissions(testPermissionsForResource))[17]);

        if (((epilogueAuth.convertPermissions(testPermissionsForResource))[17] === false) && (testConfig.testCases[testConfig.testNumber - 1].userID.length === 0)) {
          shouldBe = false;
        } else if (((epilogueAuth.convertPermissions(testPermissionsForResource))[17] === false) && ((epilogueAuth.convertPermissions(testPermissionsForResource))[12] === false) && (testConfig.testCases[testConfig.testNumber - 1].userID !== '12345')) {
          shouldBe = false;
        } else if (((epilogueAuth.convertPermissions(testPermissionsForResource))[17] === false) && ((epilogueAuth.convertPermissions(testPermissionsForResource))[12] === false) && ((epilogueAuth.convertPermissions(testPermissionsForResource))[2] === false)) {
          shouldBe = false;
        } else {
          shouldBe = true;
        }
        console.log('read shouldBe', shouldBe);
        assert.equal(shouldBe, matches);
        done();
      });
    }).timeout(0);
    it('update', done => {

      done();
    });
    it('destroy', done => {

      done();
    });
  });
  //------------------------------------------------------------------------------------------
  testPermissionsForResource = testPermissionsArray[testPermissionsArray.indexOf('User') + 1];
  describe(`User (${testPermissionsForResource}) (${testConfig.testCases[testConfig.testNumber - 1].userID})`, () => {
    it('list', done => {

      done();
    });
    it('create', done => {

      done();
    });
    it('read', done => {

      done();
    });
    it('update', done => {

      done();
    });
    it('destroy', done => {

      done();
    });
  });
  //------------------------------------------------------------------------------------------
  testPermissionsForResource = testPermissionsArray[testPermissionsArray.indexOf('Neighborhood') + 1];
  describe(`Neighborhood (${testPermissionsForResource}) (${testConfig.testCases[testConfig.testNumber - 1].userID})`, () => {
    it('list', done => {

      done();
    });
    it('create', done => {

      done();
    });
    it('read', done => {

      done();
    });
    it('update', done => {

      done();
    });
    it('destroy', done => {

      done();
    });
  });
}
