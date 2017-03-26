const gulp = require('gulp');
const shell = require('gulp-shell');
const fs = require('fs-extra');
const winston = require('winston');
const glob = require("glob");
const readline = require('readline');
const spawn = require('child_process').spawn;
const config = require('./src/config');
const utilities = require('./src/utilities');

const winstonConfig = {
  tailable: utilities.yesTrueNoFalse(config.winston.tailable),
  maxsize: config.winston.maxsize,
  maxFiles: config.winston.maxFiles,
  zippedArchive: utilities.yesTrueNoFalse(config.winston.zippedArchive)
};

winstonConfig.filename = 'logs/gulpErrors.log';
winston.loggers.add('gulpError', {
  file: winstonConfig
});
const gulpErrors = winston.loggers.get('gulpError');

winstonConfig.filename = 'logs/testResults.log';
winston.loggers.add('testResults', {
  file: winstonConfig
});
const testResults = winston.loggers.get('testResults');

gulp.task('env-dev', function() {
  return process.env.NODE_ENV = 'development';
});

gulp.task('env-test', function() {
  return process.env.NODE_ENV = 'testing';
});

gulp.task('env-staging', function() {
  return process.env.NODE_ENV = 'staging';
});

gulp.task('env-prod', function() {
  return process.env.NODE_ENV = 'production';
});

gulp.task('env-force', function() {
  return process.env.FORCE = 'YES';
});

gulp.task('server-start', shell.task('npm start'));

gulp.task('server-start-no-nodemon', shell.task('npm run start-no-nodemon'));

gulp.task('server-build', shell.task('npm run build'));

gulp.task('server-serve', shell.task('npm run serve'));

gulp.task('server-http-test', shell.task('npm run http-test'));

gulp.task('server-http-just-aa-test', shell.task('npm run http-just-aa-test'));

gulp.task('server-http-just-access-test', shell.task('npm run http-just-access-test'));

gulp.task('server-test', shell.task('npm run test'));

gulp.task('server-test-all-ignore-config', ['server-http-test', 'server-test']);

gulp.task('build-all', ['server-build', 'wiki-build']);

// main test task
gulp.task('env-test-server', ['env-force', 'env-test', 'server-start-no-nodemon'], function () {
  runHttpTestsOrEnd('test');
});

// main test task
gulp.task('env-staging-server', ['server-build', 'env-force', 'env-staging', 'server-serve'], function () {
  runHttpTestsOrEnd('staging');
});

gulp.task('wiki-build', ['wiki-clear'], function () {
  markdownBuild('src', 'test');
});

gulp.task('wiki-clear', function () {
  emptyDirExceptForGit('wiki');
});

gulp.task('reset-test-config', function () {
  fs.readFile('./test/testConfig.json', 'utf8', (testConfigErr, testConfigData) => {
    const testConfig = JSON.parse(testConfigData);
    resetTestConfig(testConfig);
  });
});

gulp.task('retire', function() {
  // Spawn Retire.js as a child process
  // You can optionally add option parameters to the second argument (array)
  const child = spawn('retire', [], {cwd: process.cwd()});

  child.stdout.setEncoding('utf8');
  child.stdout.on('data', function (data) {
    winston.info(data);
  });

  child.stderr.setEncoding('utf8');
  child.stderr.on('data', function (data) {
    gulpErrors.error(data);
  });
});

/** @function
 * @name emptyDirExceptForGit
 * @param {string} dir
 * @description Creates a temporary folder to store .git into which gets deleted after .git is moved back to its original folder
 */
const emptyDirExceptForGit = function(dir) {
  const tempFolderName = makeTempDir();
  if ((tempFolderName.length > 0) && (tempFolderName !== 'Safety counter exceeded')) {
    fs.renameSync(`${dir}/.git`, `${tempFolderName}/.git`);
    fs.emptyDirSync(dir);
    fs.renameSync(`${tempFolderName}/.git`, `${dir}/.git`);
    fs.removeSync(tempFolderName);
  }
};

/** @function
 * @name makeTempDir
 * @param {number} safetyCounter
 * @returns {string}
 * @description Creates a unique temporary folder and returns the folder name or an error message
 */
const makeTempDir = function(safetyCounter) {
  if (!safetyCounter) {
    safetyCounter = 1;
  }
  const folderName = `temp_${+ new Date()}_${Math.random() * (99999 - 10000) + 10000}`;
  if (safetyCounter >= 20) {
    gulpErrors.error('Safety counter of makeTempDir was exceeded');
    return 'Safety counter exceeded';
  } else if (fs.existsSync(folderName)) {
    return makeTempDir(safetyCounter+1);
  } else {
    fs.ensureDirSync(folderName);
    return folderName;
  }
};

/** @function
 * @name markdownBuild
 * @description Runs the moveMarkdown function and the buildCustomSideMenu function if it is enabled in wikiConfig.json
 */
const markdownBuild = function() {
  fs.readFile('wikiConfig.json', 'utf8', (wikiConfigErr, wikiConfigData) => {
    const wikiConfig = JSON.parse(wikiConfigData);
    if(wikiConfig.customSidebar.toUpperCase() === "YES") {
      buildCustomSideMenu(arguments);
    }
  });
  const args = Array.prototype.slice.call(arguments);
  args.forEach(function(arg) {
    moveMarkdown(arg);
  });
  moveMarkdown('miscWikiPages');
};

/** @function
 * @name newMarkdownFileName
 * @param {string} file
 * @returns {object}
 * @description Returns a file name generated from the first line of a markdown file
 */
