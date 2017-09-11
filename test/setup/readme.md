# Tests Setup

The test data set up in test/setup are for the HTTP tests. 
Tests in test/unitTests do not make use of this test data. The 
test data created is dependant on the existence of certain 
resources. The aaTests function call in generateTestCases is 
commented out in testCases.js due to HTTP tests being 
incomplete for Auto Associations.