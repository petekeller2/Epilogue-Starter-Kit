let srcOrBuild;
if (process.env.NODE_ENV === 'staging' || process.env.NODE_ENV === 'production') {
  srcOrBuild = 'build';
} else {
  srcOrBuild = 'src';
}
const config = require(`../../../${srcOrBuild}/config`);
const utilities = require(`../../../${srcOrBuild}/utilities`);
const permissionConversions = require(`../../../${srcOrBuild}/auth/permissionConversions`).default;

import assert from 'assert';
import request from 'request';
import winston from 'winston';
import testConfig from '../../testConfig.json';

if (config.environment === 'testing' || config.environment === 'staging') {
  winston.info('testConfig.testNumber in access.js', testConfig.testNumber - 1);
  const testPermissionsArray = testConfig.testCases[testConfig.testNumber - 1].permissions;
  let shouldBe = true;
  let testPermissionsForResource = testPermissionsArray[testPermissionsArray.indexOf('Todo') + 1];
  let testPermissions = permissionConversions.convertPermissions(testPermissionsForResource);
  describe(`Todo (${testPermissionsForResource}) (${testConfig.testCases[testConfig.testNumber - 1].userID})`, () => {
    it('list', done => {
      const options = utilities.createRequestOptions('todos');
      console.log('list request options', options);
      request.get(options, (error, res) => {
        console.log('list error: ', error);
        console.log('res.body', res.body);
        let matches = res.body.match(/wake up/g) || res.body.match(/sleep/g) || res.body.match(/gym/g);
        // console.log('matches', matches);
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
        dueDate: '12/21/17',
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
          const matches = (response.body.id === 4);
          // console.log('testConfig.testCases[testConfig.testNumber - 1].userID', testConfig.testCases[testConfig.testNumber - 1].userID);
          if (testPermissions[16] === true) {
            shouldBe = true;
          } else if ((testPermissions[11] === true) && (testConfig.testCases[testConfig.testNumber - 1].userID.length === 0)) {
            shouldBe = false;
            console.log('should not be able to create without being logged in');
          } else if ((testPermissions[16] === false) && (testPermissions[11] === false) && (testPermissions[1] === false)) {
            shouldBe = false;
            console.log('no one should be able to create');
          } else {
            shouldBe = true;
          }
          console.log('create matchesBool', matches);
          console.log('create shouldBeBool', shouldBe);
          assert.equal(shouldBe, matches);
          done();
        },
      );
    }).timeout(0);
    it('read', done => {
      const options = utilities.createRequestOptions('todos/2');
      request.get(options, (error, res) => {
        // console.log('error', error);
        // console.log('res read', res.body);
        let matches = res.body.match(/sleep/g);
        // console.log('matches', matches);
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
      const options = utilities.createRequestOptions('todos/2');
      options.json = {
        task: 'updated task',
        dueDate: '12/21/19',
      };
      if (testConfig.testCases[testConfig.testNumber - 1].userID.length > 0) {
        options.json.UserId = testConfig.testCases[testConfig.testNumber - 1].userID;
      }
      // console.log('options', options);
      request.put(
        options,
        (error, response, body) => {
          console.log('error', error);
          console.log('response.body', response.body);
          const matches = (response.body.id === 2);
          // console.log('testConfig.testCases[testConfig.testNumber - 1].userID', testConfig.testCases[testConfig.testNumber - 1].userID);
          if ((testPermissions[18] === false) && (testConfig.testCases[testConfig.testNumber - 1].userID.length === 0)) {
            shouldBe = false;
            console.log('should not be able to update without being logged in');
          } else if ((testPermissions[18] === false) && (testPermissions[13] === false) && (testPermissions[3] === false)) {
            shouldBe = false;
            console.log('no one should be able to update');
          } else if ((testConfig.testCases[testConfig.testNumber - 1].userID !== '12345') && (testPermissions[13] === false) && (testPermissions[18] === false)) {
            shouldBe = false;
          } else {
            shouldBe = true;
          }
          console.log('create matchesBool', matches);
          console.log('create shouldBeBool', shouldBe);
          assert.equal(shouldBe, matches);
          done();
        },
      );
    }).timeout(0);
    it('destroy', done => {
      const options = utilities.createRequestOptions('todos/2');
      request.delete(
        options,
        (error, response, body) => {
          console.log('error', error);
          console.log('response.body', response.body);
          const { deleteMessage } = ((config || {}).messages || {});
          const regex = new RegExp(deleteMessage, 'g');
          let matches = response.body.match(regex);
          // console.log(matches);
          if (matches && matches.length > 0) {
            matches = true;
          } else {
            matches = false;
          }
          if (!deleteMessage) {
            matches = false;
            winston.info('No delete message found!');
          }
          // console.log('testConfig.testCases[testConfig.testNumber - 1].userID', testConfig.testCases[testConfig.testNumber - 1].userID);
          if ((testPermissions[19] === false) && (testConfig.testCases[testConfig.testNumber - 1].userID.length === 0)) {
            shouldBe = false;
            console.log('should not be able to delete without being logged in');
          } else if ((testPermissions[19] === false) && (testPermissions[14] === false) && (testPermissions[4] === false)) {
            shouldBe = false;
            console.log('no one should be able to delete');
          } else if ((testConfig.testCases[testConfig.testNumber - 1].userID !== '12345') && (testPermissions[14] === false) && (testPermissions[19] === false)) {
            shouldBe = false;
          } else {
            shouldBe = true;
          }
          console.log('create matchesBool', matches);
          console.log('create shouldBeBool', shouldBe);
          assert.equal(shouldBe, matches);
          done();
        },
      );
    }).timeout(0);
  });
  //------------------------------------------------------------------------------------------
  testPermissionsForResource = testPermissionsArray[testPermissionsArray.indexOf('Neighborhood') + 1];
  testPermissions = permissionConversions.convertPermissions(testPermissionsForResource);
  let matchesCityShouldBe = false;
  let matchesTownShouldBe = false;
  describe(`Neighborhood (${testPermissionsForResource}) (${testConfig.testCases[testConfig.testNumber - 1].userID})`, () => {
    it('list', done => {
      const options = utilities.createRequestOptions('neighborhoods');
      console.log('list request options', options);
      request.get(options, (error, res) => {
        console.log('list error: ', error);
        console.log('res.body', res.body);
        let matchesCity = res.body.match(/city/g);
        if (matchesCity && matchesCity.length > 0) {
          matchesCity = true;
        } else {
          matchesCity = false;
        }
        let matchesTown = res.body.match(/town/g);
        if (matchesTown && matchesTown.length > 0) {
          matchesTown = true;
        } else {
          matchesTown = false;
        }
        if (((testPermissions[0] === true) || (testPermissions[5] === true)) && testPermissions[10] === false && testPermissions[15] === false) {
          if (testConfig.testCases[testConfig.testNumber - 1].userID === 'abc123') {
            matchesCityShouldBe = true;
            matchesTownShouldBe = false;
          } else if (testPermissions[5] === true && testConfig.testCases[testConfig.testNumber - 1].userID === 'testing') {
            matchesCityShouldBe = true;
            matchesTownShouldBe = true;
          } else {
            matchesCityShouldBe = false;
            matchesTownShouldBe = false;
          }
        } else if (testPermissions[10] === true && testConfig.testCases[testConfig.testNumber - 1].userID.length > 0) {
          matchesCityShouldBe = true;
          matchesTownShouldBe = true;
        } else if (testPermissions[15] === true) {
          matchesCityShouldBe = true;
          matchesTownShouldBe = true;
        } else {
          matchesCityShouldBe = false;
          matchesTownShouldBe = false;
        }
        const matchesArray = [matchesCity, matchesTown];
        const shouldBeArray = [matchesCityShouldBe, matchesTownShouldBe];
        console.log('list matchesArray', matchesArray);
        console.log('list shouldBeArray', shouldBeArray);
        assert.deepEqual(matchesArray, shouldBeArray);
        done();
      });
    }).timeout(0);
    it('create', done => {
      const options = utilities.createRequestOptions('neighborhoods');
      options.json = {
        id: 3,
        name: 'village',
        population: '500',
        ownerID: 'abc123',
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
          const matches = (response.body.id === 3);
          console.log('testConfig.testCases[testConfig.testNumber - 1].userID.length', testConfig.testCases[testConfig.testNumber - 1].userID.length);
          if ((testPermissions[16] === false) && (testConfig.testCases[testConfig.testNumber - 1].userID.length === 0)) {
            shouldBe = false;
            console.log('should not be able to create without being logged in');
          } else if ((testPermissions[16] === false) && (testPermissions[11] === false) && (testPermissions[1] === false)) {
            shouldBe = false;
            console.log('no one should be able to create');
          } else {
            shouldBe = true;
          }
          console.log('create matchesBool', matches);
          console.log('create shouldBeBool', shouldBe);
          assert.equal(shouldBe, matches);
          done();
        },
      );
    }).timeout(0);
    it('read', done => {
      // TODO
      done();
    }).timeout(0);
    it('update', done => {
      // TODO
      done();
    }).timeout(0);
    it('destroy', done => {
      // TODO
      done();
    }).timeout(0);
  });
}
