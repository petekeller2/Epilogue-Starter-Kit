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

describe('(Get Resource Names) There should be no auto associations for', () => {
  it('an empty string', done => {
    aaReturnActual = epilogueSetup.convertAutoAssociations('', true);
    aaReturnExpected = [];
    assert.deepEqual(aaReturnActual, aaReturnExpected);
    done();
  });
  it('a false boolean', done => {
    aaReturnActual = epilogueSetup.convertAutoAssociations(false, true);
    aaReturnExpected = [];
    assert.deepEqual(aaReturnActual, aaReturnExpected);
    done();
  });
  it('a true boolean', done => {
    aaReturnActual = epilogueSetup.convertAutoAssociations(true, true);
    aaReturnExpected = [];
    assert.deepEqual(aaReturnActual, aaReturnExpected);
    done();
  });
});

describe('(Get Resource Names) Auto associations string input', () => {
  it('hello', done => {
    aaReturnActual = epilogueSetup.convertAutoAssociations('hello', true);
    aaReturnExpected = ['hello'];
    assert.deepEqual(aaReturnActual, aaReturnExpected);
    done();
  });
  it('one, two (comma)', done => {
    aaReturnActual = epilogueSetup.convertAutoAssociations('one,two', true);
    aaReturnExpected = ['one', 'two'];
    assert.deepEqual(aaReturnActual, aaReturnExpected);
    done();
  });
  it('one, two (pipe)', done => {
    aaReturnActual = epilogueSetup.convertAutoAssociations('one|two', true);
    aaReturnExpected = ['one', 'two'];
    assert.deepEqual(aaReturnActual, aaReturnExpected);
    done();
  });
  it('one, two, three (pipe and comma)', done => {
    aaReturnActual = epilogueSetup.convertAutoAssociations('one|two,three', true);
    aaReturnExpected = ['one', 'two', 'three'];
    assert.deepEqual(aaReturnActual, aaReturnExpected);
    done();
  });
  it('one, two (space)', done => {
    aaReturnActual = epilogueSetup.convertAutoAssociations('one two', true);
    aaReturnExpected = ['one', 'two'];
    assert.deepEqual(aaReturnActual, aaReturnExpected);
    done();
  });
  it('one, two (spaces)', done => {
    aaReturnActual = epilogueSetup.convertAutoAssociations('one   two', true);
    aaReturnExpected = ['one', 'two'];
    assert.deepEqual(aaReturnActual, aaReturnExpected);
    done();
  });
  it('one, two (space and comma)', done => {
    aaReturnActual = epilogueSetup.convertAutoAssociations('one, two', true);
    aaReturnExpected = ['one', 'two'];
    assert.deepEqual(aaReturnActual, aaReturnExpected);
    done();
  });
  it('one, two (many spaces and comma)', done => {
    aaReturnActual = epilogueSetup.convertAutoAssociations('one,    two', true);
    aaReturnExpected = ['one', 'two'];
    assert.deepEqual(aaReturnActual, aaReturnExpected);
    done();
  });
  it('one, two (many spaces, spaces in the beginning and comma)', done => {
    aaReturnActual = epilogueSetup.convertAutoAssociations('   one,    two', true);
    aaReturnExpected = ['one', 'two'];
    assert.deepEqual(aaReturnActual, aaReturnExpected);
    done();
  });
  it('one, two (many spaces, spaces in the end and comma)', done => {
    aaReturnActual = epilogueSetup.convertAutoAssociations('one,    two     ', true);
    aaReturnExpected = ['one', 'two'];
    assert.deepEqual(aaReturnActual, aaReturnExpected);
    done();
  });
});

describe('(Get Resource Names) Auto associations object input', () => {
  it('hasMany', done => {
    aaReturnActual = epilogueSetup.convertAutoAssociations({ hasMany: 'hello' }, true);
    aaReturnExpected = ['hello'];
    assert.deepEqual(aaReturnActual, aaReturnExpected);
    done();
  });
  it('belongsTo', done => {
    aaReturnActual = epilogueSetup.convertAutoAssociations({ belongsTo: 'hello' }, true);
    aaReturnExpected = ['hello'];
    assert.deepEqual(aaReturnActual, aaReturnExpected);
    done();
  });
});

describe('(Get Resource Names) Auto associations array input', () => {
  it('one, auto association not named', done => {
    aaReturnActual = epilogueSetup.convertAutoAssociations(['hello'], true);
    aaReturnExpected = ['hello'];
    assert.deepEqual(aaReturnActual, aaReturnExpected);
    done();
  });
  it('many, auto associations not named', done => {
    aaReturnActual = epilogueSetup.convertAutoAssociations(['one', 'two'], true);
    aaReturnExpected = ['one', 'two'];
    assert.deepEqual(aaReturnActual, aaReturnExpected);
    done();
  });
  it('one, auto association named', done => {
    aaReturnActual = epilogueSetup.convertAutoAssociations([{ belongsTo: 'hello' }], true);
    aaReturnExpected = ['hello'];
    assert.deepEqual(aaReturnActual, aaReturnExpected);
    done();
  });
  it('many, auto associations named', done => {
    aaReturnActual = epilogueSetup.convertAutoAssociations([{ belongsTo: 'one' }, { hasMany: 'two' }], true);
    aaReturnExpected = ['one', 'two'];
    assert.deepEqual(aaReturnActual, aaReturnExpected);
    done();
  });
  it('many, one auto association named, the other is not', done => {
    aaReturnActual = epilogueSetup.convertAutoAssociations([{ belongsTo: 'one' }, 'two'], true);
    aaReturnExpected = ['one', 'two'];
    assert.deepEqual(aaReturnActual, aaReturnExpected);
    done();
  });
});
