import modelFields from '../../resourcesBuilder/modelFields';

export default {
  setup(database, sequelize, name, isGroup) {
    let fields = {
      '<field_name>': sequelize.FIELD_TYPE,'<NEXT_NAME>': sequelize.NEXT_TYPE,
    };
    fields = modelFields.addDefaultFields(fields, sequelize, isGroup);
    return database.define(name, fields);
  },
};
