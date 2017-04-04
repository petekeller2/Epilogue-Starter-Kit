import merge from 'deepmerge';
import epilogueAuth from './epilogueAuth';

export default {
  ownResource(totalAuthMilestone, actionsList, i, isGroup, aa, name, userAAs) {
    if (actionsList[i] === 'create') {
      const authMilestone = {};
      authMilestone[actionsList[i]] = {};
      authMilestone[actionsList[i]].write = {};
      // eslint-disable-next-line
      authMilestone[actionsList[i]].write.before = ((req, res, context) => new Promise(async (resolve) => {
        if (isGroup === true) {
          if (((req || {}).body) && ((req || {}).user || {}).id) {
            // eslint-disable-next-line
            req.body.OwnerID = req.user.id;
          }
        }
        if ((userAAs.indexOf(name) >= 0) || (epilogueAuth.belongsToUserResourceCheck(aa))) {
          if (((req || {}).body) && ((req || {}).user || {}).id) {
            // eslint-disable-next-line
            req.body.UserId = req.user.id;
          }
        }
        resolve(context.continue);
      }));
      return merge(authMilestone, totalAuthMilestone);
    }
    return totalAuthMilestone;
  },
  listOwned() {

  },
};
