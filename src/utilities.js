let srcOrBuild;
if (process.env.NODE_ENV === 'staging' || process.env.NODE_ENV === 'production') {
  srcOrBuild = 'build';
} else {
  srcOrBuild = 'src';
}

// eslint-disable-next-line
const config = require(`../${srcOrBuild}/config`);

const fs = require('fs-extra');
const winston = require('winston');
const MainError = require('./custom/errors/');

module.exports = {
  /** @function
   * @name createRequestOptions
   * @param {object} query
   * @return {object}
   */
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
  /** @function
   * @name yesTrueNoFalse
   * @param {*} yesOrNo
   * @return {boolean}
   * @description Should yesOrNo should be a string
   */
  yesTrueNoFalse(yesOrNo) {
    if (yesOrNo && typeof yesOrNo === 'string' && yesOrNo.toUpperCase() === 'YES') {
      return true;
    } else if (yesOrNo && typeof yesOrNo === 'string' && yesOrNo.toUpperCase() === 'NO') {
      return false;
    } else if (typeof yesOrNo === 'boolean') {
      return yesOrNo;
    } else {
      winston.info('yesTrueNoFalse received invalid input');
      return false;
    }
  },
  /** @function
   * @name winstonWrapper
   * @param {*} message
   * @param {string} level
   * @param {boolean} returns
   * @return {boolean}
   * @description Winston wrapper function that returns a boolean for convenience
   */
  winstonWrapper(message, level, returns = false) {
    let levelToUse = level.toLowerCase();
    if (['debug', 'info', 'notice', 'warning', 'error', 'crit', 'alert', 'emerg'].indexOf(levelToUse) < 0) {
      levelToUse = 'info';
    }
    if (winston[levelToUse]) {
      winston[levelToUse](message);
    } else {
      console.log(`${message} [not using winston]`);
    }
    return returns;
  },
  /** @function
   * @name setUpWinstonLogger
   * @param {string} filename
   * @param {boolean} tailableInput
   * @param {number} maxsizeInput
   * @param {number} maxFilesInput
   * @param {boolean} zippedArchiveInput
   * @return {object}
   */
  setUpWinstonLogger(filename, tailableInput, maxsizeInput, maxFilesInput, zippedArchiveInput) {
    let tailable = tailableInput;
    if (tailableInput === undefined) {
      tailable = this.yesTrueNoFalse(config.winston.tailable);
    }
    let maxsize = maxsizeInput;
    if (maxsizeInput === undefined) {
      maxsize = config.winston.maxsize;
    }
    let maxFiles = maxFilesInput;
    if (maxFilesInput === undefined) {
      maxFiles = config.winston.maxFiles;
    }
    let zippedArchive = zippedArchiveInput;
    if (zippedArchiveInput === undefined) {
      zippedArchive = this.yesTrueNoFalse(config.winston.zippedArchive);
    }
    return {
      filename,
      tailable,
      maxsize,
      maxFiles,
      zippedArchive,
    };
  },
  /** @function
   * @name throwErrorConditionally
   * @param {*} truthyOrFalsy
   * @param {string} message
   * @param {string} severity
   * @param {number} status
   */
  throwErrorConditionally(truthyOrFalsy, message, severity = 'Error', status = 500) {
    if (!truthyOrFalsy) {
      throw new MainError(message, severity, status);
    }
  },
};
