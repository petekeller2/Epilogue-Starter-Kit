export default {
  setup(database, sequelize, name, isGroup) {
    const fields = {
      id: { type: sequelize.STRING, primaryKey: true },
      username: sequelize.STRING,
      emailAddress: sequelize.STRING,
      profilePicture: sequelize.STRING,
    };
    if (isGroup) {
      fields.OwnerID = sequelize.STRING;
    }
    return database.define(name, fields);
  },
};
