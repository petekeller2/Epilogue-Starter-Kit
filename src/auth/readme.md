# Authorization and Authentication

Access to operations on resources is enabled and disabled 
by the code in the epilogueAuth.js file. To learn more about 
permissions, read 
the [permissions section of the resources page.](https://github.com/petekeller2/epilogue-starter-kit/wiki/Resources#Permissions)

If you would like to add a passport strategy that has not been 
implemented, add it to passport.js, update config.js and make 
it available to the users by updating endpoints.js.

Custom milestones from the resources folder are merged with 
auth milestones in epilogueAuth.js. Custom milestones for 
many resources should be put into customMilestones.js and 
custom milestones for one resource should be put in the 
milestones.js file in its folder.


Twitter is not enabled by default due to it not using 
OAuth 2.0. This can be changed in config.js.

The main programs in the src/auth folder are endpoints.js, 
epilogueAuth.js and passport.js.