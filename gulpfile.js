const gulp = require('gulp');
const shell = require('gulp-shell');
const fs = require('fs-extra');
const winston = require('winston');
const readline = require('readline');
const spawn = require('child_process').spawn;
const pluralize = require('pluralize');
const config = require('./src/config');
const utilities = require('./src/utilities');

let winstonConfig = utilities.setUpWinstonLogger('logs/gulpErrors.log');

winston.loggers.add('gulpError', {
  file: winstonConfig,
});
const gulpErrors = winston.loggers.get('gulpError');

winstonConfig = utilities.setUpWinstonLogger('logs/latestTests.log');

winston.loggers.add('latestTests', {
  file: winstonConfig,
});
const latestTests = winston.loggers.get('latestTests');

gulp.task('env-dev', function () {
  return process.env.NODE_ENV = 'development';
});

gulp.task('env-test', function () {
  return process.env.NODE_ENV = 'testing';
});

gulp.task('env-staging', function () {
  return process.env.NODE_ENV = 'staging';
});

gulp.task('env-prod', function () {
  return process.env.NODE_ENV = 'production';
});

gulp.task('env-force', function () {
  return process.env.FORCE = 'YES';
});

gulp.task('build', shell.task('npm run build'));

gulp.task('server-serve', shell.task('npm run serve'));

gulp.task('server-start-no-nodemon', shell.task('npm run start-no-nodemon'));

gulp.task('server-http-test', shell.task('npm run http-test'));

gulp.task('server-http-just-aa-test', shell.task('npm run http-just-aa-test'));

gulp.task('server-http-just-access-test', shell.task('npm run http-just-access-test'));

gulp.task('unit-test', shell.task('npm run unit-test'));

gulp.task('test-autoAssociations', shell.task('npm run test-autoAssociations'));

gulp.task('test-permissions', shell.task('npm run test-permissions'));

gulp.task('test-groups', shell.task('npm run test-groups'));

gulp.task('test-failing', shell.task('npm run test-failing'));

gulp.task('generate-changelog', shell.task('github_changelog_generator'));

gulp.task('build-dup-report', shell.task('jscpd'));

gulp.task('serve', ['build', 'server-serve']);

gulp.task('travis-test', ['test-permissions', 'test-autoAssociations']);

gulp.task('server-test-all-ignore-config', ['server-http-test', 'unit-test']);

gulp.task('pre-commit-build', ['build-dup-report', 'generate-changelog']);

gulp.task('build-all', ['build', 'pre-commit-build']);

// main test task for not built code
gulp.task('test-server', ['env-force', 'env-test', 'server-start-no-nodemon'], function () {
  startOfTests('test');
});

gulp.task('repeat-test-server', ['env-force', 'env-test', 'server-start-no-nodemon'], function () {
  runHttpTestsOrEnd('test');
});

// main test task for built code
gulp.task('test-staging-server', ['env-force', 'env-staging', 'serve'], function () {
  startOfTests('staging');
});

gulp.task('repeat-test-staging-server', ['env-force', 'env-staging', 'serve'], function () {
  runHttpTestsOrEnd('staging');
});

gulp.task('reset-test-config', function () {
  fs.readFile('./test/testConfig.json', 'utf8', (testConfigErr, testConfigData) => {
    const testConfig = JSON.parse(testConfigData);
    resetTestConfig(testConfig);
  });
});

gulp.task('retire', function () {
  // Spawn Retire.js as a child process
  // You can optionally add option parameters to the second argument (array)
  const child = spawn('retire', [], { cwd: process.cwd() });

  child.stdout.setEncoding('utf8');
  child.stdout.on('data', function (data) {
    winston.info(data);
  });

  child.stderr.setEncoding('utf8');
  child.stderr.on('data', function (data) {
    gulpErrors.error(data);
  });
});

gulp.task('new-resource', function () {
  rlInput('', buildResourceFolder, false);
});

gulp.task('start', function() {
  preStart(['start']);
});

gulp.task('start-no-nodemon', function() {
  preStart(['run', 'start-no-nodemon']);
});

/** @function
 * @name preStart
 * @param {Array} npmScript
 */
const preStart = function (npmScript) {
  mainConfigTest().then(function (result) {
    if (result.length === 0) {
      const child = spawn('npm', npmScript, {cwd: process.cwd()});

      child.stdout.setEncoding('utf8');
      child.stdout.on('data', function (data) {
        console.log(data);
      });

      child.stderr.setEncoding('utf8');
      child.stderr.on('data', function (data) {
        gulpErrors.error(data);
      });
    }
  });
};

