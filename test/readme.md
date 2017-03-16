#Tests
HTTP Tests are a work in progress. They can be enabled by 
changing testConfig.json (set doHttpTests to true).

The main gulp test tasks are `gulp env-staging-server` and `gulp env-test-server`.
 Look at gulpfile.js to see the other gulp tasks.
 
You many need to run `gulp reset-test-config` if tests hang.