let srcOrBuild;
if (process.env.NODE_ENV === 'staging' || process.env.NODE_ENV === 'production') {
  srcOrBuild = 'build';
} else {
  srcOrBuild = 'src';
}
const groups = require(`../../../${srcOrBuild}/auth/groups`).default;
import assert from 'assert';
import testGroupPermissions from '../../testGroupPermissions.json';

describe('Should have access to', () => {
  it(`resource X, permission ${}`, done => {
    assert.deepEqual(permissionReturnActual, permissionReturnExpected);
    done();
  });
  it(`resource X, permission ${}`, done => {
    assert.deepEqual(permissionReturnActual, permissionReturnExpected);
    done();
  });
  it(`resource X, permission ${}`, done => {
    assert.deepEqual(permissionReturnActual, permissionReturnExpected);
    done();
  });
  it(`resource Y, permission ${}`, done => {
    assert.deepEqual(permissionReturnActual, permissionReturnExpected);
    done();
  });
  it(`resource Y, permission ${}`, done => {
    assert.deepEqual(permissionReturnActual, permissionReturnExpected);
    done();
  });
  it(`resource Y, permission ${}`, done => {
    assert.deepEqual(permissionReturnActual, permissionReturnExpected);
    done();
  });
  it(`resource Z, permission ${}`, done => {
    assert.deepEqual(permissionReturnActual, permissionReturnExpected);
    done();
  });
  it(`resource Z, permission ${}`, done => {
    assert.deepEqual(permissionReturnActual, permissionReturnExpected);
    done();
  });
  it(`resource Z, permission ${}`, done => {
    assert.deepEqual(permissionReturnActual, permissionReturnExpected);
    done();
  });
});

describe('Should not have access to', () => {
  it(`resource X, permission ${}`, done => {
    assert.deepEqual(permissionReturnActual, permissionReturnExpected);
    done();
  });
  it(`resource X, permission ${}`, done => {
    assert.deepEqual(permissionReturnActual, permissionReturnExpected);
    done();
  });
  it(`resource X, permission ${}`, done => {
    assert.deepEqual(permissionReturnActual, permissionReturnExpected);
    done();
  });
  it(`resource Y, permission ${}`, done => {
    assert.deepEqual(permissionReturnActual, permissionReturnExpected);
    done();
  });
  it(`resource Y, permission ${}`, done => {
    assert.deepEqual(permissionReturnActual, permissionReturnExpected);
    done();
  });
  it(`resource Y, permission ${}`, done => {
    assert.deepEqual(permissionReturnActual, permissionReturnExpected);
    done();
  });
  it(`resource Z, permission ${}`, done => {
    assert.deepEqual(permissionReturnActual, permissionReturnExpected);
    done();
  });
  it(`resource Z, permission ${}`, done => {
    assert.deepEqual(permissionReturnActual, permissionReturnExpected);
    done();
  });
  it(`resource Z, permission ${}`, done => {
    assert.deepEqual(permissionReturnActual, permissionReturnExpected);
    done();
  });
});