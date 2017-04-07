
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
   * @param {array} permissions
   * @return object
   * @description Returns all of the allowed custom milestones plus the milestones the function was given
   */
  addMilestones(authMilestone, actionsList, i, resource, isHttpTest, validTestNumber, permissions) {
    this.milestoneParamObj.forEach((milestoneFunctionName) => {
      authMilestone = this[milestoneFunctionName](...Array.from(arguments));
    });
    return authMilestone;
  },
};
