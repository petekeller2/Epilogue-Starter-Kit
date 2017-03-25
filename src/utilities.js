let srcOrBuild;
if (process.env.NODE_ENV === 'staging' || process.env.NODE_ENV === 'production') {
  srcOrBuild = 'build';
} else {
  srcOrBuild = 'src';
}
const config = require(`../${srcOrBuild}/config`);

const fs = require('fs-extra');
const winston = require('winston');

module.exports = {
  createRequestOptions(query) {
    const options = {
      url: `${config.protocol}://${config.host}:${config.port}/${query}`,
    };
    if (config.protocol === 'https') {
      options.cert = fs.readFileSync(config.httpsCert).toString('utf8');
      options.key = fs.readFileSync(config.httpsKey).toString('utf8');
    }
    if (this.yesTrueNoFalse(config.allowBadCertForDev) && !(process.env.NODE_ENV === 'production')) {
      options.rejectUnauthorized = false;
    }
    return options;
  },
  yesTrueNoFalse: function(yesOrNo) {
    if (yesOrNo && typeof yesOrNo === 'string' && yesOrNo.toUpperCase() === 'YES') {
      return true;
    } else if(yesOrNo && typeof yesOrNo === 'string' && yesOrNo.toUpperCase() === 'NO') {
      return false;
    } else if(typeof yesOrNo === 'boolean') {
      return yesOrNo;
    } else {
      winston.info('yesTrueNoFalse received invalid input');
      return false;
    }
  }
};