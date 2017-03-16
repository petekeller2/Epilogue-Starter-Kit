export default {
  setup(database, sequelize, name, isGroup) {
    const fields = {
      name: sequelize.STRING,
      population: sequelize.INTEGER,
    };
    if (isGroup) {
      fields.OwnerID = sequelize.STRING;
    }
    return database.define(name, fields);
  },
};
