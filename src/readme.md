# Directory Structure of src

- **auth/** - Authorization and authentication related code. The 
last steps of resource creation take place here (Auth milestones 
are added to existing but incomplete resources)
- **custom/** - Code that doesn't fit in the other directories should 
be put in the custom directory. The directories in here are just 
suggestions, with the except of errors.
- **resources/** - New resource directories will be placed in this directory. 
The contents of these directories will be used by 
/src/epilogueSetup.js to begin resource creation. You can 
overwrite the contents of this directory without fear of the 
updates being overwritten by a gulp command.
- **resourcesBuilder/** - Used by `gulp new-resource` to create 
new resource directories. Edit the files here if you want `gulp new-resource` 
to generate different resource directories.