/** @function
 * @name addToIgnoreList
 * @param {Array} activeList
 * @return {Array}
 * @description Helper program for mainConfigTest. Returns list of config variables to ignore
 */
const addToIgnoreList = function (activeList) {
  const ignore = [];
  activeList.forEach(function (activeCheck) {
    const actualCheckVariable = config[activeCheck.activeVariable];
    if (activeCheck.activeType.toLowerCase() === 'string') {
      if ((activeCheck.activeEquals === true) && (activeCheck.activeValue !== actualCheckVariable)) {
        ignore.push.apply(ignore, activeCheck.configVariables);
      } else if ((activeCheck.activeEquals === false) && (activeCheck.activeValue === actualCheckVariable)) {
        ignore.push.apply(ignore, activeCheck.configVariables);
      }
    } else if (activeCheck.activeType.toLowerCase() === 'array') {
      if (activeCheck.activeEquals === true) {
        if ((actualCheckVariable.length === 0) || (actualCheckVariable.indexOf(activeCheck.activeValue) < 0)) {
          ignore.push.apply(ignore, activeCheck.configVariables);
        }
      } else if ((activeCheck.activeEquals === false) && (actualCheckVariable.indexOf(activeCheck.activeValue) >= 0)) {
        ignore.push.apply(ignore, activeCheck.configVariables);
      }
    }
  });
  return ignore;
};

/** @function
 * @name configTestMessage
 * @param {object} configVariables
 * @param {Array} ignore
 * @return {string}
 * @description Helper program for mainConfigTest. Returns error message
 */
const configTestMessage = function (configVariables, ignore) {
  let returnMessage = '';
  configVariables.forEach(function (configVariableObj) {
    if (ignore.indexOf(configVariableObj.variable) === -1) {
      const variableSplit = configVariableObj.variable.split('.');
      let actualPlaceholderText = config;
      if (variableSplit.length > 0) {
        variableSplit.forEach(function(varEle) {
          actualPlaceholderText = actualPlaceholderText[varEle];
        });
      } else {
        actualPlaceholderText = actualPlaceholderText[configVariableObj.variable];
      }
      if (configVariableObj.placeholderText === actualPlaceholderText) {
        if (returnMessage.length === 0) {
          returnMessage += '\n';
        }
        if (configVariableObj.customMessage.length > 0) {
          returnMessage += configVariableObj.customMessage;
        } else {
          returnMessage += `${configVariableObj.variable} is still using the placeholder input!`;
        }
        returnMessage += '\n';
      }
    }
  });
  if (returnMessage.length > 0) {
    winston.error(returnMessage);
  }
  return returnMessage;
};

/** @function
 * @name mainConfigTest
 * @return {Promise}
 * @description Checks to see if default values were replaced for required config variables
 */
const mainConfigTest = function () {
  return new Promise(function (resolve) {
    fs.readFile('test/mainConfigTest.json', 'utf8', function (mainConfigTestErr, mainConfigTestData) {
      if (mainConfigTestErr) {
        winston.error(`Attempt to read mainConfigTest.js. ${mainConfigTestErr}`);
      }
      const mainConfigTestObj = JSON.parse(mainConfigTestData);

      resolve(configTestMessage(mainConfigTestObj.configVariables, addToIgnoreList(mainConfigTestObj.activeList)));
    });
  });
};

/** @function
 * @name partialRight
 * @param {function} fn
 * @return {function}
 * @description see: http://benalman.com/news/2012/09/partial-application-in-javascript/
 */
const partialRight = function (fn /*, args...*/) {
  // A reference to the Array#slice method.
  const slice = Array.prototype.slice;
  // Convert arguments object to an array, removing the first argument.
  const args = slice.call(arguments, 1);
  return function() {
  // Invoke the originally-specified function, passing in all just-
  // specified arguments, followed by any originally-specified arguments.
    return fn.apply(this, slice.call(arguments, 0).concat(args));
  };
};

/** @function
 * @name buildModelResourceFile
 * @param {string} userInput
 * @param {string} cleanedResourceName
 * @param {string} fieldNameOrTypeOrEnd
 */
