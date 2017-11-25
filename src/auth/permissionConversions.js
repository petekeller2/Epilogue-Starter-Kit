// @flow
import utilities from '../utilities';
import testConfig from '../../test/testConfig.json';

export default {
  /** @function
   * @name createInitPermissionsArray
   * @param {*} defaultBool - should be a boolean or something that is clearly meant to be truthy or falsy
   * @return {Array}
   * @description Creates a 20 boolean array with all true or all false
   */
  createInitPermissionsArray(defaultBool: any): [] {
    let defaultPermissions = false;
    if (defaultBool) {
      defaultPermissions = true;
    }
    const permissionsReturn = [];
    for (let i = 0; i < 20; i += 1) {
      permissionsReturn.push(defaultPermissions);
    }
    return permissionsReturn;
  },
  /** @function
   * @name reverseInputInBinary
   * @param {string} inputInBinary
   * @return {string}
   * @description Helper function for convertNumberPermissions
   */
  reverseInputInBinary(inputInBinary: string): string {
    let inputInBinaryBackwards = '';
    for (let i = inputInBinary.length - 1; i >= 0; i -= 1) {
      inputInBinaryBackwards += inputInBinary[i];
    }
    return inputInBinaryBackwards;
  },
  /** @function
   * @name convertNumberPermissions
   * @param {number} permissionsInput
   * @return {Array}
   * @description For number permissions, read being true means list is true as well (list permissions can't be directly set)
   */
  convertNumberPermissions(permissionsInput: number): [] {
    const permissionsReturn = this.createInitPermissionsArray(false);
    if (!Number.isFinite(permissionsInput)) {
      utilities.winstonWrapper('Infinite number!', 'warning');
      return permissionsReturn;
    }
    const inputInBinary = permissionsInput.toString(2);
    const inputInBinaryBackwards = this.reverseInputInBinary(inputInBinary);
    let permissionsBit;
    let permissionsReturnIndex = 0;
    for (let i = 0; i < inputInBinaryBackwards.length; i += 1) {
      permissionsBit = inputInBinaryBackwards.charAt(i);
      if (permissionsBit === '1') {
        permissionsReturn[permissionsReturnIndex] = true;
        if ((i % 4) === 2) {
          permissionsReturn[permissionsReturnIndex + 2] = true;
        }
      } else if (permissionsBit === '0') {
        permissionsReturn[permissionsReturnIndex] = false;
      } else {
        utilities.winstonWrapper('Permission bit not a one or a zero!', 'warning');
      }
      if ((i % 4) === 3) {
        permissionsReturnIndex += 1;
      }
      permissionsReturnIndex += 1;
    }
    return permissionsReturn.reverse();
  },
  /** @function
   * @name stringPermissionsRegex
   * @param {string} permissionsInputPartiallyCleaned
   * @return {string}
   * @description Regex cleaning on the partially cleaned permissions string
   */
  stringPermissionsRegex(permissionsInputPartiallyCleaned: string): string {
    let permissionsInputCleanedReturn = permissionsInputPartiallyCleaned.replace(/^\s+/g, '');
    permissionsInputCleanedReturn = permissionsInputCleanedReturn.replace(/n\/a/g, '|');
    permissionsInputCleanedReturn = permissionsInputCleanedReturn.replace(/na/g, '|');
    permissionsInputCleanedReturn = permissionsInputCleanedReturn.replace(/n/g, '|');
    permissionsInputCleanedReturn = permissionsInputCleanedReturn.replace(/x/g, '|');
    permissionsInputCleanedReturn = permissionsInputCleanedReturn.replace(/\s+\|/g, '|');
    permissionsInputCleanedReturn = permissionsInputCleanedReturn.replace(/\|\s+/g, '|');
    permissionsInputCleanedReturn = permissionsInputCleanedReturn.replace(/\s+/g, '|');
    permissionsInputCleanedReturn = permissionsInputCleanedReturn.replace(/\*/g, 'lcrud');
    permissionsInputCleanedReturn = permissionsInputCleanedReturn.replace(/list|ls/g, 'l');
    permissionsInputCleanedReturn = permissionsInputCleanedReturn.replace(/read/g, 'r');
    permissionsInputCleanedReturn = permissionsInputCleanedReturn.replace(/update|upd/g, 'u');
    permissionsInputCleanedReturn = permissionsInputCleanedReturn.replace(/destroy|dstr/g, 'd');
    permissionsInputCleanedReturn = permissionsInputCleanedReturn.replace(/[^lcrud|]/g, '');
    permissionsInputCleanedReturn = permissionsInputCleanedReturn.replace(/d(?!\|)/g, 'd|');
    permissionsInputCleanedReturn = permissionsInputCleanedReturn.replace(/u(?!\||d)/g, 'u|');
    permissionsInputCleanedReturn = permissionsInputCleanedReturn.replace(/r(?!\||d|u)/g, 'r|');
    permissionsInputCleanedReturn = permissionsInputCleanedReturn.replace(/c(?!\||d|u|r)/g, 'c|');
    permissionsInputCleanedReturn = permissionsInputCleanedReturn.replace(/l(?!\||d|u|r|c)/g, 'l|');
    return permissionsInputCleanedReturn;
  },
  /** @function
   * @name getNumberSubStringStart
   * @param {string} permissionsInputCleaned
   * @return {*}
   * @description Helper function for numericStringPermissions
   */
  getNumberSubStringStart(permissionsInputCleaned: string): any {
    if (permissionsInputCleaned.indexOf('0x') > -1) {
      return permissionsInputCleaned.indexOf('0x');
    } else if (permissionsInputCleaned.indexOf('0o') > -1) {
      return permissionsInputCleaned.indexOf('0o');
    } else if (permissionsInputCleaned.indexOf('0b') > -1) {
      return permissionsInputCleaned.indexOf('0b');
    } else {
      return false;
    }
  },
  /** @function
   * @name numericStringPermissions
   * @param {string} permissionsInput
   * @param {string} permissionsInputCleaned
   * @param {Array} permissionsReturn
   * @return {boolean|Array} False or Array
   * @description Returns permissions array if string is numeric. Returns permissionsReturn as is if numbers and strings are mixed
   */
  numericStringPermissions(permissionsInput: string, permissionsInputCleaned: string, permissionsReturn: []): boolean | [] {
    let returnValue = false;
    const numberSubStringStart = this.getNumberSubStringStart(permissionsInputCleaned);
    if (!Number.isNaN(Number(permissionsInput))) {
      returnValue = this.convertNumberPermissions(Number(permissionsInput));
    } else if (/\d/.test(permissionsInputCleaned)) {
      utilities.winstonWrapper('Can not mix strings and numbers!', 'warning');
      returnValue = permissionsReturn;
    }
    if (numberSubStringStart || numberSubStringStart === 0) {
      if (!Number.isNaN(Number(permissionsInputCleaned.substr(numberSubStringStart)))) {
        returnValue = this.convertNumberPermissions(Number(permissionsInputCleaned.substr(numberSubStringStart)));
      } else {
        utilities.winstonWrapper('NaN, but should be a number!', 'warning');
      }
    }
    return returnValue;
  },
  /** @function
   * @name shiftStringPermissionElements
   * @param {Array} permissionsArray
   * @param {String} permissionsInputCleaned
   * @return {Array}
   * @description Helper function for buildStringPermissionReturn
   */
  shiftStringPermissionElements(permissionsArray: [], permissionsInputCleaned: string): [] {
    const checkSubString = permissionsInputCleaned.slice(0, permissionsInputCleaned.split('|', 2).join('|').length);
    if (checkSubString.search(/[lcrud]/g) === -1) {
      const permissionsReturn = permissionsArray;
      permissionsReturn.splice(15, 5);
      for (let i = 0; i < 5; i += 1) {
        permissionsReturn.unshift(false);
      }
      return permissionsReturn;
    } else {
      return permissionsArray;
    }
  },
  /** @function
   * @name buildStringPermissionTrueIndex
   * @param {string} permissionLetter
   * @param {number} section
   * @return {*}
   * @description Helper function for buildStringPermissionReturn
   */
  buildStringPermissionTrueIndex(permissionLetter: string, section: number): any {
    if (permissionLetter === 'l') {
      return (section * 5);
    } else if (permissionLetter === 'c') {
      return ((section * 5) + 1);
    } else if (permissionLetter === 'r') {
      return ((section * 5) + 2);
    } else if (permissionLetter === 'u') {
      return ((section * 5) + 3);
    } else if (permissionLetter === 'd') {
      return ((section * 5) + 4);
    } else {
      return false;
    }
  },
  /** @function
   * @name buildStringPermissionReturn
   * @param {number} lengthOfSection
   * @param {string} permissionsInputCleaned
   * @param {number} letterIndex
   * @param {number} section
   * @param {Array} permissionsReturn
   * @return {Array}
   * @description Helper function for convertStringPermissions
   */
  buildStringPermissionReturn(lengthOfSection, permissionsInputCleaned, letterIndex, section, permissionsReturn): [] {
    let lengthOfSectionCopy = lengthOfSection;
    let letterIndexCopy = letterIndex;
    const permissionsReturnCopy = permissionsReturn;
    for (let lcrudIndex = 0; lcrudIndex < lengthOfSectionCopy; lcrudIndex += 1) {
      const permissionLetter = permissionsInputCleaned.charAt(letterIndexCopy);
      const permissionIndex = this.buildStringPermissionTrueIndex(permissionLetter, section);
      if (permissionIndex !== false) {
        permissionsReturnCopy[permissionIndex] = true;
      } else if (permissionLetter) {
        lengthOfSectionCopy += 1;
      }
      letterIndexCopy += 1;
    }
    return [permissionsReturnCopy, letterIndexCopy];
  },
  /** @function
   * @name getSectionInfo
   * @param {boolean} nonPipeIndexFound
   * @param {number} nextNonPipeIndex
   * @param {string} permissionsInputCleaned
   * @param {string} findSectionLengthSubString
   * @param {number} lengthOfSection
   * @param {number} section
   * @return {Array}
   * @description Helper function for convertStringPermissions
   */
  getSectionInfo(nonPipeIndexFound, nextNonPipeIndex, permissionsInputCleaned, findSectionLengthSubString, lengthOfSection, section): [] {
    let lengthOfSectionCopy = lengthOfSection;
    let nonPipeIndexFoundCopy = nonPipeIndexFound;
    let nextNonPipeIndexCopy = nextNonPipeIndex;
    let sectionCopy = section;
    let findSectionLengthSubStringCopy = findSectionLengthSubString;
    while (nonPipeIndexFoundCopy === false && nextNonPipeIndexCopy < permissionsInputCleaned.length) {
      if (findSectionLengthSubStringCopy.indexOf('|') > 0) {
        lengthOfSectionCopy = (findSectionLengthSubStringCopy.substr(0, findSectionLengthSubStringCopy.indexOf('|'))).length;
        nonPipeIndexFoundCopy = true;
      } else {
        if (findSectionLengthSubStringCopy.indexOf('|') === 0 && sectionCopy === 0) {
          sectionCopy += 1;
        } else if (findSectionLengthSubStringCopy.indexOf('||') === 0) {
          sectionCopy += 1;
        }
        nextNonPipeIndexCopy += 1;
        findSectionLengthSubStringCopy = permissionsInputCleaned.substr(nextNonPipeIndexCopy);
      }
    }
    return [lengthOfSectionCopy, sectionCopy];
  },
  /** @function
   * @name convertStringPermissions
   * @param {string} permissionsInput
   * @return {Array}
   * @description Sends number strings to convertNumberPermissions, otherwise, string permissions are converted
   */
  convertStringPermissions(permissionsInput: string): [] {
    let permissionsReturn = this.createInitPermissionsArray(false);
    let permissionsInputCleaned = permissionsInput.toLowerCase();

    const numericReturn = this.numericStringPermissions(permissionsInput, permissionsInputCleaned, permissionsReturn);
    if (numericReturn !== false) {
      return numericReturn;
    }

    permissionsInputCleaned = this.stringPermissionsRegex(permissionsInputCleaned);

    let lengthOfSection;
    let letterIndex = 0;
    let findSectionLengthSubString;
    let nextNonPipeIndex;
    let nonPipeIndexFound;
    while (letterIndex < permissionsInputCleaned.length) {
      for (let section = 0; section < 4; section += 1) {
        findSectionLengthSubString = permissionsInputCleaned.substr(letterIndex);
        nextNonPipeIndex = letterIndex;
        nonPipeIndexFound = false;
        lengthOfSection = findSectionLengthSubString.length;

        let sectionArguments = [nonPipeIndexFound, nextNonPipeIndex, permissionsInputCleaned];
        sectionArguments = sectionArguments.concat([findSectionLengthSubString, lengthOfSection, section]);
        [lengthOfSection, section] = this.getSectionInfo(...sectionArguments);

        const buildArguments = [lengthOfSection, permissionsInputCleaned, letterIndex, section, permissionsReturn];
        [permissionsReturn, letterIndex] = this.buildStringPermissionReturn(...buildArguments);
      }
    }
    return this.shiftStringPermissionElements(permissionsReturn, permissionsInputCleaned);
  },
  /** @function
   * @name convertArrayPermissions
   * @param {Array} permissionsInput
   * @return {Array}
   */
  convertArrayPermissions(permissionsInput: []): [] {
    const permissionsReturn = [];
    permissionsInput.forEach((permissionsElement) => {
      if ((typeof permissionsElement) === 'boolean') {
        permissionsReturn.push(permissionsElement);
      }
    });
    for (let i = permissionsReturn.length; i < 20; i += 1) {
      permissionsReturn.push(false);
    }
    return permissionsReturn;
  },
  /** @function
   * @name getSectionMultiplier
   * @param {string} permissionKey
   * @return {*}
   * @description Helper function for convertObjectPermissions
   */
  getSectionMultiplier(permissionKey: string): any {
    if (permissionKey.toLowerCase() === 'owner') {
      return 0;
    } else if (permissionKey.toLowerCase() === 'group') {
      return 1;
    } else if (permissionKey.toLowerCase() === 'loggedinuser') {
      return 2;
    } else if (permissionKey.toLowerCase() === 'anyuser') {
      return 3;
    } else {
      utilities.winstonWrapper('unhandled permission section!', 'warning');
      return null;
    }
  },
  /** @function
   * @name buildObjectPermissionsReturn
   * @param {Array} permissionsReturn
   * @param {string} permissionArrayElement
   * @param {number} permissionsReturnIndex
   * @return {Array}
   * @description Used in convertObjectPermissions
   */
  buildObjectPermissionsReturn(permissionsReturn: [], permissionArrayElement: string, permissionsReturnIndex: number): [] {
    const permissionsReturnCopy = permissionsReturn;
    let permissionsReturnIndexCopy = permissionsReturnIndex;
    if (permissionArrayElement === 'list' || permissionArrayElement === 'l') {
      permissionsReturnCopy[permissionsReturnIndexCopy] = true;
    } else if (permissionArrayElement[0] === 'c') { // create or c
      permissionsReturnIndexCopy += 1;
      permissionsReturnCopy[permissionsReturnIndexCopy] = true;
    } else if (permissionArrayElement[0] === 'r') { // read or r
      permissionsReturnIndexCopy += 2;
      permissionsReturnCopy[permissionsReturnIndexCopy] = true;
    } else if (permissionArrayElement[0] === 'u') { // update or u
      permissionsReturnIndexCopy += 3;
      permissionsReturnCopy[permissionsReturnIndexCopy] = true;
    } else if (permissionArrayElement[0] === 'd') { // delete or d
      permissionsReturnIndexCopy += 4;
      permissionsReturnCopy[permissionsReturnIndexCopy] = true;
    } else {
      utilities.winstonWrapper('Unhandled resource operation!', 'warning');
    }
    return permissionsReturnCopy;
  },
  /** @function
   * @name convertObjectPermissions
   * @param {object} permissionsInput
   * @return {Array}
   * @description Object of arrays with strings as elements. Non-string elements are meaningless
   */
  convertObjectPermissions(permissionsInput: {}): [] {
    let permissionKey;
    let sectionMultiplier;
    let permissionArrayElement;
    let permissionsReturnIndex;
    let permissionsSectionArrayLength;
    let permissionsReturn = this.createInitPermissionsArray();
    const propertiesLength = Object.keys(permissionsInput).length;
    for (let propertyIndex = 0; propertyIndex < propertiesLength; propertyIndex += 1) {
      permissionKey = Object.keys(permissionsInput)[propertyIndex];
      sectionMultiplier = this.getSectionMultiplier(permissionKey);
      if (Array.isArray(permissionsInput[permissionKey])) {
        permissionsSectionArrayLength = permissionsInput[permissionKey].length;
        for (let arrayIndex = 0; arrayIndex < permissionsSectionArrayLength; arrayIndex += 1) {
          if ((typeof permissionsInput[permissionKey][arrayIndex]) === 'string') {
            permissionArrayElement = (permissionsInput[permissionKey][arrayIndex]).toLowerCase();
            permissionsReturnIndex = (sectionMultiplier * 5);
            permissionsReturn = this.buildObjectPermissionsReturn(permissionsReturn, permissionArrayElement, permissionsReturnIndex);
          } else {
            utilities.winstonWrapper('permissionsInput[permissionKey][arrayIndex] should be a string!', 'warning');
          }
        }
      } else {
        utilities.winstonWrapper('permissionsInput[permissionKey] should be an array!', 'warning');
      }
    }
    return permissionsReturn;
  },
  /** @function
   * @name convertPermissions
   * @param {*} permissionsInput
   * @return {Array}
   * @description Passes permissions to the other permissions functions based on input type
   */
  convertPermissions(permissionsInput: any): [] {
    if (permissionsInput) {
      if ((typeof permissionsInput) === 'string') {
        return this.convertStringPermissions(permissionsInput);
      } else if ((typeof permissionsInput) === 'object') {
        if (Array.isArray(permissionsInput)) {
          return this.convertArrayPermissions(permissionsInput);
        } else {
          return this.convertObjectPermissions(permissionsInput);
        }
      } else if ((typeof permissionsInput) === 'number') {
        return this.convertNumberPermissions(permissionsInput);
      } else {
        utilities.winstonWrapper('permissionsInput not a string, object, number or array!', 'warning');
        return this.createInitPermissionsArray(true);
      }
    } else {
      utilities.winstonWrapper('no permissionsInput!', 'warning');
      return this.createInitPermissionsArray(true);
    }
  },
  /** @function
   * @name convertRealOrTestPermissions
   * @param {*} permissionsInput
   * @param {string} resourceName
   * @param {boolean} isHttpTest - Should be boolean or something that is clearly truthy or falsy
   * @param {boolean} validTestNumber - Should be boolean or something that is clearly truthy or falsy
   * @return {Array}
   * @description Passes real permissions or test permissions to convertPermissions and returns its results
   */
  convertRealOrTestPermissions(permissionsInput: any, resourceName: string, isHttpTest: boolean, validTestNumber: boolean): [] {
    if (isHttpTest && validTestNumber && testConfig.testCases[testConfig.testNumber - 1].aaOrAccess === 'access') {
      const testPermissionsArray = testConfig.testCases[testConfig.testNumber - 1].permissions;
      if (testPermissionsArray.indexOf(resourceName) >= 0) {
        return this.convertPermissions(testPermissionsArray[testPermissionsArray.indexOf(resourceName) + 1]);
      }
    }
    return this.convertPermissions(permissionsInput);
  },
};
