export default {
  setup(database, sequelize, name, isGroup) {
    const fields = {
      task: sequelize.STRING,
      dueDate: sequelize.DATE,
    };
    if (isGroup) {
      fields.OwnerID = sequelize.STRING;
    }
    return database.define(name, fields);
  },
};