const buildModelResourceFile = function (userInput, cleanedResourceName, fieldNameOrTypeOrEnd) {
  const modelFile = getCleanedResourcePath(cleanedResourceName, 'model.js');
  if (fieldNameOrTypeOrEnd.search(/Field Name/g) !== -1) {
    buildFieldName(userInput, cleanedResourceName, modelFile);
  } else if (fieldNameOrTypeOrEnd.search(/Field Type/g) !== -1) {
    buildFieldType(userInput, cleanedResourceName, modelFile);
  } else if (fieldNameOrTypeOrEnd.search(/Add Another Field/g) !== -1) {
    buildAnotherFieldOrEnd(userInput, cleanedResourceName, modelFile);
  } else {
    gulpErrors.info('Unhandled question in buildModelResourceFile function');
  }
};

/** @function
 * @name buildAnotherFieldOrEnd
 * @param {string} userInput
 * @param {string} resourceName
 * @param {string} modelFile
 */
const buildAnotherFieldOrEnd = function (userInput, resourceName, modelFile) {
  const yesAnswers = ['y', 'yes', 'surewhynot'];
  const noAnswers = ['n', 'no', 'q', 'quit'];
  const userInputLowerCase = userInput.toLowerCase().trim();
  if ((userInput.trim().length === 0) || ((yesAnswers.indexOf(userInputLowerCase) < 0) && (noAnswers.indexOf(userInputLowerCase) < 0))) {
    askNextQuestionModel(resourceName, 'Valid answer is required.\nAdd Another Field? (y/n): ', 'Valid answer is required.\nAdd Another Field? (y/n): ', false);
  } else if (noAnswers.indexOf(userInputLowerCase) !== -1) {
    fs.readFile(modelFile, 'utf8', function (err, data) {
      if (err) gulpErrors.info(err);
      const newLine = data.replace(/'<NEXT_NAME>': sequelize.NEXT_TYPE,/g, '');
      fs.writeFile(modelFile, newLine, 'utf8', function (err) {
        if (err) gulpErrors.info(err);
        rlInput('', function () {}, true);
      });
    });
  } else {
    fs.readFile(modelFile, 'utf8', function (err, data) {
      if (err) gulpErrors.info(err);
      const newLine = data.replace(/'<NEXT_NAME>': sequelize.NEXT_TYPE,/g, '\n      \'<field_name>\': sequelize.FIELD_TYPE,');
      fs.writeFile(modelFile, newLine, 'utf8', function (err) {
        if (err) gulpErrors.info(err);
        askNextQuestionModel(resourceName, 'Field Name: ', 'Field Name: ', false);
      });
    });
  }
};

/** @function
 * @name buildFieldType
 * @param {string} userInput
 * @param {string} resourceName
 * @param {string} modelFile
 */
const buildFieldType = function (userInput, resourceName, modelFile) {
  const validFieldTypes = ['STRING', 'CHAR', 'TEXT', 'INTEGER', 'BIGINT', 'FLOAT', 'REAL', 'DOUBLE', 'DECIMAL', 'BOOLEAN', 'TIME', 'DATE', 'DATEONLY', 'HSTORE', 'JSON', 'JSONB', 'NOW', 'BLOB', 'RANGE', 'UUID', 'UUIDV1', 'UUIDV4', 'VIRTUAL', 'ENUM', 'ARRAY', 'GEOMETRY', 'GEOGRAPHY'];
  const validFieldTypesString = validFieldTypes.join(', ');
  const userInputUpperCase = userInput.toUpperCase().trim();
  const userInputUpperCaseNoBrackets = userInputUpperCase.replace(/ *\([^)]*\) */g, '');
  if ((userInput.trim().length === 0) || (validFieldTypes.indexOf(userInputUpperCaseNoBrackets) < 0)) {
    askNextQuestionModel(resourceName, `Valid Field Type is required. (${validFieldTypesString})\nField Type: `, 'Field Type: ', false);
  } else {
    fs.readFile(modelFile, 'utf8', function (err, data) {
      if (err) gulpErrors.info(err);
      const fieldFilled = data.replace(/FIELD_TYPE/g, userInput);
      fs.writeFile(modelFile, fieldFilled, 'utf8', function (err) {
        if (err) gulpErrors.info(err);
        askNextQuestionModel(resourceName, 'Add Another Field? (y/n): ', 'Add Another Field? (y/n): ', false);
      });
    });
  }
};

/** @function
 * @name buildFieldName
 * @param {string} userInput
 * @param {string} resourceName
 * @param {string} modelFile
 */
