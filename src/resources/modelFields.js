export default {
  /** @function
   * @name addDefaultFields
   * @param {object} sequelize
   * @param {object} userDefinedFieldsObj
   * @param {boolean} isGroup
   * @return {object}
   */
  addDefaultFields(userDefinedFieldsObj, sequelize, isGroup) {
    const fields = userDefinedFieldsObj;
    fields.updatedBy = sequelize.STRING;
    if (isGroup) {
      fields.OwnerID = sequelize.STRING;
    }
    return fields;
  },
};
