let srcOrBuild;
if (process.env.NODE_ENV === 'staging' || process.env.NODE_ENV === 'production') {
  srcOrBuild = 'build';
} else {
  srcOrBuild = 'src';
}
const config = require(`../../${srcOrBuild}/config`).default;

import http from 'http';
import assert from 'assert';

describe('Node Server Test', () => {
  it('should return 200', done => {
    http.get(`${config.protocol}://${config.host}:${config.port}/getUserDataTest`, res => {
      assert.equal(200, res.statusCode);
      done();
    });
  });
});