const buildFieldName = function (userInput, resourceName, modelFile) {
  if (userInput.trim().length === 0) {
    askNextQuestionModel(resourceName, 'Field Name is required\nField Name: ', 'Field Type: ', false);
  } else {
    fs.readFile(modelFile, 'utf8', function (err, data) {
      if (err) gulpErrors.info(err);
      const fieldFilled = data.replace(/'<field_name>'/g, userInput);
      fs.writeFile(modelFile, fieldFilled, 'utf8', function (err) {
        if (err) gulpErrors.info(err);
        askNextQuestionModel(resourceName, 'Field Type: ', 'Field Type: ', false);
      });
    });
  }
};

/** @function
 * @name rlInput
 * @param {string} prompt
 * @param {function} callback
 * @param {boolean} end
 */
const rlInput = function (prompt, callback, end = false) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  if ((prompt === '') && (end === false)) {
    setTimeout(process.stdout.write.bind(process.stdout), 500, 'Resource Name: ');
  }
  if (end === true) {
    process.exit();
  } else {
    rl.question(prompt, function (x) {
      callback(x);
      rl.close();
    });
  }
};

/** @function
 * @name askNextQuestionModel
 * @param {string} resourceName
 * @param {string} fieldNameOrTypeOrEnd
 * @param {string} fieldNameOrTypeOrEndNext
 * @param {boolean} end
 */
const askNextQuestionModel = function (resourceName, fieldNameOrTypeOrEnd, fieldNameOrTypeOrEndNext, end) {
  const buildModelResourceFilePartial = partialRight(buildModelResourceFile, resourceName, fieldNameOrTypeOrEndNext);
  rlInput(fieldNameOrTypeOrEnd, buildModelResourceFilePartial, end);
};

/** @function
 * @name getCleanedResourceName
 * @param {string} resourceName
 * @return {string}
 */
const getCleanedResourceName = function (resourceName) {
  const resourceNameCleaned = resourceName.trim();
  return resourceNameCleaned.charAt(0).toUpperCase() + resourceNameCleaned.slice(1);
};

/** @function
 * @name getCleanedResourcePath
 * @param {string} cleanedResourceName
 * @param {string} fileName
 * @return {string}
 */
const getCleanedResourcePath = function (cleanedResourceName, fileName) {
  return `src/resources/${cleanedResourceName}/${fileName}`;
};

/** @function
 * @name buildResourceFile
 * @param {string} resourceName
 * @param {string} fileName
 */
const buildResourceFile = function (resourceName, fileName) {
  return new Promise((resolve, reject) => {
    const copiedPath = getCleanedResourcePath(resourceName, fileName);
    fs.copy(`src/resourcesBuilder/template/${fileName}`, copiedPath, err => {
      if (err) gulpErrors.info(err);
      if (fileName === 'index.js') {
        fs.readFile(copiedPath, 'utf8', function (err, data) {
          if (err) gulpErrors.info(err);
          const pluralResource = pluralize.plural(resourceName).toLowerCase();
          let fieldFilled = data.replace(/<your_resource_plural>/g, pluralResource);
          fieldFilled = fieldFilled.replace(/<your_resource>/g, resourceName);
          fs.writeFile(copiedPath, fieldFilled, 'utf8', function (err) {
            if (err) gulpErrors.error(err);
            resolve(resourceName);
          });
        });
      } else {
        resolve(resourceName);
      }
    });
  });
};

/** @function
 * @name buildResourceFolder
 * @param {string} resourceName
 */
const buildResourceFolder = function (resourceName) {
  if (resourceName.trim().length === 0) {
    rlInput('Resource Name is Required\nResource Name: ', buildResourceFolder, false);
  } else {
    let resourceNameCleaned = getCleanedResourceName(resourceName);
    if (pluralize.plural(resourceNameCleaned) === resourceNameCleaned) {
      resourceNameCleaned = pluralize.singular(resourceNameCleaned);
    }
    const dir = `src/resources/${resourceNameCleaned}`;
    fs.ensureDir(dir, err => {
      if (err) gulpErrors.error(err);
      return buildNonModelResourceFiles(resourceNameCleaned);
    });
  }
};

/** @function
 * @name buildNonModelResourceFiles
 * @param {string} resourceName
 */
