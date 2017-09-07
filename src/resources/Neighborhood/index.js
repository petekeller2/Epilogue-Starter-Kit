import extension from './extension';
import model from './model';
import milestones from './milestones';

const endpoints = ['/neighborhoods', '/neighborhoods/:id'];
const permissions = 'lcrud|-----|-----|-----';
const isGroup = true;
const autoAssociations = 'Todo';

const exportArray = ['Neighborhood', permissions, model, endpoints, extension, autoAssociations, isGroup, milestones];

export default exportArray;
