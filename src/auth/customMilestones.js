
export default {
  // todo: jsdoc
  milestoneParamObj: [],
  addMilestones() {
    this.milestoneParamObj.forEach((milestoneFunctionName) => {
      arguments[0] = this[milestoneFunctionName](...Array.from(arguments));
    });
    return arguments[0];
  },
};
