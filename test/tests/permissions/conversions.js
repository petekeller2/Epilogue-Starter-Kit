let srcOrBuild;
if (process.env.NODE_ENV === 'staging' || process.env.NODE_ENV === 'production') {
  srcOrBuild = 'build';
} else {
  srcOrBuild = 'src';
}
const epilogueAuth = require(`../../../${srcOrBuild}/auth/epilogueAuth`).default;
import assert from 'assert';

let permissionReturnExpected, permissionReturnActual;

describe('All elements should be true for', () => {
  it('empty string', done => {
    permissionReturnActual = epilogueAuth.convertPermissions('');
    permissionReturnExpected = [true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true];
    assert.deepEqual(permissionReturnActual, permissionReturnExpected);
    done();
  });
  it('false boolean', done => {
    permissionReturnActual = epilogueAuth.convertPermissions(false);
    permissionReturnExpected = [true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true];
    assert.deepEqual(permissionReturnActual, permissionReturnExpected);
    done();
  });
  it('true boolean', done => {
    permissionReturnActual = epilogueAuth.convertPermissions(true);
    permissionReturnExpected = [true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true];
    assert.deepEqual(permissionReturnActual, permissionReturnExpected);
    done();
  });
});

describe('All elements should be false for', () => {
  "use strict";
  it('empty array', done => {
    permissionReturnActual = epilogueAuth.convertPermissions([]);
    permissionReturnExpected = [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false];
    assert.deepEqual(permissionReturnActual, permissionReturnExpected);
    done();
  });
  it('empty object', done => {
    permissionReturnActual = epilogueAuth.convertPermissions({});
    permissionReturnExpected = [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false];
    assert.deepEqual(permissionReturnActual, permissionReturnExpected);
    done();
  });
  it('non finite numbers', done => {
    permissionReturnActual = epilogueAuth.convertPermissions(Infinity);
    permissionReturnExpected = [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false];
    assert.deepEqual(permissionReturnActual, permissionReturnExpected);
    done();
  });
  it('mix of strings and numbers', done => {
    permissionReturnActual = epilogueAuth.convertPermissions("hello42");
    permissionReturnExpected = [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false];
    assert.deepEqual(permissionReturnActual, permissionReturnExpected);
    done();
  });
});

describe('Permissions conversions for numbers', () => {
  it('should all be true (hex)', done => {
    permissionReturnActual = epilogueAuth.convertPermissions(0xFFFF);
    permissionReturnExpected = [true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true];
    assert.deepEqual(permissionReturnActual, permissionReturnExpected);
    done();
  });
  it('should all be true (decimal)', done => {
    permissionReturnActual = epilogueAuth.convertPermissions(65535);
    permissionReturnExpected = [true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true];
    assert.deepEqual(permissionReturnActual, permissionReturnExpected);
    done();
  });
  it('should all be true (octal)', done => {
    permissionReturnActual = epilogueAuth.convertPermissions(0o177777);
    permissionReturnExpected = [true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true];
    assert.deepEqual(permissionReturnActual, permissionReturnExpected);
    done();
  });
  it('should all be true (binary)', done => {
    permissionReturnActual = epilogueAuth.convertPermissions(0b1111111111111111);
    permissionReturnExpected = [true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true];
    assert.deepEqual(permissionReturnActual, permissionReturnExpected);
    done();
  });

  it('some should be true (hex)', done => {
    permissionReturnActual = epilogueAuth.convertPermissions(0xEFFF);
    permissionReturnExpected = [true, true, true, true, false, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true];
    assert.deepEqual(permissionReturnActual, permissionReturnExpected);
    done();
  });
  it('some should be true (decimal)', done => {
    permissionReturnActual = epilogueAuth.convertPermissions(61439);
    permissionReturnExpected = [true, true, true, true, false, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true];
    assert.deepEqual(permissionReturnActual, permissionReturnExpected);
    done();
  });
  it('some should be true (octal)', done => {
    permissionReturnActual = epilogueAuth.convertPermissions(0o167777);
    permissionReturnExpected = [true, true, true, true, false, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true];
    assert.deepEqual(permissionReturnActual, permissionReturnExpected);
    done();
  });
  it('some should be true (binary)', done => {
    permissionReturnActual = epilogueAuth.convertPermissions(0b1110111111111111);
    permissionReturnExpected = [true, true, true, true, false, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true];
    assert.deepEqual(permissionReturnActual, permissionReturnExpected);
    done();
  });

  it('some should be true (hex string)', done => {
    permissionReturnActual = epilogueAuth.convertPermissions('0xEFFF');
    permissionReturnExpected = [true, true, true, true, false, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true];
    assert.deepEqual(permissionReturnActual, permissionReturnExpected);
    done();
  });
  it('some should be true (decimal string)', done => {
    permissionReturnActual = epilogueAuth.convertPermissions('61439');
    permissionReturnExpected = [true, true, true, true, false, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true];
    assert.deepEqual(permissionReturnActual, permissionReturnExpected);
    done();
  });
  it('some should be true (octal string)', done => {
    permissionReturnActual = epilogueAuth.convertPermissions('0o167777');
    permissionReturnExpected = [true, true, true, true, false, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true];
    assert.deepEqual(permissionReturnActual, permissionReturnExpected);
    done();
  });
  it('some should be true (binary string)', done => {
    permissionReturnActual = epilogueAuth.convertPermissions('0b1110111111111111');
    permissionReturnExpected = [true, true, true, true, false, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true];
    assert.deepEqual(permissionReturnActual, permissionReturnExpected);
    done();
  });

  it('some should be true (hex string with comment)', done => {
    permissionReturnActual = epilogueAuth.convertPermissions('hex 0xEFFF');
    permissionReturnExpected = [true, true, true, true, false, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true];
    assert.deepEqual(permissionReturnActual, permissionReturnExpected);
    done();
  });
  it('all should be false (decimal string with comment)', done => {
    permissionReturnActual = epilogueAuth.convertPermissions(' decimal 61439');
    permissionReturnExpected = [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false];
    assert.deepEqual(permissionReturnActual, permissionReturnExpected);
    done();
  });
  it('some should be true (octal string with comment)', done => {
    permissionReturnActual = epilogueAuth.convertPermissions('octal 0o167777');
    permissionReturnExpected = [true, true, true, true, false, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true];
    assert.deepEqual(permissionReturnActual, permissionReturnExpected);
    done();
  });
  it('some should be true (binary string with comment)', done => {
    permissionReturnActual = epilogueAuth.convertPermissions('binary 0b1110111111111111');
    permissionReturnExpected = [true, true, true, true, false, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true];
    assert.deepEqual(permissionReturnActual, permissionReturnExpected);
    done();
  });

  it('some should be true with a read and list being false (hex)', done => {
    permissionReturnActual = epilogueAuth.convertPermissions(0xBFFF);
    permissionReturnExpected = [false, true, false, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true];
    assert.deepEqual(permissionReturnActual, permissionReturnExpected);
    done();
  });
});