const buildNonModelResourceFiles = function (resourceName) {
  return new Promise((resolve, reject) => {
    fs.readdir('src/resourcesBuilder/template', function (err, files) {
      if (err) gulpErrors.error(err);
      Promise.all(files.map(function (file) {
        if (file.slice(-3) === '.js') {
          return buildResourceFile(resourceName, file);
        }
      })).then(function (promiseAllData) {
        fs.readFile('src/resources/index.js', 'utf8', function (err, data) {
          if (err) gulpErrors.error(err);
          const resourcesIndex = data.toString().split('\n');
          resourcesIndex.unshift(`import ${promiseAllData[0]} from './${promiseAllData[0]}';`);
          resourcesIndex.forEach(function (line, index) {
            if (line.includes('export default') === true) {
              resourcesIndex[index] = `${line.slice(0, line.length - 2)}, ${promiseAllData[0]}${line.slice(line.length - 2)}`;
              const resourcesIndexConcat = resourcesIndex.join('\n');
              fs.writeFile('src/resources/index.js', resourcesIndexConcat, 'utf8', function (err) {
                if (err) gulpErrors.error(err);
                resolve(data[0]);
                askNextQuestionModel(promiseAllData[0], 'Field Name: ', 'Field Name: ', false);
              });
            }
          });
        });
      }, function (error) {
        gulpErrors.info(error);
      });
    });
  });
};

/** @function
 * @name resetTestConfig
 * @param {object} testConfig - testConfig.json
 * @description Resets testConfig.json to its starting state
 */
const resetTestConfig = function (testConfig) {
  testConfig.testNumber = 0;
  testConfig.individualHttpTest = false;
  testConfig.testsCasesHaveBeenGenerated = false;
  if (testConfig.generationConfig && testConfig.generationConfig.removePreviousGeneratedTestCases === true) {
    testConfig.testCases = testConfig.testCases.filter(function(testCase) {
      if (testCase.generatedByTestsCasesJs !== true) {
        return testCase;
      }
    });
  } else {
    gulpErrors.error('testConfig.generationConfig is falsy or removePreviousGeneratedTestCases is not true');
  }
  fs.writeFile('./test/testConfig.json', JSON.stringify(testConfig, null, 2), function (err) {
    if (err) return gulpErrors.error(err);
  });
};

/** @function
 * @name startOfTests
 * @param {string} env - test or staging
 * @description Clears and moves test results. Starts tests.
 */
const startOfTests = function (env) {
  const envCleaned = env.toLocaleLowerCase().trim();
  fs.truncate('./logs/previousTestResults.log', 0, function () {
    fs.rename('./logs/testResults.log', './logs/previousTestResults.log', function (err) {
      if (err) return gulpErrors.error(err);
      fs.truncate('./logs/testResults.log', 0, function () {
        runHttpTestsOrEnd(envCleaned);
      });
    });
  });
};

/** @function
 * @name endOfTests
 * @description Sets the test status for the currently tests and set the environment to development
 */
const endOfTests = function () {
  fs.readFile('./logs/testResults.log', 'utf8', (testResultsErr, testResultsData) => {
    if (testResultsErr) return gulpErrors.error(testResultsErr);
    let testResultOverview = '';
    if (testResultsData.toString('utf8').search(/AssertionError/g) !== -1) {
      testResultOverview = `Not all tests passed on ${new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '')} (UTC)`;
    } else {
      testResultOverview = `Passed all tests on ${new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '')} (UTC)`;
    }
    latestTests.info(testResultOverview);
    process.env.NODE_ENV = 'development';
  });
};

/** @function
 * @name runHttpTests
 * @param {string} env
 * @description Runs http tests until all the test cases in testConfig.json have been run
 */
const runHttpTests = function (env) {
  fs.readFile('./test/testConfig.json', 'utf8', (testConfigErr, testConfigData) => {
    const testConfig = JSON.parse(testConfigData);
    const numOfTestCasesHttp = testConfig.testCases.length;
    if (numOfTestCasesHttp > testConfig.testNumber) {
      testConfig.testNumber = testConfig.testNumber + 1;
      testConfig.individualHttpTest = true;
      fs.writeFile('./test/testConfig.json', JSON.stringify(testConfig, null, 2), function (err) {
        if (err) return gulpErrors.error(err);
        if (env === 'test') {
          gulp.start('repeat-test-server');
        } else if (env === 'staging') {
          gulp.start('repeat-test-staging-server');
        } else {
          gulpErrors.error('environment is not test or staging!');
        }
      });
    } else {
      resetTestConfig(testConfig);
      endOfTests();
    }
  });
};

/** @function
 * @name runHttpTestsOrEnd
 * @param {string} environment
 * @description Runs http tests if they have been enabled in testConfig.json
 */
const runHttpTestsOrEnd = function (environment) {
  fs.readFile('./test/testConfig.json', 'utf8', (testConfigErr, testConfigData) => {
    const testConfig = JSON.parse(testConfigData);
    if (testConfig.doHttpTests === true) {
      runHttpTests(environment);
    } else {
      endOfTests();
    }
  });
};
