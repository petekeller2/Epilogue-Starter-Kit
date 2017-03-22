let srcOrBuild;
if (process.env.NODE_ENV === 'staging' || process.env.NODE_ENV === 'production') {
  srcOrBuild = 'build';
} else {
  srcOrBuild = 'src';
}
const config = require(`../../../${srcOrBuild}/config`);

import assert from 'assert';
import request from 'request';
import utilities from '../../../src/utilities';
import testConfig from '../../testConfig.json';

if (config.environment === 'testing' || config.environment === 'staging') {
  describe('Should have association', () => {
    if (testConfig.testCases[testConfig.testNumber - 1].association.aa === 'hasMany') {
      console.log('hasMany');
      it('user should have todos (hasMany)', done => {
        let options = utilities.createRequestOptions('users');
        options.json = {id: '123', username: 'mac', emailAddress: 'mac@gmail.com'};
        request.post(
          options,
          (error, response, body) => {
            // console.log(response);
            options = utilities.createRequestOptions('todos');
            options.json = {id: '1', task: 'Fix car', dueDate: '12/18/17', UserId: '123'};
            request.post(
              options,
              (error, response, body) => {
                // console.log(response);
                options = utilities.createRequestOptions('users');
                request.get(options, (error, res) => {
                  // console.log('res', res.body);
                  let matches = res.body.match(/Todos/g);
                  // console.log(matches);
                  if (matches.length > 0) {
                    matches = true;
                  } else {
                    matches = false;
                  }
                  assert.equal(true, matches);
                  done();
                });
              }
            );
          }
        );
      }).timeout(0);
    } else if (testConfig.testCases[testConfig.testNumber - 1].association.aa === 'belongsTo') {
      // todo
      it('user should have todos (belongsTo)', done => {

        done();
      });
    }
    it('TODO', done => {

      done();
    });
    // todo
  });
}