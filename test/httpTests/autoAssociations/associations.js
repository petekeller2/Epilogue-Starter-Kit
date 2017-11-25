let srcOrBuild;
if (process.env.NODE_ENV === 'staging' || process.env.NODE_ENV === 'production') {
  srcOrBuild = 'build';
} else {
  srcOrBuild = 'src';
}
const config = require(`../../../${srcOrBuild}/config`);
const utilities = require(`../../../${srcOrBuild}/utilities`);

import assert from 'assert';
import request from 'request';
import testConfig from '../../testConfig.json';

if (config.environment === 'testing' || config.environment === 'staging') {
  describe('Should have association', () => {
    if (testConfig.testCases[testConfig.testNumber - 1].association.aa === 'hasMany') {
      console.log('hasMany');
      it('user should have todos (hasMany)', done => {
        let options = utilities.createRequestOptions(`users\/${testConfig.testCases[testConfig.testNumber - 1].userID}`);
        request.get(options, (error, res) => {
          console.log('res.body', res.body);
          let matches = res.body.match(/Todos/g);
          // console.log(matches);
          if (matches && matches.length > 0) {
            matches = true;
          } else {
            matches = false;
          }
          assert.equal(true, matches);
          done();
        });
      }).timeout(0);
    } else if (testConfig.testCases[testConfig.testNumber - 1].association.aa === 'belongsTo') {
      // todo
      it('user should have todos (belongsTo)', done => {

        done();
      }).timeout(0);
    }
  });
}