describe('Permissions conversions for arrays', () => {
  it('should add false elements to the end if elements are missing', done => {
    permissionReturnActual = epilogueAuth.convertPermissions([true, false, true, true, true]);
    permissionReturnExpected = [true, false, true, true, true, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false];
    assert.deepEqual(permissionReturnActual, permissionReturnExpected);
    done();
  });
});

describe('Permissions conversions for strings', () => {
  it('all permissions (pipe missing format)', done => {
    permissionReturnActual = epilogueAuth.convertPermissions('lcrudlcrudlcrudlcrud');
    permissionReturnExpected = [true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true];
    assert.deepEqual(permissionReturnActual, permissionReturnExpected);
    done();
  });
  it('some permissions (pipe missing format)', done => {
    permissionReturnActual = epilogueAuth.convertPermissions('crudlcudlcrudlcrud');
    permissionReturnExpected = [false, true, true, true, true, true, true, false, true, true, true, true, true, true, true, true, true, true, true, true];
    assert.deepEqual(permissionReturnActual, permissionReturnExpected);
    done();
  });
  it('some permissions (pipe missing format, dstr as d)', done => {
    permissionReturnActual = epilogueAuth.convertPermissions('crudstrlcudlcrudlcrudstr');
    permissionReturnExpected = [false, true, true, true, true, true, true, false, true, true, true, true, true, true, true, true, true, true, true, true];
    assert.deepEqual(permissionReturnActual, permissionReturnExpected);
    done();
  });
  it('some permissions (pipe missing format, upd as u)', done => {
    permissionReturnActual = epilogueAuth.convertPermissions('crupddlcudlcrupddlcrud');
    permissionReturnExpected = [false, true, true, true, true, true, true, false, true, true, true, true, true, true, true, true, true, true, true, true];
    assert.deepEqual(permissionReturnActual, permissionReturnExpected);
    done();
  });
  it('some permissions (pipe missing format, ls as l)', done => {
    permissionReturnActual = epilogueAuth.convertPermissions('crudlscudlcrudlscrud');
    permissionReturnExpected = [false, true, true, true, true, true, true, false, true, true, true, true, true, true, true, true, true, true, true, true];
    assert.deepEqual(permissionReturnActual, permissionReturnExpected);
    done();
  });
  it('some permissions (pipe missing format, * as lcrud)', done => {
    permissionReturnActual = epilogueAuth.convertPermissions('crudlcud*lcrud');
    permissionReturnExpected = [false, true, true, true, true, true, true, false, true, true, true, true, true, true, true, true, true, true, true, true];
    assert.deepEqual(permissionReturnActual, permissionReturnExpected);
    done();
  });
  it('some permissions with meaningless characters (pipe missing format)', done => {
    permissionReturnActual = epilogueAuth.convertPermissions('crvvvvvudlcutttdlcwrqqqwqudlcrud');
    permissionReturnExpected = [false, true, true, true, true, true, true, false, true, true, true, true, true, true, true, true, true, true, true, true];
    assert.deepEqual(permissionReturnActual, permissionReturnExpected);
    done();
  });
  it('all permissions (pipe format)', done => {
    permissionReturnActual = epilogueAuth.convertPermissions('lcrud|lcrud|lcrud|lcrud');
    permissionReturnExpected = [true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true];
    assert.deepEqual(permissionReturnActual, permissionReturnExpected);
    done();
  });
  it('all permissions with a missing pipe (pipe format)', done => {
    permissionReturnActual = epilogueAuth.convertPermissions('lcrudlcrud|lcrud|lcrud');
    permissionReturnExpected = [true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true];
    assert.deepEqual(permissionReturnActual, permissionReturnExpected);
    done();
  });
  it('all permissions with meaningless characters (pipe format)', done => {
    permissionReturnActual = epilogueAuth.convertPermissions('lcrwwud|lcrvwvud|lcrud|lcrqud');
    permissionReturnExpected = [true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true];
    assert.deepEqual(permissionReturnActual, permissionReturnExpected);
    done();
  });
  it('all permissions with an extra pipe (pipe format)', done => {
    permissionReturnActual = epilogueAuth.convertPermissions('lcrud|lcrud|lcrud|lcrud|');
    permissionReturnExpected = [true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true];
    assert.deepEqual(permissionReturnActual, permissionReturnExpected);
    done();
  });
  it('all permissions with extra pipes (pipe format)', done => {
    permissionReturnActual = epilogueAuth.convertPermissions('lcrud|lcrud|lcrud|lcrud|||||');
    permissionReturnExpected = [true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true];
    assert.deepEqual(permissionReturnActual, permissionReturnExpected);
    done();
  });
  it('some permissions (pipe format)', done => {
    permissionReturnActual = epilogueAuth.convertPermissions('lrud|lcrd|lcrud|lcrud');
    permissionReturnExpected = [true, false, true, true, true, true, true, true, false, true, true, true, true, true, true, true, true, true, true, true];
    assert.deepEqual(permissionReturnActual, permissionReturnExpected);
    done();
  });
  it('some permissions with missing pipes (pipe format)', done => {
    permissionReturnActual = epilogueAuth.convertPermissions('lrud|lcrdlcrudlcrud');
    permissionReturnExpected = [true, false, true, true, true, true, true, true, false, true, true, true, true, true, true, true, true, true, true, true];
    assert.deepEqual(permissionReturnActual, permissionReturnExpected);
    done();
  });
  it('no owner permissions (pipe format)', done => {
    permissionReturnActual = epilogueAuth.convertPermissions('|lcrud|lcrud|lcrud');
    permissionReturnExpected = [false, false, false, false, false, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true];
    assert.deepEqual(permissionReturnActual, permissionReturnExpected);
    done();
  });
  it('no noAccount permissions (pipe format)', done => {
    permissionReturnActual = epilogueAuth.convertPermissions('lcrud|lcrud|lcrud|');
    permissionReturnExpected = [true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, false, false, false, false, false];
    assert.deepEqual(permissionReturnActual, permissionReturnExpected);
    done();
  });
  it('no loggedIn permissions (pipe format)', done => {
    permissionReturnActual = epilogueAuth.convertPermissions('lcrud|lcrud||lcrud');
    permissionReturnExpected = [true, true, true, true, true, true, true, true, true, true, false, false, false, false, false, true, true, true, true, true];
    assert.deepEqual(permissionReturnActual, permissionReturnExpected);
    done();
  });
  it('no group or loggedIn permissions (pipe format)', done => {
    permissionReturnActual = epilogueAuth.convertPermissions('lcrud|||lcrud');
    permissionReturnExpected = [true, true, true, true, true, false, false, false, false, false, false, false, false, false, false, true, true, true, true, true];
    assert.deepEqual(permissionReturnActual, permissionReturnExpected);
    done();
  });
  it('no group or loggedIn permissions (pipe and n/a format)', done => {
    permissionReturnActual = epilogueAuth.convertPermissions('lcrud|n/a|lcrud');
    permissionReturnExpected = [true, true, true, true, true, false, false, false, false, false, false, false, false, false, false, true, true, true, true, true];
    assert.deepEqual(permissionReturnActual, permissionReturnExpected);
    done();
  });
  it('no group or loggedIn permissions (pipe and x format)', done => {
    permissionReturnActual = epilogueAuth.convertPermissions('lcrud|x|lcrud');
    permissionReturnExpected = [true, true, true, true, true, false, false, false, false, false, false, false, false, false, false, true, true, true, true, true];
    assert.deepEqual(permissionReturnActual, permissionReturnExpected);
    done();
  });
  it('no group or loggedIn permissions (x format)', done => {
    permissionReturnActual = epilogueAuth.convertPermissions('lcrudxxxlcrud');
    permissionReturnExpected = [true, true, true, true, true, false, false, false, false, false, false, false, false, false, false, true, true, true, true, true];
    assert.deepEqual(permissionReturnActual, permissionReturnExpected);
    done();
  });
  it('no group or loggedIn permissions (x and na format)', done => {
    permissionReturnActual = epilogueAuth.convertPermissions('lcrudnaxxlcrud');
    permissionReturnExpected = [true, true, true, true, true, false, false, false, false, false, false, false, false, false, false, true, true, true, true, true];
    assert.deepEqual(permissionReturnActual, permissionReturnExpected);
    done();
  });
});

