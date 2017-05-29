const gulp = require('gulp');
const shell = require('gulp-shell');
const fs = require('fs-extra');
const winston = require('winston');
const glob = require('glob');
const readline = require('readline');
const spawn = require('child_process').spawn;
const Transform = require('stream').Transform;
const util = require('util');
const pluralize = require('pluralize');
const config = require('./src/config');
const utilities = require('./src/utilities');

let winstonConfig = utilities.setUpWinstonLogger('logs/gulpErrors.log');

winston.loggers.add('gulpError', {
  file: winstonConfig,
});
const gulpErrors = winston.loggers.get('gulpError');

winstonConfig = utilities.setUpWinstonLogger('logs/testResults.log');
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

gulp.task('test-autoAssociations', shell.task('npm run test-autoAssociations'));

gulp.task('test-permissions', shell.task('npm run test-permissions'));

gulp.task('test-groups', shell.task('npm run test-groups'));

gulp.task('test-failing', shell.task('npm run test-failing'));

gulp.task('append-stats', shell.task('git diff --stat `git hash-object -t tree /dev/null` > miscWikiPages/Stats.md'));

gulp.task('generate-changelog', shell.task('github_changelog_generator'));

gulp.task('build-dup-report', shell.task('jscpd'));

gulp.task('travis-test', ['test-permissions', 'test-autoAssociations']);

gulp.task('build-stats', ['stats-clear', 'append-stats', 'stats-clean']);

gulp.task('server-test-all-ignore-config', ['server-http-test', 'server-test']);

gulp.task('pre-commit-build', ['build-dup-report', 'generate-changelog', 'wiki-build']);

gulp.task('build-all', ['server-build', 'pre-commit-build']);

// main test task for not built code
gulp.task('env-test-server', ['env-force', 'env-test', 'server-start-no-nodemon'], function () {
  runHttpTestsOrEnd('test');
});

// main test task for built code
gulp.task('env-staging-server', ['server-build', 'env-force', 'env-staging', 'server-serve'], function () {
  runHttpTestsOrEnd('staging');
});

gulp.task('wiki-build', ['wiki-clear', 'build-stats'], function () {
  markdownBuild('src', 'test');
});

gulp.task('wiki-clear', function () {
  emptyDirExceptForGit('wiki');
});