const newMarkdownFileName = function(file) {
  return new Promise(function(resolve, reject) {
    let lineNumber = 0;
    const rl = readline.createInterface({
      input: fs.createReadStream(file)
    });
    rl.on('line', function (line) {
      if (lineNumber === 0) {
        resolve(line.replace(/^#+/g, '').split(" ").filter(i => {
          return i !== '';
        }).map(i => {
          return i[0].toUpperCase() + i.substr(1).toLowerCase();
        }).join("-")+'.md');
      }
      lineNumber += 1;
    });
  });
};

/** @function
 * @name copyToWikiFolder
 * @param {string} file
 * @param {string} wikiFile
 * @description Used by moveMarkdown
 */
const copyToWikiFolder = function(file, wikiFile) {
  fs.copy(file, `wiki/${wikiFile}`, err => {
    if (err) return gulpErrors.error(err);
  })
};

/** @function
 * @name moveMarkdown
 * @param {string} dir
 * @description Copies markdown files to the wiki directory with file names based on the first line of the file
 */
const moveMarkdown = function(dir) {
  let ignoredFile = false;
  let fileName = '';
  let fileNameSections = [];
  const usedFileNames = [];
  glob(`${dir}/**/*.md`, function (er, files) {
    fs.readFile('wikiConfig.json', 'utf8', (wikiConfigErr, wikiConfigData) => {
      const wikiConfig = JSON.parse(wikiConfigData);
      if(Array.isArray(files) && files.length > 0) {
        files.forEach(function(file) {
          fileNameSections = file.split('/');
          fileName = fileNameSections.pop().toLowerCase().trim();
          if(file === 'miscWikiPages/Home.md') {
            fileName = fileName.replace(/(?:^|\s)\S/g, function(a) { return a.toUpperCase(); });
            copyToWikiFolder(file, fileName);
          } else {
            ignoredFile = false;
            if (Array.isArray(wikiConfig.ignore) && wikiConfig.ignore.length > 0) {
              // console.log('filename', fileName);
              // console.log('wikiConfig.ignore', wikiConfig.ignore);
              if (wikiConfig.ignore.indexOf(fileName) >= 0) {
                ignoredFile = true;
              }
            }
            if (ignoredFile === false) {
              newMarkdownFileName(file).then(function (newFileName) {
                // console.log('newFileName', newFileName);
                if (usedFileNames.indexOf(newFileName) >= 0) {
                  newFileName = `${newFileName} (${fileNameSections.pop()})`;
                }
                usedFileNames.push(newFileName);
                copyToWikiFolder(file, newFileName);
              });
            }
          }
        });
      }
    });
  })
};

/** @function
 * @name buildCustomSideMenu
 * @param {Array} arguments
 * @description Not finished
 */
const buildCustomSideMenu = function() {
  const dirs = Array.prototype.slice.call(arguments);
  if(Array.isArray(dirs) && dirs.length > 0) {
    const mainSections = []; // array of arrays
    dirs.forEach(function(dir) {
      // todo
    });
  }
};

/** @function
 * @name resetTestConfig
 * @param {object} testConfig - testConfig.json
 * @description Resets testConfig.json to its starting state
 */
const resetTestConfig = function(testConfig) {
  testConfig.testNumber = 0;
  testConfig.individualHttpTest = false;
  testConfig.testsCasesHaveBeenGenerated = false;
  if(testConfig.generationConfig && testConfig.generationConfig.removePreviousGeneratedTestCases === true) {
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
 * @name endOfTests
 * @description Sets the test status for the currently tests and set the environment to development
 */
const endOfTests = function() {
  fs.readFile('logs/latestTests.log', (err, data) => {
    if (err) {
      gulpErrors.error(err);
      throw err;
    }
    let testResultOverview = '';
    if (data.toString('utf8').search(/failing/g) !== -1) {
      testResultOverview = `Did not pass all tests (${new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '')})`;
    } else {
      testResultOverview = `Passed all tests (${new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '')})`;
    }
    fs.writeFile('logs/latestTests.log', testResultOverview, function (err) {
      if (err) return gulpErrors.error(err);
      testResults.info(testResultOverview);
    });
  });
  process.env.NODE_ENV = 'development';
};

/** @function
 * @name runHttpTests
 * @param {string} env
 * @description Runs http tests until all the test cases in testConfig.json have been run
 */
const runHttpTests = function(env) {
  fs.readFile('./test/testConfig.json', 'utf8', (testConfigErr, testConfigData) => {
    const testConfig = JSON.parse(testConfigData);
    const numOfTestCasesHttp = testConfig.testCases.length;
    if (numOfTestCasesHttp > testConfig.testNumber) {
      testConfig.testNumber = testConfig.testNumber + 1;
      testConfig.individualHttpTest = true;
      fs.writeFile('./test/testConfig.json', JSON.stringify(testConfig, null, 2), function (err) {
        if (err) return gulpErrors.error(err);
        if (env === 'test') {
          gulp.start('env-test-server');
        } else if (env === 'staging') {
          gulp.start('env-staging-server');
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
const runHttpTestsOrEnd = function(environment) {
  fs.readFile('./test/testConfig.json', 'utf8', (testConfigErr, testConfigData) => {
    const testConfig = JSON.parse(testConfigData);
    if (testConfig.doHttpTests === true) {
      runHttpTests(environment);
    } else {
      endOfTests();
    }
  });
};