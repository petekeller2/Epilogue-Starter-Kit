let srcOrBuild;
if (process.env.NODE_ENV === 'staging' || process.env.NODE_ENV === 'production') {
  srcOrBuild = 'build';
} else {
  srcOrBuild = 'src';
}
const config = require(`../../../${srcOrBuild}/config`).default;

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
  describe(`Todo (${testPermissionsForResource}) (${testConfig.testCases[testConfig.testNumber - 1].userID})`, () => {
    it('list', done => {
      const options = utilities.createRequestOptions('todos');
      request.get(options, (error, res) => {
        // console.log('res', res);
        let matches = res.body.match(/wake up/g);
        // console.log(matches);
        if (matches && matches.length > 0) {
          matches = true;
        } else {
          matches = false;
        }
        if (epilogueAuth.convertPermissions(testPermissionsForResource)[15] === false && testConfig.testCases[testConfig.testNumber - 1].userID === '') {
          shouldBe = false;
        } else {
          shouldBe = true;
        }
        assert.equal(shouldBe, matches);
        done();
      });
    }).timeout(0);
    it('create', done => {
      let options = utilities.createRequestOptions('todos');
      request.post(
        options,
        {json: { id: 4, task: 'go to store', dueDate: '12/21/17', UserId: testConfig.testCases[testConfig.testNumber - 1].userID }},
        (error, response, body) => {
          options = utilities.createRequestOptions('todos/4');
          request.get(options, (error, res) => {
            // console.log('res', res.body);
            let matches = res.body.match(/go to store/g);
            console.log('matches', matches);
            if (matches && matches.length > 0) {
              matches = true;
            } else {
              matches = false;
            }
            console.log('matchesBool', matches);
            // console.log('testConfig.testCases[testConfig.testNumber - 1].userID', testConfig.testCases[testConfig.testNumber - 1].userID);
            if (epilogueAuth.convertPermissions(testPermissionsForResource)[16] === false && testConfig.testCases[testConfig.testNumber - 1].userID === '') {
              shouldBe = false;
            } else {
              shouldBe = true;
            }
            console.log('shouldBeBool', shouldBe);
            assert.equal(shouldBe, matches);
            done();
          });
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
        if (epilogueAuth.convertPermissions(testPermissionsForResource)[17] === false && testConfig.testCases[testConfig.testNumber - 1].userID === '') {
          shouldBe = false;
        } else if (epilogueAuth.convertPermissions(testPermissionsForResource)[17] === false && epilogueAuth.convertPermissions(testPermissionsForResource)[12] === false && testConfig.testCases[testConfig.testNumber - 1].userID !== '12345') {
          shouldBe = false;
        } else {
          shouldBe = true;
        }
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
