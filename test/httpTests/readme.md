# HTTP Tests

You can run HTTP tests directly through `server-http-test`, 
`server-http-just-aa-test` or `server-http-just-access-test`.

HTTP tests can be run indirectly through `gulp test-staging-server` 
and `gulp test-server`.

Note that HTTP tests will uses information found in the main
configuration file (`src/config.js`).

Run `gulp reset-test-config` if tests hang.