gulp.task('stats-clear', function() {
  fs.removeSync('./miscWikiPages/_Stats.md');
  fs.removeSync('./miscWikiPages/Stats.md');
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

gulp.task('stats-clean', function() {
  fs.removeSync('./miscWikiPages/_Stats.md');
  waitForFileWriteToFinish('./miscWikiPages/Stats.md', buildStats, 1);
});

gulp.task('new-resource', function() {
  rlInput('', buildResourceFolder, false);
});

/** @function
 * @name partialRight
 * @param {function} fn
 * @return {function}
 * @description see: http://benalman.com/news/2012/09/partial-application-in-javascript/
 */
const partialRight = function(fn /*, args...*/) {
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
const buildModelResourceFile = function(userInput, cleanedResourceName, fieldNameOrTypeOrEnd) {
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
const buildAnotherFieldOrEnd = function(userInput, resourceName, modelFile) {
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
const buildFieldType = function(userInput, resourceName, modelFile) {
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
const buildFieldName = function(userInput, resourceName, modelFile) {
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
const rlInput = function(prompt, callback, end = false) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
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
const askNextQuestionModel = function(resourceName, fieldNameOrTypeOrEnd, fieldNameOrTypeOrEndNext, end) {
  const buildModelResourceFilePartial = partialRight(buildModelResourceFile, resourceName, fieldNameOrTypeOrEndNext);
  rlInput(fieldNameOrTypeOrEnd, buildModelResourceFilePartial, end);
};

/** @function
 * @name getCleanedResourceName
 * @param {string} resourceName
 * @return {string}
 */
const getCleanedResourceName = function(resourceName) {
  const resourceNameCleaned = resourceName.trim();
  return resourceNameCleaned.charAt(0).toUpperCase() + resourceNameCleaned.slice(1);
};

/** @function
 * @name getCleanedResourcePath
 * @param {string} cleanedResourceName
 * @param {string} fileName
 * @return {string}
 */
const getCleanedResourcePath = function(cleanedResourceName, fileName) {
  return`src/resources/${cleanedResourceName}/${fileName}`;
};

/** @function
 * @name buildResourceFile
 * @param {string} resourceName
 * @param {string} fileName
 */
const buildResourceFile = function(resourceName, fileName) {
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
const buildResourceFolder = function(resourceName) {
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
const buildNonModelResourceFiles = function(resourceName) {
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
      });
    });
  });
};

/** @function
 * @name buildStats
 * @description Passed to waitForFileWriteToFinish
 */
const buildStats = function() {
  fs.renameSync('./miscWikiPages/Stats.md', './miscWikiPages/_Stats.md');
  fs.removeSync('./miscWikiPages/Stats.md');
  fs.ensureFileSync('./miscWikiPages/Stats.md');
  const file = fs.readFileSync('./miscWikiPages/Stats.md').toString().split("\n");
  file.splice(0, 0, "# Stats");
  const newFile = file.join("\n\n");

  fs.writeFile('./miscWikiPages/Stats.md', newFile, function (err) {
    if (err) return err;
    fs.readFileSync('./miscWikiPages/_Stats.md').toString().split('\n').forEach(function (line, index, array) {
      if (index === array.length - 2) {
        const lineCopy = line.toString();
        const numbers = lineCopy.match(/\d+/g);
        const replacementLine = `Files: ${numbers[0]}\n\nTotal Lines of Code: ${numbers[1]}`;
        fs.appendFileSync('./miscWikiPages/Stats.md', replacementLine);
      } else if(index === array.length - 1) {

      } else {
        fs.appendFileSync('./miscWikiPages/Stats.md', line.toString() + '\n\n');
      }
    });
    deleteFileWhenItExists('./miscWikiPages/_Stats.md', 1);
  });
};

/** @function
 * @name deleteFileWhenItExists
 * @param {string} filePath
 * @param {number} safetyCounter
 */
const deleteFileWhenItExists = function(filePath, safetyCounter = 1) {
  if (safetyCounter > 10000) {
    gulpErrors.error('Safety counter of deleteFileWhenItExists was exceeded');
  }
  const newSafetyCounter = safetyCounter + 1;
  fs.stat(filePath, function(err, stats) {
    if (err) {
      if (err.errno === -2) {
        deleteFileWhenItExists(filePath, newSafetyCounter);
      } else {
        gulpErrors.error('Unhandled error: ', err);
      }
    } else if (stats.isFile()) {
      fs.removeSync(filePath);
    }
  });
};

/** @function
 * @name waitForFileWriteToFinish
 * @param {string} filePath
 * @param {function} functionToRun
 * @param {number} safetyCounter
 * @param {number} previousSize
 * @param {number} sameSizeCount
 */
const waitForFileWriteToFinish = function(filePath, functionToRun, safetyCounter = 1, previousSize, sameSizeCount = 0) {
  if (safetyCounter > 10000) {
    gulpErrors.error('Safety counter of waitForFileWriteToFinish was exceeded');
  }
  const newSafetyCounter = safetyCounter + 1;
  fs.stat(filePath, function(err, stats) {
    if (err) {
      if (err.errno === -2) {
        waitForFileWriteToFinish(filePath, functionToRun, newSafetyCounter);
      } else {
        gulpErrors.error('Unhandled error: ', err);
      }
    } else if (stats.isFile()) {
      let sameSizeCountCopy = sameSizeCount;
      if ((stats.size > 0) && stats.size && previousSize && (stats.size === previousSize)) {
        sameSizeCountCopy+=1;
      }
      if (sameSizeCountCopy > 25) {
        functionToRun();
      } else {
        waitForFileWriteToFinish(filePath, functionToRun, newSafetyCounter, stats.size, sameSizeCountCopy);
      }
    } else {
      gulpErrors.error('Not a file', stats);
    }
  });
};

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
 * @name RemoveFirstLine
 * @param args
 * @author moka (Max M)
 * @description RemoveFirstLine of file. See moka's answer https://stackoverflow.com/questions/17363206/node-js-how-to-delete-first-line-in-file/17365494
 */
// Transform sctreamer to remove first line
const RemoveFirstLine = function(args) {
  if (! (this instanceof RemoveFirstLine)) {
    return new RemoveFirstLine(args);
  }
  Transform.call(this, args);
  this._buff = '';
  this._removed = false;
};

util.inherits(RemoveFirstLine, Transform);

RemoveFirstLine.prototype._transform = function(chunk, encoding, done) {
  if (this._removed) { // if already removed
    this.push(chunk); // just push through buffer
  } else {
    // collect string into buffer
    this._buff += chunk.toString();

    // check if string has newline symbol
    if (this._buff.indexOf('\n') !== -1) {
      // push to stream skipping first line
      this.push(this._buff.slice(this._buff.indexOf('\n') + 2));
      // clear string buffer
      this._buff = null;
      // mark as removed
      this._removed = true;
    }
  }
  done();
};

/** @function
 * @name markdownBuild
 * @param {array} arguments
 * @description Runs the moveMarkdown function and the buildCustomSideMenu function if it is enabled in wikiConfig.json
 */
const markdownBuild = function() {
  fs.readFile('wikiConfig.json', 'utf8', (wikiConfigErr, wikiConfigData) => {
    const wikiConfig = JSON.parse(wikiConfigData);
    if(wikiConfig.customSidebar.toUpperCase() === 'YES') {
      buildCustomSideMenu(arguments);
    }
  });

  moveAllMarkdown.apply(this, arguments);
};

/** @function
 * @name removeTitleFromMarkdown
 * @param {string} file
 * @description Removes first line from a file
 */
const removeTitleFromMarkdown = function(file) {
  const input = fs.createReadStream(`wiki/${file}`);
  const output = fs.createWriteStream(`wiki/_${file}`);

  input
    .pipe(RemoveFirstLine()) // pipe through line remover
    .pipe(output);

  output.on('finish', function() {
    fs.rename(`wiki/_${file}`, `wiki/${file}`, doneCustom);
  });
};

/** @function
 * @name doneCustom
 * @description Function for callbacks
 */
const doneCustom = function() {
  // console.log('function done');
};

/** @function
 * @name moveAllMarkdown
 * @param {array} arguments
 * @description Runs moveMarkdown for all the markdown files to be moved
 */
const moveAllMarkdown = function() {
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
        resolve(line.replace(/^#+/g, '').split(' ').filter(i => {
          return i !== '';
        }).map(i => {
          return i[0].toUpperCase() + i.substr(1).toLowerCase();
        }).join('-')+'.md');
      }
      lineNumber += 1;
    });
  });
};

