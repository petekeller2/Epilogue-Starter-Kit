import modelFields from '../../resourcesBuilder/modelFields';

export default {
  setup(database, sequelize, name, isGroup) {
    let fields = {
      id: { type: sequelize.STRING, primaryKey: true },
      username: sequelize.STRING,
      emailAddress: sequelize.STRING,
      profilePicture: sequelize.STRING,
    };
    fields = modelFields.addDefaultFields(fields, sequelize, isGroup);
    return database.define(name, fields);
  },
};
