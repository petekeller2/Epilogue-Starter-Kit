let srcOrBuild;
if (process.env.NODE_ENV === 'staging' || process.env.NODE_ENV === 'production') {
  srcOrBuild = 'build';
} else {
  srcOrBuild = 'src';
}
const epilogueSetup = require(`../../../${srcOrBuild}/epilogueSetup`).default;
import assert from 'assert';

let aaReturnActual;
let aaReturnExpected;

describe('There should be no auto associations for', () => {
  it('an empty string', done => {
    aaReturnActual = epilogueSetup.convertAutoAssociations('');
    aaReturnExpected = [];
    assert.deepEqual(aaReturnActual, aaReturnExpected);
    done();
  });
  it('a false boolean', done => {
    aaReturnActual = epilogueSetup.convertAutoAssociations(false);
    aaReturnExpected = [];
    assert.deepEqual(aaReturnActual, aaReturnExpected);
    done();
  });
  it('a true boolean', done => {
    aaReturnActual = epilogueSetup.convertAutoAssociations(true);
    aaReturnExpected = [];
    assert.deepEqual(aaReturnActual, aaReturnExpected);
    done();
  });
});

describe('Auto associations string input', () => {
  it('hello', done => {
    aaReturnActual = epilogueSetup.convertAutoAssociations('hello');
    aaReturnExpected = [{ hasMany: 'hello' }];
    assert.deepEqual(aaReturnActual, aaReturnExpected);
    done();
  });
  it('one, two (comma)', done => {
    aaReturnActual = epilogueSetup.convertAutoAssociations('one,two');
    aaReturnExpected = [{ hasMany: 'one' }, { hasMany: 'two' }];
    assert.deepEqual(aaReturnActual, aaReturnExpected);
    done();
  });
  it('one, two (pipe)', done => {
    aaReturnActual = epilogueSetup.convertAutoAssociations('one|two');
    aaReturnExpected = [{ hasMany: 'one' }, { hasMany: 'two' }];
    assert.deepEqual(aaReturnActual, aaReturnExpected);
    done();
  });
  it('one, two, three (pipe and comma)', done => {
    aaReturnActual = epilogueSetup.convertAutoAssociations('one|two,three');
    aaReturnExpected = [{ hasMany: 'one' }, { hasMany: 'two' }, { hasMany: 'three' }];
    assert.deepEqual(aaReturnActual, aaReturnExpected);
    done();
  });
  it('one, two (space)', done => {
    aaReturnActual = epilogueSetup.convertAutoAssociations('one two');
    aaReturnExpected = [{ hasMany: 'one' }, { hasMany: 'two' }];
    assert.deepEqual(aaReturnActual, aaReturnExpected);
    done();
  });
  it('one, two (spaces)', done => {
    aaReturnActual = epilogueSetup.convertAutoAssociations('one   two');
    aaReturnExpected = [{ hasMany: 'one' }, { hasMany: 'two' }];
    assert.deepEqual(aaReturnActual, aaReturnExpected);
    done();
  });
  it('one, two (space and comma)', done => {
    aaReturnActual = epilogueSetup.convertAutoAssociations('one, two');
    aaReturnExpected = [{ hasMany: 'one' }, { hasMany: 'two' }];
    assert.deepEqual(aaReturnActual, aaReturnExpected);
    done();
  });
  it('one, two (many spaces and comma)', done => {
    aaReturnActual = epilogueSetup.convertAutoAssociations('one,    two');
    aaReturnExpected = [{ hasMany: 'one' }, { hasMany: 'two' }];
    assert.deepEqual(aaReturnActual, aaReturnExpected);
    done();
  });
  it('one, two (many spaces, spaces in the beginning and comma)', done => {
    aaReturnActual = epilogueSetup.convertAutoAssociations('   one,    two');
    aaReturnExpected = [{ hasMany: 'one' }, { hasMany: 'two' }];
    assert.deepEqual(aaReturnActual, aaReturnExpected);
    done();
  });
  it('one, two (many spaces, spaces in the end and comma)', done => {
    aaReturnActual = epilogueSetup.convertAutoAssociations('one,    two     ');
    aaReturnExpected = [{ hasMany: 'one' }, { hasMany: 'two' }];
    assert.deepEqual(aaReturnActual, aaReturnExpected);
    done();
  });
});

describe('Auto associations object input', () => {
  it('hasMany', done => {
    aaReturnActual = epilogueSetup.convertAutoAssociations({ hasMany: 'hello' });
    aaReturnExpected = [{ hasMany: 'hello' }];
    assert.deepEqual(aaReturnActual, aaReturnExpected);
    done();
  });
  it('belongsTo', done => {
    aaReturnActual = epilogueSetup.convertAutoAssociations({ belongsTo: 'hello' });
    aaReturnExpected = [{ belongsTo: 'hello' }];
    assert.deepEqual(aaReturnActual, aaReturnExpected);
    done();
  });
});

describe('Auto associations array input', () => {
  it('one, auto association not named', done => {
    aaReturnActual = epilogueSetup.convertAutoAssociations(['hello']);
    aaReturnExpected = [{ hasMany: 'hello' }];
    assert.deepEqual(aaReturnActual, aaReturnExpected);
    done();
  });
  it('many, auto associations not named', done => {
    aaReturnActual = epilogueSetup.convertAutoAssociations(['one', 'two']);
    aaReturnExpected = [{ hasMany: 'one' }, { hasMany: 'two' }];
    assert.deepEqual(aaReturnActual, aaReturnExpected);
    done();
  });
  it('one, auto association named', done => {
    aaReturnActual = epilogueSetup.convertAutoAssociations([{ belongsTo: 'hello' }]);
    aaReturnExpected = [{ belongsTo: 'hello' }];
    assert.deepEqual(aaReturnActual, aaReturnExpected);
    done();
  });
  it('many, auto associations named', done => {
    aaReturnActual = epilogueSetup.convertAutoAssociations([{ belongsTo: 'one' }, { hasMany: 'two' }]);
    aaReturnExpected = [{ belongsTo: 'one' }, { hasMany: 'two' }];
    assert.deepEqual(aaReturnActual, aaReturnExpected);
    done();
  });
  it('many, one auto association named, the other is not', done => {
    aaReturnActual = epilogueSetup.convertAutoAssociations([{ belongsTo: 'one' }, 'two']);
    aaReturnExpected = [{ belongsTo: 'one' }, { hasMany: 'two' }];
    assert.deepEqual(aaReturnActual, aaReturnExpected);
    done();
  });
});
