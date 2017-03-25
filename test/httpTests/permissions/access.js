let srcOrBuild;
if (process.env.NODE_ENV === 'staging' || process.env.NODE_ENV === 'production') {
  srcOrBuild = 'build';
} else {
  srcOrBuild = 'src';
}
const config = require(`../../../${srcOrBuild}/config`);
const utilities = require(`../../../${srcOrBuild}/utilities`);
const epilogueAuth = require(`../../../${srcOrBuild}/auth/epilogueAuth`).default;

import assert from 'assert';
import request from 'request';
import winston from 'winston';
import testConfig from '../../testConfig.json';

if (config.environment === 'testing' || config.environment === 'staging') {
  winston.info('testConfig.testNumber in access.js', testConfig.testNumber - 1);
  const testPermissionsArray = testConfig.testCases[testConfig.testNumber - 1].permissions;
  let shouldBe = true;
  let testPermissionsForResource = testPermissionsArray[testPermissionsArray.indexOf('Todo') + 1];
  let testPermissions = epilogueAuth.convertPermissions(testPermissionsForResource);
  describe(`Todo (${testPermissionsForResource}) (${testConfig.testCases[testConfig.testNumber - 1].userID})`, () => {
    it('list', done => {
      const options = utilities.createRequestOptions('todos');
      console.log('list request options', options);
      request.get(options, (error, res) => {
        console.log('list error: ', error);
        console.log('res.body', res.body);
        let matches = res.body.match(/wake up/g) || res.body.match(/sleep/g) || res.body.match(/gym/g);
        // console.log(matches);
        if (matches && matches.length > 0) {
          matches = true;
        } else {
          matches = false;
        }
        console.log('converted testPermissions', testPermissions);
        if ((testPermissions[15] === false) && (testConfig.testCases[testConfig.testNumber - 1].userID.length === 0)) {
          shouldBe = false;
        } else if ((testPermissions[15] === false) && (testPermissions[10] === false) && !((testConfig.testCases[testConfig.testNumber - 1].userID === 'abc123') || ((testConfig.testCases[testConfig.testNumber - 1].userID === '12345')) || ((testConfig.testCases[testConfig.testNumber - 1].userID === '')))) {
          shouldBe = false;
        } else if ((testPermissions[10] === false) && (testPermissions[0] === false) && (testPermissions[15] === false)) {
          shouldBe = false;
        } else {
          shouldBe = true;
        }
        console.log('list matches', matches);
        console.log('list shouldBe', shouldBe);
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
          // console.log('testConfig.testCases[testConfig.testNumber - 1].userID', testConfig.testCases[testConfig.testNumber - 1].userID);
          if ((testPermissions[16] === false) && (testConfig.testCases[testConfig.testNumber - 1].userID.length === 0)) {
            shouldBe = false;
            console.log('should not be able to create without being logged in')
          } else if ((testPermissions[16] === false) && (testPermissions[11] === false) && (testPermissions[1] === false)) {
            shouldBe = false;
            console.log('no one should be able to create')
          } else {
            shouldBe = true;
          }
          console.log('create matchesBool', matches);
          console.log('create shouldBeBool', shouldBe);
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
        console.log('testPermissions[17]', testPermissions[17]);
        console.log('testPermissions[12]', testPermissions[12]);

        if ((testPermissions[17] === false) && (testConfig.testCases[testConfig.testNumber - 1].userID.length === 0)) {
          shouldBe = false;
        } else if ((testPermissions[17] === false) && (testPermissions[12] === false) && ((testConfig.testCases[testConfig.testNumber - 1].userID) !== '12345')) {
          shouldBe = false;
        } else if ((testPermissions[17] === false) && (testPermissions[12] === false) && (testPermissions[2] === false)) {
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
    }).timeout(0);
    it('destroy', done => {

      done();
    }).timeout(0);
  });
  //------------------------------------------------------------------------------------------
  testPermissionsForResource = testPermissionsArray[testPermissionsArray.indexOf('User') + 1];
  describe(`User (${testPermissionsForResource}) (${testConfig.testCases[testConfig.testNumber - 1].userID})`, () => {
    it('list', done => {

      done();
    }).timeout(0);
    it('create', done => {

      done();
    }).timeout(0);
    it('read', done => {

      done();
    }).timeout(0);
    it('update', done => {

      done();
    }).timeout(0);
    it('destroy', done => {

      done();
    }).timeout(0);
  });
  //------------------------------------------------------------------------------------------
  testPermissionsForResource = testPermissionsArray[testPermissionsArray.indexOf('Neighborhood') + 1];
  describe(`Neighborhood (${testPermissionsForResource}) (${testConfig.testCases[testConfig.testNumber - 1].userID})`, () => {
    it('list', done => {

      done();
    }).timeout(0);
    it('create', done => {

      done();
    }).timeout(0);
    it('read', done => {

      done();
    }).timeout(0);
    it('update', done => {

      done();
    }).timeout(0);
    it('destroy', done => {

      done();
    }).timeout(0);
  });
}
