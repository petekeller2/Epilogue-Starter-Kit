let srcOrBuild;
if (process.env.NODE_ENV === 'staging' || process.env.NODE_ENV === 'production') {
  srcOrBuild = 'build';
} else {
  srcOrBuild = 'src';
}
const groups = require(`../../../${srcOrBuild}/auth/groups`).default;
const config = require(`../../../${srcOrBuild}/config`);
import assert from 'assert';
import Sequelize from 'sequelize';

const database = new Sequelize(config.dbString);

describe('Should have access to', () => {
  it('resource Todo, permission 6', done => {
    groups.accessCheck('testing', false, database, 'Todo', 6).then(accessResult => {
      assert.deepEqual(accessResult, true);
      done();
    });
  }).timeout(0);
  it('resource Todo, permission 8', done => {
    groups.accessCheck('testing', false, database, 'Todo', 8).then(accessResult => {
      assert.deepEqual(accessResult, true);
      done();
    });
  }).timeout(0);
  it('resource Todo, permission 9', done => {
    groups.accessCheck('testing', false, database, 'Todo', 9).then(accessResult => {
      assert.deepEqual(accessResult, true);
      done();
    });
  }).timeout(0);
  it('resource Neighborhood, permission 18', done => {
    groups.accessCheck('testing', false, database, 'Neighborhood', 18).then(accessResult => {
      assert.deepEqual(accessResult, true);
      done();
    });
  }).timeout(0);
  it('resource Neighborhood, permission 17', done => {
    groups.accessCheck('testing', false, database, 'Neighborhood', 17).then(accessResult => {
      assert.deepEqual(accessResult, true);
      done();
    });
  }).timeout(0);
  it('resource Neighborhood, permission 16', done => {
    groups.accessCheck('testing', false, database, 'Neighborhood', 16).then(accessResult => {
      assert.deepEqual(accessResult, true);
      done();
    });
  }).timeout(0);
  it('resource User, permission 5', done => {
    groups.accessCheck('testing', false, database, 'User', 5).then(accessResult => {
      assert.deepEqual(accessResult, true);
      done();
    });
  }).timeout(0);
  it('resource User, permission 9', done => {
    groups.accessCheck('testing', false, database, 'User', 9).then(accessResult => {
      assert.deepEqual(accessResult, true);
      done();
    });
  }).timeout(0);
  it('resource User, permission 12', done => {
    groups.accessCheck('testing', false, database, 'User', 12).then(accessResult => {
      assert.deepEqual(accessResult, true);
      done();
    });
  }).timeout(0);
});

describe('Should not have access to', () => {
  it('resource Todo, permission 19', done => {
    groups.accessCheck('testing', false, database, 'Todo', 19).then(accessResult => {
      assert.deepEqual(accessResult, false);
      done();
    });
  }).timeout(0);
  it('resource Todo, permission 18', done => {
    groups.accessCheck('testing', false, database, 'Todo', 18).then(accessResult => {
      assert.deepEqual(accessResult, false);
      done();
    });
  }).timeout(0);
  it('resource Todo, permission 17', done => {
    groups.accessCheck('testing', false, database, 'Todo', 17).then(accessResult => {
      assert.deepEqual(accessResult, false);
      done();
    });
  }).timeout(0);
  it('resource Neighborhood, permission 19', done => {
    groups.accessCheck('testing', false, database, 'Neighborhood', 19).then(accessResult => {
      assert.deepEqual(accessResult, false);
      done();
    });
  }).timeout(0);
  it('resource Neighborhood, permission 11', done => {
    groups.accessCheck('testing', false, database, 'Neighborhood', 11).then(accessResult => {
      assert.deepEqual(accessResult, false);
      done();
    });
  }).timeout(0);
  it('resource Neighborhood, permission 12', done => {
    groups.accessCheck('testing', false, database, 'Neighborhood', 12).then(accessResult => {
      assert.deepEqual(accessResult, false);
      done();
    });
  }).timeout(0);
  it('resource User, permission 19', done => {
    groups.accessCheck('testing', false, database, 'User', 19).then(accessResult => {
      assert.deepEqual(accessResult, false);
      done();
    });
  }).timeout(0);
  it('resource User, permission 18', done => {
    groups.accessCheck('testing', false, database, 'User', 18).then(accessResult => {
      assert.deepEqual(accessResult, false);
      done();
    });
  }).timeout(0);
  it('resource User, permission 1', done => {
    groups.accessCheck('testing', false, database, 'User', 1).then(accessResult => {
      assert.deepEqual(accessResult, false);
      done();
    });
  }).timeout(0);
});
