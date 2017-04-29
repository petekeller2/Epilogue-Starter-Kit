import extension from './extension';
import model from './model';
import milestones from './milestones';

const endpoints = ['/<your_resource_plural>', '/<your_resource_plural>/:id'];
const permissions = 'lcrud|-----|-----|-----';
const isGroup = false;
const autoAssociations = '';

const exportArray = ['<your_resource>', permissions, model, endpoints, extension, autoAssociations, isGroup, milestones];

export default exportArray;
