// let srcOrBuild;
// if (process.env.NODE_ENV === 'staging' || process.env.NODE_ENV === 'production') {
//   srcOrBuild = 'build';
// } else {
//   srcOrBuild = 'src';
// }
// const epilogueAuth = require(`../../${srcOrBuild}/auth/epilogueAuth`).default;
// import assert from 'assert';
//
// let permissionReturnExpected, permissionReturnActual;
//
// describe('Permissions conversions for strings', () => {
//   it('some permissions (pipe format)', done => {
//     permissionReturnActual = epilogueAuth.convertPermissions('----|----|lcrud|----');
//     permissionReturnExpected = [false, false, false, false, false, false, false, false, false, false, true, true, true, true, true, false, false, false, false, false];
//     assert.deepEqual(permissionReturnActual, permissionReturnExpected);
//     done();
//   });
//   it('some permissions (pipe format)', done => {
//     permissionReturnActual = epilogueAuth.convertPermissions('----|----|----|lcrud');
//     permissionReturnExpected = [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, true, true, true, true, true];
//     assert.deepEqual(permissionReturnActual, permissionReturnExpected);
//     done();
//   });
//   it('some permissions (pipe format)', done => {
//     permissionReturnActual = epilogueAuth.convertPermissions('l---|----|----|lcrud');
//     permissionReturnExpected = [true, false, false, false, false, false, false, false, false, false, false, false, false, false, false, true, true, true, true, true];
//     assert.deepEqual(permissionReturnActual, permissionReturnExpected);
//     done();
//   });
//   it('some permissions (pipe format)', done => {
//     permissionReturnActual = epilogueAuth.convertPermissions('----|----|---d|lcrud');
//     permissionReturnExpected = [false, false, false, false, false, false, false, false, false, false, false, false, false, false, true, true, true, true, true, true];
//     assert.deepEqual(permissionReturnActual, permissionReturnExpected);
//     done();
//   });
//   it('some permissions (pipe format)', done => {
//     permissionReturnActual = epilogueAuth.convertPermissions('----|----|lcrud|---d');
//     permissionReturnExpected = [false, false, false, false, false, false, false, false, false, false, true, true, true, true, true, false, false, false, false, true];
//     assert.deepEqual(permissionReturnActual, permissionReturnExpected);
//     done();
//   });
//   it('some permissions (pipe format)', done => {
//     permissionReturnActual = epilogueAuth.convertPermissions('lcrud|----|----|-----');
//     permissionReturnExpected = [true, true, true, true, true, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false];
//     assert.deepEqual(permissionReturnActual, permissionReturnExpected);
//     done();
//   });
//   it('some permissions (pipe format)', done => {
//     permissionReturnActual = epilogueAuth.convertPermissions('-----|lcrud|----|-----');
//     permissionReturnExpected = [false, false, false, false, false, true, true, true, true, true, false, false, false, false, false, false, false, false, false, false];
//     assert.deepEqual(permissionReturnActual, permissionReturnExpected);
//     done();
//   });
//
//   it('some permissions (pipe no dashes format)', done => {
//     permissionReturnActual = epilogueAuth.convertPermissions('||lcrud|');
//     permissionReturnExpected = [false, false, false, false, false, false, false, false, false, false, true, true, true, true, true, false, false, false, false, false];
//     assert.deepEqual(permissionReturnActual, permissionReturnExpected);
//     done();
//   });
//   it('some permissions (pipe no dashes format)', done => {
//     permissionReturnActual = epilogueAuth.convertPermissions('|||lcrud');
//     permissionReturnExpected = [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, true, true, true, true, true];
//     assert.deepEqual(permissionReturnActual, permissionReturnExpected);
//     done();
//   });
//   it('some permissions (pipe no dashes format)', done => {
//     permissionReturnActual = epilogueAuth.convertPermissions('l|||lcrud');
//     permissionReturnExpected = [true, false, false, false, false, false, false, false, false, false, false, false, false, false, false, true, true, true, true, true];
//     assert.deepEqual(permissionReturnActual, permissionReturnExpected);
//     done();
//   });
//   it('some permissions (pipe no dashes format)', done => {
//     permissionReturnActual = epilogueAuth.convertPermissions('||d|lcrud');
//     permissionReturnExpected = [false, false, false, false, false, false, false, false, false, false, false, false, false, false, true, true, true, true, true, true];
//     assert.deepEqual(permissionReturnActual, permissionReturnExpected);
//     done();
//   });
//   it('some permissions (pipe no dashes format)', done => {
//     permissionReturnActual = epilogueAuth.convertPermissions('||lcrud|d');
//     permissionReturnExpected = [false, false, false, false, false, false, false, false, false, false, true, true, true, true, true, false, false, false, false, true];
//     assert.deepEqual(permissionReturnActual, permissionReturnExpected);
//     done();
//   });
//   it('some permissions (pipe no dashes format)', done => {
//     permissionReturnActual = epilogueAuth.convertPermissions('lcrud|||');
//     permissionReturnExpected = [true, true, true, true, true, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false];
//     assert.deepEqual(permissionReturnActual, permissionReturnExpected);
//     done();
//   });
//   it('some permissions (pipe no dashes format)', done => {
//     permissionReturnActual = epilogueAuth.convertPermissions('|lcrud||');
//     permissionReturnExpected = [false, false, false, false, false, true, true, true, true, true, false, false, false, false, false, false, false, false, false, false];
//     assert.deepEqual(permissionReturnActual, permissionReturnExpected);
//     done();
//   });
// });