/** @function
 * @name createWikiFile
 * @param {string} file
 * @param {string} wikiFile
 * @description Used by moveMarkdown
 */
const createWikiFile = function(file, wikiFile) {
  fs.copy(file, `wiki/${wikiFile}`, err => {
    if (err) return gulpErrors.error(err);
    removeTitleFromMarkdown(wikiFile);
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
      const titlesToIgnoreArray = wikiConfig.titlesToIgnore.filter(title => {
        return (typeof title === 'string');
      }).map(title => {
        return `${title.replace(/\s+/g, '-').toLocaleLowerCase()}.md`;
      });
      if(Array.isArray(files) && files.length > 0) {
        files.forEach(function(file) {
          fileNameSections = file.split('/');
          fileName = fileNameSections.pop().toLowerCase().trim();
          if(file === 'miscWikiPages/Home.md') {
            fileName = fileName.replace(/(?:^|\s)\S/g, function(a) { return a.toUpperCase(); });
            createWikiFile(file, fileName);
          } else if(file === 'miscWikiPages/Stats.md') {
            createWikiFile(file, 'Stats.md');
          } else {
            ignoredFile = false;
            if (Array.isArray(wikiConfig.filesToIgnore) && wikiConfig.filesToIgnore.length > 0) {
              if (wikiConfig.filesToIgnore.indexOf(fileName) >= 0) {
                ignoredFile = true;
              }
            }
            if (ignoredFile === false) {
              newMarkdownFileName(file).then(function (newFileName) {
                // console.log('newFileName', newFileName);
                if (titlesToIgnoreArray.indexOf(newFileName.toLocaleLowerCase()) < 0) {
                  if (usedFileNames.indexOf(newFileName) >= 0) {
                    newFileName = `${newFileName} (${fileNameSections.pop()})`;
                  }
                  usedFileNames.push(newFileName);
                  createWikiFile(file, newFileName);
               }
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