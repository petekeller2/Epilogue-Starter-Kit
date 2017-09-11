# Stats

 .babelrc                                           |    4 +

 .bithoundrc                                        |    5 +

 .codeclimate.yml                                   |   20 +

 .cpd.yaml                                          |   10 +

 .doclets.yml                                       |   17 +

 .gitignore                                         |   55 +

 .gitmodules                                        |    3 +

 .travis.yml                                        |    9 +

 Gemfile                                            |    5 +

 Gemfile.lock                                       |   49 +

 LICENSE                                            |   21 +

 gulpfile.js                                        |  931 +++

 miscWikiPages/Contribution-Guide.md                |   20 +

 miscWikiPages/Home.md                              |    9 +

 miscWikiPages/Stats.md                             |    0

 miscWikiPages/readme.md                            |    7 +

 notes.md                                           |   11 +

 package-lock.json                                  | 7449 ++++++++++++++++++++

 package.json                                       |   77 +

 readme.md                                          |   23 +

 src/.eslintrc.js                                   |   20 +

 src/.flowconfig                                    |    2 +

 src/app.js                                         |   49 +

 src/auth/customMilestones.js                       |   27 +

 src/auth/defaultMilestones.js                      |  434 ++

 src/auth/endpoints.js                              |  109 +

 src/auth/epilogueAuth.js                           |  743 ++

 src/auth/groupPermissions.json                     |    5 +

 src/auth/groups.js                                 |  159 +

 src/auth/passport.js                               |  189 +

 src/auth/readme.md                                 |   23 +

 src/config.js                                      |   74 +

 src/custom/endpoints/placeholder.md                |    1 +

 src/custom/errors/index.js                         |   63 +

 src/custom/readme.md                               |    4 +

 src/custom/sql/queries/placeholder.md              |    1 +

 src/custom/sql/storedFunctions/placeholder.md      |    1 +

 src/epilogueSetup.js                               |  252 +

 src/readme.md                                      |   16 +

 src/resources/Neighborhood/extension.js            |    4 +

 src/resources/Neighborhood/index.js                |   12 +

 src/resources/Neighborhood/milestones.js           |   24 +

 src/resources/Neighborhood/model.js                |   12 +

 src/resources/Todo/extension.js                    |    4 +

 src/resources/Todo/index.js                        |   12 +

 src/resources/Todo/milestones.js                   |   24 +

 src/resources/Todo/model.js                        |   12 +

 src/resources/User/extension.js                    |    4 +

 src/resources/User/index.js                        |   12 +

 src/resources/User/milestones.js                   |   24 +

 src/resources/User/model.js                        |   14 +

 src/resources/index.js                             |    5 +

 src/resources/readme.md                            |  163 +

 src/resourcesBuilder/modelFields.js                |   19 +

 src/resourcesBuilder/readme.md                     |    5 +

 src/resourcesBuilder/resources.json                |    3 +

 src/resourcesBuilder/template/extension.js         |    4 +

 src/resourcesBuilder/template/index.js             |   12 +

 src/resourcesBuilder/template/milestones.js        |   24 +

 src/resourcesBuilder/template/model.js             |   11 +

 src/server.js                                      |  117 +

 src/utilities.js                                   |  137 +

 test/httpTests/autoAssociations/associations.js    |   46 +

 test/httpTests/autoAssociations/readme.md          |    5 +

 test/httpTests/connection.js                       |   19 +

 test/httpTests/permissions/access.js               |  176 +

 test/httpTests/permissions/readme.md               |    5 +

 test/httpTests/readme.md                           |    9 +

 test/mainConfigTest.json                           |  111 +

 test/manualTests/readme.md                         |    8 +

 .../manualTests/tests/3-4-17/Manual Test Cases.csv |   87 +

 .../tests/3-4-17/Manual Test Cases.html            |   39 +

 test/manualTests/tests/3-4-17/notes.md             |    3 +

 test/manualTests/tests/3-4-17/resources/sheet.css  |    1 +

 .../tests/4-16-17/Manual Test Cases.csv            |   16 +

 .../tests/4-16-17/Manual Test Cases.html           |   39 +

 test/manualTests/tests/4-16-17/notes.md            |    3 +

 test/manualTests/tests/4-16-17/resources/sheet.css |    1 +

 .../tests/6-10-17/Manual Test Cases.csv            |   87 +

 .../tests/6-10-17/Manual Test Cases.html           |   39 +

 test/manualTests/tests/6-10-17/notes.md            |    3 +

 test/manualTests/tests/6-10-17/resources/sheet.css |    1 +

 .../manualTests/tests/7-3-17/Manual Test Cases.csv |   87 +

 .../tests/7-3-17/Manual Test Cases.html            |   39 +

 test/manualTests/tests/7-3-17/notes.md             |    3 +

 test/manualTests/tests/7-3-17/resources/sheet.css  |    1 +

 test/readme.md                                     |    4 +

 test/setup/readme.md                               |    8 +

 test/setup/spawnTest.js                            |   16 +

 test/setup/testCases.js                            |  158 +

 test/setup/testData.js                             |   66 +

 test/testConfig.json                               |   87 +

 test/testGroupPermissions.json                     |   12 +

 test/testUserGroups.json                           |    9 +

 test/unitTests/autoAssociations/conversions.js     |  142 +

 .../unitTests/autoAssociations/getResourceNames.js |  142 +

 test/unitTests/failing.js                          |    8 +

 test/unitTests/groups/jsonPermissions.js           |  132 +

 test/unitTests/permissions/conversions.js          |  477 ++

 test/unitTests/readme.md                           |    4 +

 wiki                                               |    1 +

 wikiConfig.json                                    |   17 +

Files: 102

Total Lines of Code: 13666