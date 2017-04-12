
export default {
  /**
   @name milestoneParamObj
   @type Array
   @description names of allowed custom milestone functions to be used by addMilestones
   */
  milestoneParamObj: [],
  /** @function
   * @name addMilestones
   * @param {object} authMilestone
   * @param {Array} actionsList
   * @param {number} i
   * @param {array} resource
   * @param {boolean} isHttpTest
   * @param {boolean} validTestNumber
   * @return object
   * @description Returns all of the allowed custom milestones plus the milestones the function was given
   */
  addMilestones(authMilestone, actionsList, i, resource, isHttpTest, validTestNumber) {
    let authMilestoneReturn = authMilestone;
    this.milestoneParamObj.forEach((milestoneFunctionName) => {
      authMilestoneReturn = this[milestoneFunctionName](authMilestoneReturn, actionsList, i, resource, isHttpTest, validTestNumber);
    });
    return authMilestoneReturn;
  },
};
