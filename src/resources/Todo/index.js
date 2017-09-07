import extension from './extension';
import model from './model';
import milestones from './milestones';

const endpoints = ['/todos', '/todos/:id'];
const permissions = 'lcrud|-----|lcrud|lcrud';
const isGroup = false;
const autoAssociations = '';

const exportArray = ['Todo', permissions, model, endpoints, extension, autoAssociations, isGroup, milestones];

export default exportArray;
