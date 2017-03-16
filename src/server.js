import winston from 'winston';
import childProcess from 'child_process';
import http from 'http';
import https from 'https';
import fs from 'fs-extra';
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
  createServerObject(app) {
    let serverType = {};
    if (config.protocol.toLowerCase() === 'https') {
      const options = {
        key: fs.readFileSync(config.httpsKey, 'utf8'),
        cert: fs.readFileSync(config.httpsCert, 'utf8'),
      };
      if (config.environment !== 'production' && config.allowBadCertForDev.toUpperCase() === 'YES') {
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
   * @description Starts the server program. Runs http tests depending on testConfig.json configuration
   */
  serve(database, server, resources, groupXrefModel) {
    let force = false;
    if (config.force.toUpperCase() === 'YES') {
      force = true;
    }
    database
      .sync({ force })
      .then(() => {
        server.listen(config.port, () => {
          // const host = server.address().address,
          const port = server.address().port;
          if (config.environment === 'testing' || config.environment === 'staging') {
            winston.loggers.add('testsLog', {
              file: {
                filename: 'logs/tests.log',
                tailable: true,
                maxsize: 50000,
                maxFiles: 5,
                zippedArchive: true,
              },
            });

            winston.loggers.add('latestTestsLog', {
              file: {
                filename: 'logs/latestTests.log',
              },
            });

            if (testConfig.testsCasesHaveBeenGenerated !== true) {
              testCases.generateTestCases().then((generateTestCasesMessage) => {
                winston.info('generateTestCasesMessage', generateTestCasesMessage);
              });
            }

            testData.basicTestData(resources, groupXrefModel).then((val) => {
              if (val === true) {
                let runTests;
                if (testConfig.individualHttpTest === true && config.tests && config.tests.httpTests.toUpperCase() === 'YES') {
                  if (testConfig.testCases[testConfig.testNumber - 1].aaOrAccess === 'aa') {
                    runTests = childProcess.spawn('gulp', ['server-http-just-aa-test']);
                  } else if (testConfig.testCases[testConfig.testNumber - 1].aaOrAccess === 'access') {
                    runTests = childProcess.spawn('gulp', ['server-http-just-access-test']);
                  }
                } else {
                  runTests = childProcess.spawn('gulp', ['server-test']);
                }

                runTests.stdout.on('data', (data) => {
                  const testsLog = winston.loggers.get('testsLog');
                  testsLog.info(data.toString('utf8'));
                  const latestTestsLog = winston.loggers.get('latestTestsLog');
                  latestTestsLog.info(data.toString('utf8'));
                });

                runTests.stderr.on('data', (data) => {
                  winston.info(`stderr: \n ${data}`);
                });

                runTests.on('close', (code) => {
                  if (config.tests && config.tests.exitOnFinishingTests.toUpperCase() === 'YES') {
                    winston.info(`child process exited with code ${code}`);
                    process.exit();
                  } else {
                    winston.info('tests done and server is still running');
                  }
                });
              }
            });
          }
          winston.info(`listening on port: ${port}`);
        });
      });
  },
};
