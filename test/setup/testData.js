export default {
  /** @function
   * @name basicTestData
   * @param {map} resourcesFromSetup - Created in epilogueSetup.js
   * @param {object} groupXrefModel - Created in epilogueSetup.js
   * @returns {boolean}
   * @description Populates the database with test data
   */
  async basicTestData(resourcesFromSetup, groupXrefModel) {
    const awaitedResourcesFromSetup = await resourcesFromSetup;

    const userList = [
      {
        id: '12345', username: 'mike', emailAddress: 'mike@gmail.com',
      },
      {
        id: 'testing', username: 'bob', emailAddress: 'bob@gmail.com',
      },
      {
        id: 'abc123', username: 'gary', emailAddress: 'gary@gmail.com',
      },
    ];

    const userModel = awaitedResourcesFromSetup.get('User')[2];
    userModel.bulkCreate(userList);

    const todoList = [
      {
        id: 1, task: 'wake up', UserId: 'abc123', dueDate: '12/17/17',
      },
      {
        id: 2, task: 'sleep', UserId: '12345', dueDate: '12/18/17',
      },
      {
        id: 3, task: 'gym', dueDate: '12/19/17',
      },
    ];

    const todoModel = awaitedResourcesFromSetup.get('Todo')[2];
    todoModel.bulkCreate(todoList);

    const neighborhoodList = [
      {
        id: 1, name: 'city', population: '1300', OwnerID: 'abc123',
      },
      {
        id: 2, name: 'town', population: '50', OwnerID: null,
      },
    ];

    const neighborhoodModel = awaitedResourcesFromSetup.get('Neighborhood')[2];
    neighborhoodModel.bulkCreate(neighborhoodList);

    const userGroupXrefList = [
      {
        id: 1, UserId: 'abc123', groupID: 1, groupResourceName: 'Neighborhood', groupName: 'NYC',
      },
      {
        id: 2, UserId: 'testing', groupID: 1, groupResourceName: 'Neighborhood', groupName: 'NYC',
      },
      {
        id: 3, UserId: 'testing', groupID: 2, groupResourceName: 'Neighborhood', groupName: 'Sleepy Hollow',
      },
    ];

    const userGroupXrefModel = await groupXrefModel;
    userGroupXrefModel.bulkCreate(userGroupXrefList);

    // test if data was populated
    const foundUser = await userModel.findOne({
      attributes: ['id'],
      where: { id: 'testing' },
    });
    const foundTodo = await todoModel.findOne({
      attributes: ['task'],
      where: { task: 'sleep' },
    });
    const foundNeighborhood = await neighborhoodModel.findOne({
      attributes: ['name'],
      where: { name: 'city' },
    });
    const foundUserGroupXref = await userGroupXrefModel.findOne({
      attributes: ['id'],
      where: { id: 2 },
    });
    return Boolean(foundUser && foundTodo && foundNeighborhood && foundUserGroupXref);
  },
};
