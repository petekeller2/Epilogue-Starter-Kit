import extension from './extension';
import model from './model';
import milestones from './milestones';

const endpoints = ['/users', '/users/:id'];
const permissions = '--rud|-----|-----|-----';
const isGroup = false;
const autoAssociations = 'Todo';

const exportArray = ['User', permissions, model, endpoints, extension, autoAssociations, isGroup, milestones];

export default exportArray;
