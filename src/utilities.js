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
const nodemailer = require('nodemailer');
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
   * @param {*} message - usually a string
   * @param {string} level
   * @param {*} returns - usually a boolean
   * @param {boolean} sendMailConditionally
   * @return {*} usually a boolean
   * @description Winston wrapper function. Returns a boolean for convenience
   */
  winstonWrapper(message, level = 'info', returns = false, sendMailConditionally = true) {
    let levelToUse = level.toLowerCase();
    if (['debug', 'info', 'notice', 'warning', 'error', 'crit', 'alert', 'emerg'].indexOf(levelToUse) < 0) {
      levelToUse = 'info';
    }
    if (winston[levelToUse]) {
      winston[levelToUse](message);
    } else {
      console.log(`${message} [not using winston]`);
    }
    if (sendMailConditionally && config.email.mailAtLevel.indexOf(levelToUse) >= 0) {
      this.sendMail(message);
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
    let { maxsize, maxFiles } = config.winston;
    if (maxsizeInput !== undefined) {
      maxsize = maxsizeInput;
    }
    if (maxFilesInput !== undefined) {
      maxFiles = maxFilesInput;
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
   * @param {*} truthyOrFalsy - Should be clearly meant to be truthy or falsy
   * @param {string} message
   * @param {(number|string)} severity -  example: 1 or alert
   * @param {number} status - 500, 400, ect
   */
  throwErrorConditionally(truthyOrFalsy, message, severity = 'Error', status = 500) {
    const levelToUse = severity.toLowerCase();
    if (!truthyOrFalsy) {
      if (config.email.mailAtLevel.indexOf(levelToUse) >= 0) {
        this.sendMail(message);
      }
      this.winstonWrapper(message, levelToUse, false, false);
      throw new MainError(message, levelToUse, status);
    }
  },
  /** @function
   * @name displayMessage
   * @param {string} messageName
   * @return {string}
   */
  displayMessage(messageName) {
    const errorMessage = 'Messages not found in config!';
    if (config && config.messages) {
      if (config.messages[messageName]) {
        return config.messages[messageName];
      } else if (config.messages.defaultMessage) {
        const { defaultMessage } = config.messages;
        return this.winstonWrapper(defaultMessage, 'notice', defaultMessage);
      } else {
        return this.winstonWrapper(errorMessage, 'warning', errorMessage);
      }
    } else {
      return this.winstonWrapper(errorMessage, 'warning', errorMessage);
    }
  },
  /** @function
   * @name mailConfig
   * @param {string} service
   * @param {string} user
   * @param {string} pass
   * @return {object}
   */
  mailConfig(service, user, pass) {
    return nodemailer.createTransport({
      service: service || config.email.service,
      auth: {
        user: user || config.email.user,
        pass: pass || config.email.pass,
      },
    });
  },
  /** @function
   * @name sendMail
   * @param {string} text
   * @param {string} subject
   * @param {string} from
   * @param {string} to
   * @param {string} service
   * @param {string} user
   * @param {string} pass
   * @return {boolean}
   */
  sendMail(text, subject, from, to, service, user, pass) {
    const transporter = this.mailConfig(service, user, pass);

    const mailOptions = {
      from: from || config.email.defaultFrom,
      to: to || config.email.defaultTo,
      subject: subject || config.email.defaultSubject,
      text: text || config.email.defaultText,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        return this.winstonWrapper(error, 'error', false, false);
      }
      this.winstonWrapper(info, 'info');
      return true;
    });
  },
};
