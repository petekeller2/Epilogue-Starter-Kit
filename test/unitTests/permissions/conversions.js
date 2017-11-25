let srcOrBuild;
if (process.env.NODE_ENV === 'staging' || process.env.NODE_ENV === 'production') {
  srcOrBuild = 'build';
} else {
  srcOrBuild = 'src';
}
const permissionConversions = require(`../../../${srcOrBuild}/auth/permissionConversions`).default;
import assert from 'assert';

let permissionReturnExpected;
let permissionReturnActual;

describe('All elements should be true for', () => {
  it('empty string', done => {
    permissionReturnActual = permissionConversions.convertPermissions('');
    permissionReturnExpected = [true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true];
    assert.deepEqual(permissionReturnActual, permissionReturnExpected);
    done();
  });
  it('false boolean', done => {
    permissionReturnActual = permissionConversions.convertPermissions(false);
    permissionReturnExpected = [true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true];
    assert.deepEqual(permissionReturnActual, permissionReturnExpected);
    done();
  });
  it('true boolean', done => {
    permissionReturnActual = permissionConversions.convertPermissions(true);
    permissionReturnExpected = [true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true];
    assert.deepEqual(permissionReturnActual, permissionReturnExpected);
    done();
  });
});

describe('All elements should be false for', () => {
  "use strict";
  it('empty array', done => {
    permissionReturnActual = permissionConversions.convertPermissions([]);
    permissionReturnExpected = [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false];
    assert.deepEqual(permissionReturnActual, permissionReturnExpected);
    done();
  });
  it('empty object', done => {
    permissionReturnActual = permissionConversions.convertPermissions({});
    permissionReturnExpected = [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false];
    assert.deepEqual(permissionReturnActual, permissionReturnExpected);
    done();
  });
  it('non finite numbers', done => {
    permissionReturnActual = permissionConversions.convertPermissions(Infinity);
    permissionReturnExpected = [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false];
    assert.deepEqual(permissionReturnActual, permissionReturnExpected);
    done();
  });
  it('mix of strings and numbers', done => {
    permissionReturnActual = permissionConversions.convertPermissions("hello42");
    permissionReturnExpected = [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false];
    assert.deepEqual(permissionReturnActual, permissionReturnExpected);
    done();
  });
});

