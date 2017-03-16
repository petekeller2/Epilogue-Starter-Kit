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
import testConfig from '../../testConfig.json';
import epilogueAuth from '../../../src/auth/epilogueAuth';

// todo: replace done with promises
if (config.environment === 'testing' || config.environment === 'staging') {
  winston.info('testConfig.testNumber in access.js', testConfig.testNumber);
  const testPermissionsArray = testConfig.testCases[testConfig.testNumber - 1].permissions;
  let shouldBe = true;
  let testPermissionsForResource = testPermissionsArray[testPermissionsArray.indexOf('Todo') + 1];
  describe(`Todo (${testPermissionsForResource}) (${testConfig.testCases[testConfig.testNumber - 1].userID})`, () => {
    it('list', done => {
      request.get(`${config.protocol}://${config.host}:${config.port}/todos`, (error, res) => {
        // console.log('res', res.body);
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
    });
    it('create', done => {
      request.post(
        `${config.protocol}://${config.host}:${config.port}/todos`,
        {json: { id: 4, task: 'go to store', dueDate: '12/21/17' }},
        (error, response, body) => {
          request.get(`${config.protocol}://${config.host}:${config.port}/todos`, (error, res) => {
            // console.log('res', res.body);
            let matches = res.body.match(/go to store/g);
            // console.log(matches);
            if (matches && matches.length > 0) {
              matches = true;
            } else {
              matches = false;
            }
            if (epilogueAuth.convertPermissions(testPermissionsForResource)[16] === false && testConfig.testCases[testConfig.testNumber - 1].userID === '') {
              shouldBe = false;
            } else {
              shouldBe = true;
            }
            assert.equal(shouldBe, matches);
            done();
          });
        }
      );
    });
    it('read', done => {
      request.get(`${config.protocol}://${config.host}:${config.port}/todos/2`, (error, res) => {
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
        } else if (epilogueAuth.convertPermissions(testPermissionsForResource)[12] === false && testConfig.testCases[testConfig.testNumber - 1].userID !== 'abc123') {
          shouldBe = false;
        } else {
          shouldBe = true;
        }
        assert.equal(shouldBe, matches);
        done();
      });
    });
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
