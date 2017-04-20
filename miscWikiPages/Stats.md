# Stats

 .babelrc                                           |   4 +

 .codeclimate.yml                                   |  20 +

 .doclets.yml                                       |  17 +

 .gitignore                                         |  52 ++

 .gitmodules                                        |   3 +

 .travis.yml                                        |  10 +

 LICENSE                                            |  21 +

 gulpfile.js                                        | 538 ++++++++++++++++

 miscWikiPages/Contribution-Guide.md                |  19 +

 miscWikiPages/Home.md                              |   9 +

 miscWikiPages/Stats.md                             |   0

 miscWikiPages/readme.md                            |   7 +

 notes.md                                           |   3 +

 package.json                                       |  67 ++

 readme.md                                          |  25 +

 src/.eslintrc.js                                   |  17 +

 src/app.js                                         |  48 ++

 src/auth/customMilestones.js                       |  27 +

 src/auth/defaultMilestones.js                      | 219 +++++++

 src/auth/endpoints.js                              | 108 ++++

 src/auth/epilogueAuth.js                           | 717 +++++++++++++++++++++

 src/auth/groupPermissions.json                     |   5 +

 src/auth/groups.js                                 |   0

 src/auth/passport.js                               | 189 ++++++

 src/auth/readme.md                                 |  23 +

 src/config.js                                      |  69 ++

 src/custom/endpoints/placeholder.md                |   1 +

 src/custom/errors/index.js                         |  63 ++

 src/custom/sql/queries/placeholder.md              |   1 +

 src/custom/sql/storedFunctions/placeholder.md      |   1 +

 src/epilogueSetup.js                               | 237 +++++++

 src/resources/Neighborhood/extension.js            |   4 +

 src/resources/Neighborhood/index.js                |  12 +

 src/resources/Neighborhood/milestones.js           |  24 +

 src/resources/Neighborhood/model.js                |  12 +

 src/resources/Todo/extension.js                    |   4 +

 src/resources/Todo/index.js                        |  12 +

 src/resources/Todo/milestones.js                   |  24 +

 src/resources/Todo/model.js                        |  12 +

 src/resources/User/extension.js                    |   4 +

 src/resources/User/index.js                        |  12 +

 src/resources/User/milestones.js                   |  24 +

 src/resources/User/model.js                        |  14 +

 src/resources/index.js                             |   9 +

 src/resources/libraries/todo.md                    |   1 +

 src/resources/modelFields.js                       |  17 +

 src/resources/readme.md                            | 156 +++++

 src/resources/resourceGenerator.js                 |   1 +

 src/resources/resources.json                       |   3 +

 src/server.js                                      | 116 ++++

 src/socket.io/todo.md                              |   1 +

 src/utilities.js                                   | 118 ++++

 test/httpTests/autoAssociations/associations.js    |  46 ++

 test/httpTests/autoAssociations/readme.md          |   5 +

 test/httpTests/connection.js                       |  19 +

 test/httpTests/permissions/access.js               | 176 +++++

 test/httpTests/permissions/readme.md               |   5 +

 test/manualTests/readme.md                         |   8 +

 .../manualTests/tests/3-4-17/Manual Test Cases.csv |  87 +++

 .../tests/3-4-17/Manual Test Cases.html            |  39 ++

 test/manualTests/tests/3-4-17/notes.md             |   3 +

 test/manualTests/tests/3-4-17/resources/sheet.css  |   1 +

 .../tests/4-16-17/Manual Test Cases.csv            |  16 +

 .../tests/4-16-17/Manual Test Cases.html           |  39 ++

 test/manualTests/tests/4-16-17/notes.md            |   3 +

 test/manualTests/tests/4-16-17/resources/sheet.css |   1 +

 test/readme.md                                     |   6 +

 test/setup/readme.md                               |   8 +

 test/setup/spawnTest.js                            |  16 +

 test/setup/testCases.js                            | 158 +++++

 test/setup/testData.js                             |  66 ++

 test/testConfig.json                               |  87 +++

 test/testGroupPermissions.json                     |   5 +

 test/tests/autoAssociations/conversions.js         | 142 ++++

 test/tests/autoAssociations/getResourceNames.js    | 142 ++++

 test/tests/permissions/conversions.js              | 393 +++++++++++

 wiki                                               |   1 +

 wikiConfig.json                                    |  17 +

Files: 78

Total Lines of Code: 4589