describe('Permissions conversions for numbers', () => {
  it('should all be true (hexadecimal)', done => {
    permissionReturnActual = permissionConversions.convertPermissions(0xFFFF);
    permissionReturnExpected = [true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true];
    assert.deepEqual(permissionReturnActual, permissionReturnExpected);
    done();
  });
  it('should all be true (decimal)', done => {
    permissionReturnActual = permissionConversions.convertPermissions(65535);
    permissionReturnExpected = [true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true];
    assert.deepEqual(permissionReturnActual, permissionReturnExpected);
    done();
  });
  it('should all be true (octal)', done => {
    permissionReturnActual = permissionConversions.convertPermissions(0o177777);
    permissionReturnExpected = [true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true];
    assert.deepEqual(permissionReturnActual, permissionReturnExpected);
    done();
  });
  it('should all be true (binary)', done => {
    permissionReturnActual = permissionConversions.convertPermissions(0b1111111111111111);
    permissionReturnExpected = [true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true];
    assert.deepEqual(permissionReturnActual, permissionReturnExpected);
    done();
  });

  it('some should be true (hexadecimal)', done => {
    permissionReturnActual = permissionConversions.convertPermissions(0xEFFF);
    permissionReturnExpected = [true, true, true, true, false, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true];
    assert.deepEqual(permissionReturnActual, permissionReturnExpected);
    done();
  });
  it('some should be true (decimal)', done => {
    permissionReturnActual = permissionConversions.convertPermissions(61439);
    permissionReturnExpected = [true, true, true, true, false, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true];
    assert.deepEqual(permissionReturnActual, permissionReturnExpected);
    done();
  });
  it('some should be true (octal)', done => {
    permissionReturnActual = permissionConversions.convertPermissions(0o167777);
    permissionReturnExpected = [true, true, true, true, false, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true];
    assert.deepEqual(permissionReturnActual, permissionReturnExpected);
    done();
  });
  it('some should be true (binary)', done => {
    permissionReturnActual = permissionConversions.convertPermissions(0b1110111111111111);
    permissionReturnExpected = [true, true, true, true, false, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true];
    assert.deepEqual(permissionReturnActual, permissionReturnExpected);
    done();
  });

  it('some should be true (hexadecimal string)', done => {
    permissionReturnActual = permissionConversions.convertPermissions('0xEFFF');
    permissionReturnExpected = [true, true, true, true, false, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true];
    assert.deepEqual(permissionReturnActual, permissionReturnExpected);
    done();
  });
  it('some should be true (decimal string)', done => {
    permissionReturnActual = permissionConversions.convertPermissions('61439');
    permissionReturnExpected = [true, true, true, true, false, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true];
    assert.deepEqual(permissionReturnActual, permissionReturnExpected);
    done();
  });
  it('some should be true (octal string)', done => {
    permissionReturnActual = permissionConversions.convertPermissions('0o167777');
    permissionReturnExpected = [true, true, true, true, false, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true];
    assert.deepEqual(permissionReturnActual, permissionReturnExpected);
    done();
  });
  it('some should be true (binary string)', done => {
    permissionReturnActual = permissionConversions.convertPermissions('0b1110111111111111');
    permissionReturnExpected = [true, true, true, true, false, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true];
    assert.deepEqual(permissionReturnActual, permissionReturnExpected);
    done();
  });

  it('some should be true (hexadecimal string with comment)', done => {
    permissionReturnActual = permissionConversions.convertPermissions('hexadecimal 0xEFFF');
    permissionReturnExpected = [true, true, true, true, false, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true];
    assert.deepEqual(permissionReturnActual, permissionReturnExpected);
    done();
  });
  it('all should be false (decimal string with comment)', done => {
    permissionReturnActual = permissionConversions.convertPermissions(' decimal 61439');
    permissionReturnExpected = [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false];
    assert.deepEqual(permissionReturnActual, permissionReturnExpected);
    done();
  });
  it('some should be true (octal string with comment)', done => {
    permissionReturnActual = permissionConversions.convertPermissions('octal 0o167777');
    permissionReturnExpected = [true, true, true, true, false, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true];
    assert.deepEqual(permissionReturnActual, permissionReturnExpected);
    done();
  });
  it('some should be true (binary string with comment)', done => {
    permissionReturnActual = permissionConversions.convertPermissions('binary 0b1110111111111111');
    permissionReturnExpected = [true, true, true, true, false, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true];
    assert.deepEqual(permissionReturnActual, permissionReturnExpected);
    done();
  });

  it('some should be true with a read and list being false (hexadecimal)', done => {
    permissionReturnActual = permissionConversions.convertPermissions(0xBFFF);
    permissionReturnExpected = [false, true, false, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true];
    assert.deepEqual(permissionReturnActual, permissionReturnExpected);
    done();
  });
});

describe('Permissions conversions for arrays', () => {
  it('should add false elements to the end if elements are missing', done => {
    permissionReturnActual = permissionConversions.convertPermissions([true, false, true, true, true]);
    permissionReturnExpected = [true, false, true, true, true, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false];
    assert.deepEqual(permissionReturnActual, permissionReturnExpected);
    done();
  });
});