describe('Permissions conversions for objects', () => {
  it('full action name', done => {
    permissionReturnActual = epilogueAuth.convertPermissions({owner: ['list', 'create', 'read']});
    permissionReturnExpected = [true, true, true, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false];
    assert.deepEqual(permissionReturnActual, permissionReturnExpected);
    done();
  });
  it('full action name, random case', done => {
    permissionReturnActual = epilogueAuth.convertPermissions({owner: ['lIst', 'crEAte', 'reAd']});
    permissionReturnExpected = [true, true, true, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false];
    assert.deepEqual(permissionReturnActual, permissionReturnExpected);
    done();
  });
  it('partial action name', done => {
    permissionReturnActual = epilogueAuth.convertPermissions({owner: ['l', 'c', 'r']});
    permissionReturnExpected = [true, true, true, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false];
    assert.deepEqual(permissionReturnActual, permissionReturnExpected);
    done();
  });
  it('partial action name, random case', done => {
    permissionReturnActual = epilogueAuth.convertPermissions({owner: ['l', 'C', 'R']});
    permissionReturnExpected = [true, true, true, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false];
    assert.deepEqual(permissionReturnActual, permissionReturnExpected);
    done();
  });
  it('partial action name, random case for both user type and actions', done => {
    permissionReturnActual = epilogueAuth.convertPermissions({oWnEr: ['l', 'C', 'R']});
    permissionReturnExpected = [true, true, true, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false];
    assert.deepEqual(permissionReturnActual, permissionReturnExpected);
    done();
  });
  it('partial action name, many user types', done => {
    permissionReturnActual = epilogueAuth.convertPermissions({owner: ['l', 'c', 'r'], anyuser: ['d']});
    permissionReturnExpected = [true, true, true, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, true];
    assert.deepEqual(permissionReturnActual, permissionReturnExpected);
    done();
  });
  it('partial and complete action name, many user types', done => {
    permissionReturnActual = epilogueAuth.convertPermissions({owner: ['l', 'create', 'r'], anyuser: ['d']});
    permissionReturnExpected = [true, true, true, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, true];
    assert.deepEqual(permissionReturnActual, permissionReturnExpected);
    done();
  });
  it('complete action name, many user types, blank array', done => {
    permissionReturnActual = epilogueAuth.convertPermissions({owner: [], anyuser: ['d']});
    permissionReturnExpected = [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, true];
    assert.deepEqual(permissionReturnActual, permissionReturnExpected);
    done();
  });
  it('blank array', done => {
    permissionReturnActual = epilogueAuth.convertPermissions({owner: []});
    permissionReturnExpected = [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false];
    assert.deepEqual(permissionReturnActual, permissionReturnExpected);
    done();
  });
  it('invalid action', done => {
    permissionReturnActual = epilogueAuth.convertPermissions({owner: ['test']});
    permissionReturnExpected = [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false];
    assert.deepEqual(permissionReturnActual, permissionReturnExpected);
    done();
  });
  it('invalid action and valid action', done => {
    permissionReturnActual = epilogueAuth.convertPermissions({owner: ['test', 'list']});
    permissionReturnExpected = [true, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false];
    assert.deepEqual(permissionReturnActual, permissionReturnExpected);
    done();
  });
  it('actions out of order', done => {
    permissionReturnActual = epilogueAuth.convertPermissions({owner: ['r', 'l']});
    permissionReturnExpected = [true, false, true, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false];
    assert.deepEqual(permissionReturnActual, permissionReturnExpected);
    done();
  });
  it('boolean array', done => {
    permissionReturnActual = epilogueAuth.convertPermissions({owner: [true, true, false, true, false]});
    permissionReturnExpected = [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false];
    assert.deepEqual(permissionReturnActual, permissionReturnExpected);
    done();
  });
});