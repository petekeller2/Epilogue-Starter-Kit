import modelFields from '../modelFields';

export default {
  setup(database, sequelize, name, isGroup) {
    let fields = {
      '<field_name>': sequelize.FIELD_TYPE,
    };
    fields = modelFields.addDefaultFields(fields, sequelize, isGroup);
    return database.define(name, fields);
  },
};