describe('Permissions conversions for strings', () => {
  it('all permissions (pipe missing format)', done => {
    permissionReturnActual = permissionConversions.convertPermissions('lcrudlcrudlcrudlcrud');
    permissionReturnExpected = [true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true];
    assert.deepEqual(permissionReturnActual, permissionReturnExpected);
    done();
  });
  it('some permissions (pipe missing format)', done => {
    permissionReturnActual = permissionConversions.convertPermissions('crudlcudlcrudlcrud');
    permissionReturnExpected = [false, true, true, true, true, true, true, false, true, true, true, true, true, true, true, true, true, true, true, true];
    assert.deepEqual(permissionReturnActual, permissionReturnExpected);
    done();
  });
  it('some permissions (pipe missing format, dstr as d)', done => {
    permissionReturnActual = permissionConversions.convertPermissions('crudstrlcudlcrudlcrudstr');
    permissionReturnExpected = [false, true, true, true, true, true, true, false, true, true, true, true, true, true, true, true, true, true, true, true];
    assert.deepEqual(permissionReturnActual, permissionReturnExpected);
    done();
  });
  it('some permissions (pipe missing format, upd as u)', done => {
    permissionReturnActual = permissionConversions.convertPermissions('crupddlcudlcrupddlcrud');
    permissionReturnExpected = [false, true, true, true, true, true, true, false, true, true, true, true, true, true, true, true, true, true, true, true];
    assert.deepEqual(permissionReturnActual, permissionReturnExpected);
    done();
  });
  it('some permissions (pipe missing format, ls as l)', done => {
    permissionReturnActual = permissionConversions.convertPermissions('crudlscudlcrudlscrud');
    permissionReturnExpected = [false, true, true, true, true, true, true, false, true, true, true, true, true, true, true, true, true, true, true, true];
    assert.deepEqual(permissionReturnActual, permissionReturnExpected);
    done();
  });
  it('some permissions (pipe missing format, * as lcrud)', done => {
    permissionReturnActual = permissionConversions.convertPermissions('crudlcud*lcrud');
    permissionReturnExpected = [false, true, true, true, true, true, true, false, true, true, true, true, true, true, true, true, true, true, true, true];
    assert.deepEqual(permissionReturnActual, permissionReturnExpected);
    done();
  });
  it('some permissions with meaningless characters (pipe missing format)', done => {
    permissionReturnActual = permissionConversions.convertPermissions('crvvvvvudlcutttdlcwrqqqwqudlcrud');
    permissionReturnExpected = [false, true, true, true, true, true, true, false, true, true, true, true, true, true, true, true, true, true, true, true];
    assert.deepEqual(permissionReturnActual, permissionReturnExpected);
    done();
  });
  it('some permissions (pipe format)', done => {
    permissionReturnActual = permissionConversions.convertPermissions('----|----|lcrud|----');
    permissionReturnExpected = [false, false, false, false, false, false, false, false, false, false, true, true, true, true, true, false, false, false, false, false];
    assert.deepEqual(permissionReturnActual, permissionReturnExpected);
    done();
  });
  it('some permissions (pipe format)', done => {
    permissionReturnActual = permissionConversions.convertPermissions('----|----|----|lcrud');
    permissionReturnExpected = [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, true, true, true, true, true];
    assert.deepEqual(permissionReturnActual, permissionReturnExpected);
    done();
  });
  it('some permissions (pipe format)', done => {
    permissionReturnActual = permissionConversions.convertPermissions('l---|----|----|lcrud');
    permissionReturnExpected = [true, false, false, false, false, false, false, false, false, false, false, false, false, false, false, true, true, true, true, true];
    assert.deepEqual(permissionReturnActual, permissionReturnExpected);
    done();
  });
  it('some permissions (pipe format)', done => {
    permissionReturnActual = permissionConversions.convertPermissions('----|----|---d|lcrud');
    permissionReturnExpected = [false, false, false, false, false, false, false, false, false, false, false, false, false, false, true, true, true, true, true, true];
    assert.deepEqual(permissionReturnActual, permissionReturnExpected);
    done();
  });
  it('some permissions (pipe format)', done => {
    permissionReturnActual = permissionConversions.convertPermissions('----|----|lcrud|---d');
    permissionReturnExpected = [false, false, false, false, false, false, false, false, false, false, true, true, true, true, true, false, false, false, false, true];
    assert.deepEqual(permissionReturnActual, permissionReturnExpected);
    done();
  });
  it('some permissions (pipe format)', done => {
    permissionReturnActual = permissionConversions.convertPermissions('lcrud|----|----|-----');
    permissionReturnExpected = [true, true, true, true, true, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false];
    assert.deepEqual(permissionReturnActual, permissionReturnExpected);
    done();
  });
  it('some permissions (pipe format)', done => {
    permissionReturnActual = permissionConversions.convertPermissions('-----|lcrud|----|-----');
    permissionReturnExpected = [false, false, false, false, false, true, true, true, true, true, false, false, false, false, false, false, false, false, false, false];
    assert.deepEqual(permissionReturnActual, permissionReturnExpected);
    done();
  });
  it('all permissions (pipe format)', done => {
    permissionReturnActual = permissionConversions.convertPermissions('lcrud|lcrud|lcrud|lcrud');
    permissionReturnExpected = [true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true];
    assert.deepEqual(permissionReturnActual, permissionReturnExpected);
    done();
  });
  it('some permissions (pipe no dashes format)', done => {
    permissionReturnActual = permissionConversions.convertPermissions('||lcrud|');
    permissionReturnExpected = [false, false, false, false, false, false, false, false, false, false, true, true, true, true, true, false, false, false, false, false];
    assert.deepEqual(permissionReturnActual, permissionReturnExpected);
    done();
  });
  it('some permissions (pipe no dashes format)', done => {
    permissionReturnActual = permissionConversions.convertPermissions('|||lcrud');
    permissionReturnExpected = [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, true, true, true, true, true];
    assert.deepEqual(permissionReturnActual, permissionReturnExpected);
    done();
  });
  it('some permissions (pipe no dashes format)', done => {
    permissionReturnActual = permissionConversions.convertPermissions('l|||lcrud');
    permissionReturnExpected = [true, false, false, false, false, false, false, false, false, false, false, false, false, false, false, true, true, true, true, true];
    assert.deepEqual(permissionReturnActual, permissionReturnExpected);
    done();
  });
  it('some permissions (pipe no dashes format)', done => {
    permissionReturnActual = permissionConversions.convertPermissions('||d|lcrud');
    permissionReturnExpected = [false, false, false, false, false, false, false, false, false, false, false, false, false, false, true, true, true, true, true, true];
    assert.deepEqual(permissionReturnActual, permissionReturnExpected);
    done();
  });
  it('some permissions (pipe no dashes format)', done => {
    permissionReturnActual = permissionConversions.convertPermissions('||lcrud|d');
    permissionReturnExpected = [false, false, false, false, false, false, false, false, false, false, true, true, true, true, true, false, false, false, false, true];
    assert.deepEqual(permissionReturnActual, permissionReturnExpected);
    done();
  });
  it('some permissions (pipe no dashes format)', done => {
    permissionReturnActual = permissionConversions.convertPermissions('lcrud|||');
    permissionReturnExpected = [true, true, true, true, true, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false];
    assert.deepEqual(permissionReturnActual, permissionReturnExpected);
    done();
  });
  it('some permissions (pipe no dashes format)', done => {
    permissionReturnActual = permissionConversions.convertPermissions('|lcrud||');
    permissionReturnExpected = [false, false, false, false, false, true, true, true, true, true, false, false, false, false, false, false, false, false, false, false];
    assert.deepEqual(permissionReturnActual, permissionReturnExpected);
    done();
  });
  it('all permissions with a missing pipe (pipe format)', done => {
    permissionReturnActual = permissionConversions.convertPermissions('lcrudlcrud|lcrud|lcrud');
    permissionReturnExpected = [true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true];
    assert.deepEqual(permissionReturnActual, permissionReturnExpected);
    done();
  });
  it('all permissions with meaningless characters (pipe format)', done => {
    permissionReturnActual = permissionConversions.convertPermissions('lcrwwud|lcrvwvud|lcrud|lcrqud');
    permissionReturnExpected = [true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true];
    assert.deepEqual(permissionReturnActual, permissionReturnExpected);
    done();
  });
  it('all permissions with an extra pipe (pipe format)', done => {
    permissionReturnActual = permissionConversions.convertPermissions('lcrud|lcrud|lcrud|lcrud|');
    permissionReturnExpected = [true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true];
    assert.deepEqual(permissionReturnActual, permissionReturnExpected);
    done();
  });
  it('all permissions with extra pipes (pipe format)', done => {
    permissionReturnActual = permissionConversions.convertPermissions('lcrud|lcrud|lcrud|lcrud|||||');
    permissionReturnExpected = [true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true];
    assert.deepEqual(permissionReturnActual, permissionReturnExpected);
    done();
  });
  it('some permissions (pipe format)', done => {
    permissionReturnActual = permissionConversions.convertPermissions('lrud|lcrd|lcrud|lcrud');
    permissionReturnExpected = [true, false, true, true, true, true, true, true, false, true, true, true, true, true, true, true, true, true, true, true];
    assert.deepEqual(permissionReturnActual, permissionReturnExpected);
    done();
  });
  it('some permissions with missing pipes (pipe format)', done => {
    permissionReturnActual = permissionConversions.convertPermissions('lrud|lcrdlcrudlcrud');
    permissionReturnExpected = [true, false, true, true, true, true, true, true, false, true, true, true, true, true, true, true, true, true, true, true];
    assert.deepEqual(permissionReturnActual, permissionReturnExpected);
    done();
  });
  it('no owner permissions (pipe format)', done => {
    permissionReturnActual = permissionConversions.convertPermissions('|lcrud|lcrud|lcrud');
    permissionReturnExpected = [false, false, false, false, false, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true];
    assert.deepEqual(permissionReturnActual, permissionReturnExpected);
    done();
  });
  it('no noAccount permissions (pipe format)', done => {
    permissionReturnActual = permissionConversions.convertPermissions('lcrud|lcrud|lcrud|');
    permissionReturnExpected = [true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, false, false, false, false, false];
    assert.deepEqual(permissionReturnActual, permissionReturnExpected);
    done();
  });
  it('no loggedIn permissions (pipe format)', done => {
    permissionReturnActual = permissionConversions.convertPermissions('lcrud|lcrud||lcrud');
    permissionReturnExpected = [true, true, true, true, true, true, true, true, true, true, false, false, false, false, false, true, true, true, true, true];
    assert.deepEqual(permissionReturnActual, permissionReturnExpected);
    done();
  });
  it('no group or loggedIn permissions (pipe format)', done => {
    permissionReturnActual = permissionConversions.convertPermissions('lcrud|||lcrud');
    permissionReturnExpected = [true, true, true, true, true, false, false, false, false, false, false, false, false, false, false, true, true, true, true, true];
    assert.deepEqual(permissionReturnActual, permissionReturnExpected);
    done();
  });
  it('no group or loggedIn permissions (pipe and n/a format)', done => {
    permissionReturnActual = permissionConversions.convertPermissions('lcrud|n/a|lcrud');
    permissionReturnExpected = [true, true, true, true, true, false, false, false, false, false, false, false, false, false, false, true, true, true, true, true];
    assert.deepEqual(permissionReturnActual, permissionReturnExpected);
    done();
  });
  it('no group or loggedIn permissions (pipe and x format)', done => {
    permissionReturnActual = permissionConversions.convertPermissions('lcrud|x|lcrud');
    permissionReturnExpected = [true, true, true, true, true, false, false, false, false, false, false, false, false, false, false, true, true, true, true, true];
    assert.deepEqual(permissionReturnActual, permissionReturnExpected);
    done();
  });
  it('no group or loggedIn permissions (x format)', done => {
    permissionReturnActual = permissionConversions.convertPermissions('lcrudxxxlcrud');
    permissionReturnExpected = [true, true, true, true, true, false, false, false, false, false, false, false, false, false, false, true, true, true, true, true];
    assert.deepEqual(permissionReturnActual, permissionReturnExpected);
    done();
  });
  it('no group or loggedIn permissions (x and na format)', done => {
    permissionReturnActual = permissionConversions.convertPermissions('lcrudnaxxlcrud');
    permissionReturnExpected = [true, true, true, true, true, false, false, false, false, false, false, false, false, false, false, true, true, true, true, true];
    assert.deepEqual(permissionReturnActual, permissionReturnExpected);
    done();
  });
});

