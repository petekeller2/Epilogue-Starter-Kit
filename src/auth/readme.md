# Authorization and Authentication

Access to operations on resources is enabled and disabled 
by the code in the epilogueAuth.js file. To learn more about 
permissions, read 
the[permissions section of the resources page.](https://github.com/petekeller2/epilogue-starter-kit/wiki/Resources#Permissions)

If you would like to add a passport strategy that has not been 
implemented, add it to passport.js, update config.js and make 
it available to the users by updating endpoints.js.

Custom milestones are merged with auth milestones 
in epilogueAuth.js.

Twitter is not enabled by default due to it not using 
OAuth 2.0. This can be changed in config.js.