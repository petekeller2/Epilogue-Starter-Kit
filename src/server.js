// @flow
import winston from 'winston';
import childProcess from 'child_process';
import http from 'http';
import https from 'https';
import fs from 'fs-extra';
import utilities from './utilities';
import config from './config';
import testData from '../test/setup/testData';
import testCases from '../test/setup/testCases';
import testConfig from '../test/testConfig.json';

// app.js is the main app file
export default {
  /** @function
   * @name createServerObject
   * @param {object} app
   * @return {object}
   * @description Creates an http or https server object. Used in app.js
   */
  createServerObject(app: {}): {} {
    let serverType = {};
    if (config.protocol.toLowerCase() === 'https') {
      const options = {
        key: fs.readFileSync(config.httpsKey, 'utf8'),
        cert: fs.readFileSync(config.httpsCert, 'utf8'),
      };
      if (config.environment !== 'production' && utilities.yesTrueNoFalse(config.allowBadCertForDev)) {
        options.requestCert = false;
        options.rejectUnauthorized = false;
      }
      serverType = https.createServer(options, app);
    } else {
      serverType = http.createServer(app);
      if (config.protocol !== 'http') {
        winston.warning('No protocol giving in config.js, http will be used by default');
      }
    }
    return serverType;
  },
  /** @function
   * @name serve
   * @param {object} database
   * @param {object} server
   * @param {map} resources - created in epilogueSetup.js
   * @param {object} groupXrefModel - created in epilogueSetup.js
   * @return {object}
   * @description Starts the application. Runs http tests depending on the testConfig.json configuration. Used in app.js
   */
  serve(database: {}, server: {}, resources: Map, groupXrefModel: {}): {} {
    let force = false;
    if (utilities.yesTrueNoFalse(config.force)) {
      force = true;
    }
    database
      .sync({ force })
      .then(() => {
        server.listen(config.port, () => {
          const { port } = server.address();
          if (config.environment === 'testing' || config.environment === 'staging') {
            this.httpTests(resources, groupXrefModel);
          }
          winston.info(`listening on port: ${port}`);
        });
      }, error => winston.info(`Server Error: ${error}`));
  },
  /** @function
   * @name httpTests
   * @param {map} resources - created in epilogueSetup.js
   * @param {object} groupXrefModel - created in epilogueSetup.js
   * @description Runs http tests. Used by serve
   */
  httpTests(resources: Map, groupXrefModel: {}) {
    const winstonConfig = utilities.setUpWinstonLogger('logs/tests.log');
    winston.loggers.add('testsLog', {
      file: winstonConfig,
    });
    const testsLog = winston.loggers.get('testsLog');

    winston.loggers.add('testResultsLog', {
      file: {
        filename: 'logs/testResults.log',
      },
    });
    const testResultsLog = winston.loggers.get('testResultsLog');

    if (testConfig.testsCasesHaveBeenGenerated !== true) {
      testCases.generateTestCases().then((generateTestCasesMessage) => {
        winston.info('generateTestCasesMessage', generateTestCasesMessage);
      }, error => winston.info(`Test case generation error: ${error}`));
    }

    testData.basicTestData(resources, groupXrefModel).then((val) => {
      if (val === true) {
        let runTests;
        if (testConfig.individualHttpTest === true) {
          if (testConfig.testCases[testConfig.testNumber - 1].aaOrAccess === 'aa') {
            runTests = childProcess.spawn('gulp', ['server-http-just-aa-test']);
          } else if (testConfig.testCases[testConfig.testNumber - 1].aaOrAccess === 'access') {
            runTests = childProcess.spawn('gulp', ['server-http-just-access-test']);
          }
        } else {
          runTests = childProcess.spawn('gulp', ['unit-test']);
        }

        runTests.stdout.on('data', (data) => {
          testsLog.info(data.toString('utf8'));
          testResultsLog.info(data.toString('utf8'));
        });

        runTests.stderr.on('data', (data) => {
          winston.info(`stderr: \n ${data}`);
          testsLog.info(data.toString('utf8'));
          testResultsLog.info(data.toString('utf8'));
        });

        runTests.on('close', (code) => {
          if (config.tests && utilities.yesTrueNoFalse(config.tests.exitOnFinishingTests)) {
            winston.info(`child process exited with code ${code}`);
            process.exit();
          } else {
            winston.info('tests done and server is still running');
          }
        });
      }
    }, error => winston.info(`basic test data error: ${error}`));
  },
};