describe('Permissions conversions for objects', () => {
  it('full action name', done => {
    permissionReturnActual = permissionConversions.convertPermissions({ owner: ['list', 'create', 'read'] });
    permissionReturnExpected = [true, true, true, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false];
    assert.deepEqual(permissionReturnActual, permissionReturnExpected);
    done();
  });
  it('full action name, random case', done => {
    permissionReturnActual = permissionConversions.convertPermissions({ owner: ['lIst', 'crEAte', 'reAd'] });
    permissionReturnExpected = [true, true, true, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false];
    assert.deepEqual(permissionReturnActual, permissionReturnExpected);
    done();
  });
  it('partial action name', done => {
    permissionReturnActual = permissionConversions.convertPermissions({ owner: ['l', 'c', 'r'] });
    permissionReturnExpected = [true, true, true, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false];
    assert.deepEqual(permissionReturnActual, permissionReturnExpected);
    done();
  });
  it('partial action name, random case', done => {
    permissionReturnActual = permissionConversions.convertPermissions({ owner: ['l', 'C', 'R'] });
    permissionReturnExpected = [true, true, true, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false];
    assert.deepEqual(permissionReturnActual, permissionReturnExpected);
    done();
  });
  it('partial action name, random case for both user type and actions', done => {
    permissionReturnActual = permissionConversions.convertPermissions({ oWnEr: ['l', 'C', 'R'] });
    permissionReturnExpected = [true, true, true, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false];
    assert.deepEqual(permissionReturnActual, permissionReturnExpected);
    done();
  });
  it('partial action name, many user types', done => {
    permissionReturnActual = permissionConversions.convertPermissions({ owner: ['l', 'c', 'r'], anyuser: ['d'] });
    permissionReturnExpected = [true, true, true, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, true];
    assert.deepEqual(permissionReturnActual, permissionReturnExpected);
    done();
  });
  it('partial and complete action name, many user types', done => {
    permissionReturnActual = permissionConversions.convertPermissions({ owner: ['l', 'create', 'r'], anyuser: ['d'] });
    permissionReturnExpected = [true, true, true, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, true];
    assert.deepEqual(permissionReturnActual, permissionReturnExpected);
    done();
  });
  it('complete action name, many user types, blank array', done => {
    permissionReturnActual = permissionConversions.convertPermissions({ owner: [], anyuser: ['d'] });
    permissionReturnExpected = [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, true];
    assert.deepEqual(permissionReturnActual, permissionReturnExpected);
    done();
  });
  it('blank array', done => {
    permissionReturnActual = permissionConversions.convertPermissions({ owner: [] });
    permissionReturnExpected = [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false];
    assert.deepEqual(permissionReturnActual, permissionReturnExpected);
    done();
  });
  it('invalid action', done => {
    permissionReturnActual = permissionConversions.convertPermissions({ owner: ['test'] });
    permissionReturnExpected = [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false];
    assert.deepEqual(permissionReturnActual, permissionReturnExpected);
    done();
  });
  it('invalid action and valid action', done => {
    permissionReturnActual = permissionConversions.convertPermissions({ owner: ['test', 'list'] });
    permissionReturnExpected = [true, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false];
    assert.deepEqual(permissionReturnActual, permissionReturnExpected);
    done();
  });
  it('actions out of order', done => {
    permissionReturnActual = permissionConversions.convertPermissions({ owner: ['r', 'l'] });
    permissionReturnExpected = [true, false, true, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false];
    assert.deepEqual(permissionReturnActual, permissionReturnExpected);
    done();
  });
  it('boolean array', done => {
    permissionReturnActual = permissionConversions.convertPermissions({ owner: [true, true, false, true, false] });
    permissionReturnExpected = [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false];
    assert.deepEqual(permissionReturnActual, permissionReturnExpected);
    done();
  });
});