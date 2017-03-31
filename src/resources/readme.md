# Resources

The resources folders contain the pieces that will be 
used to create Epilogue resources. All the resources, 
except the UserGroupXref resource, are created based on 
the pieces found in the resources folder. Custom resource 
specific files should be added to its corresponding resource's 
resources folder.

```javascript
// An example resource index.js
import extension from './extension';
import model from './model';
import milestones from './milestones';
 
const endpoints = ['/todos', '/todos/:id'];
const permissions = 'lcrud|-----|-----|-----';
const isGroup = false;
const autoAssociations = '';
 
const exportArray = ['Todo', permissions, model, endpoints, extension, autoAssociations, isGroup, milestones];
 
export default exportArray;
```

## Milestones

By default, milestones will be generated for a resource in 
epilogueAuth.js for handling user access to resources and 
non-standard effects of their operations (For example: Owning 
an instance of a resources as a group or user after creating 
it). The milestones.js code in resource folders is for resource specific milestone code. 
This custom milestone code will be merged with the built
in milestones when the resources' milestones are add to the 
resources.

## Extensions

Extensions are combined with a resource's model and endpoints 
to create a temporary resource object that will used to form 
an Epilogue resource. Resource properties that don't belong in 
the model or the endpoints, like `associations: true`, should 
be put in the resource folder's extension.js file.

## Resource Array

An example of a resource array: 

```javascript
const exportArray = ['Todo', permissions, model, endpoints, extension, autoAssociations, isGroup, milestones];
```

There are 8 elements to the resource array, with their purpose 
being implied by their names in the example above. Order 
matters and if you want to leave an element blank, replace it 
with a falsy element rather than leaving it out altogether.

## Exporting the Arrays

This is a work in progress. Currently, you need to manually 
add import lines and add them to the export array to the 
index.js file at the root of the resources folder. This will 
be automated in later versions.

## Auto Associations

Auto Associations in Epilogue Starter Kit are the same Auto 
Associations that are found in Epilogue.
What is unique is how they are assigned to resources. The 
default auto association is hasMany. There can be associations 
without auto associations. They are the 6th element 
of the exported resource array. This element will be converted 
to a standard Auto Association format.

#### Format

* String, array, object or boolean
* The preferred format is the array of objects format
* Array styles can be mixed
* Though false is acceptable, '' should be used instead if you don't
  want to create an auto-association on that resource. This is because
  an auto-association with that resource could be on another resource,
  making false misleading.

**Examples:**

```javascript
'' => []
false => []
'Cake' => [{ hasMany: 'Cake' }]
'Cake,Soda' => [{ hasMany: 'Cake' }, { hasMany: 'Soda' }]
'Cake|Soda' => [{ hasMany: 'Cake' }, { hasMany: 'Soda' }]
{ hasMany: 'Cake' } => [{ hasMany: 'Cake' }]
['Cake', 'Soda'] => [{ hasMany: 'Cake' }, { hasMany: 'Soda' }]
[{ hasMany: 'Cake' }, { belongsTo: 'Soda' }] => [{ hasMany: 'Cake' }, { belongsTo: 'Soda' }]
['Cake', { belongsTo: 'Soda' }] => [{ hasMany: 'Cake' }, { belongsTo: 'Soda' }]
```

## Permissions

Permissions are used to determine what operations are 
available for certain users. The operation are the Epilogue 
resource operations (List, Create, Read, Update and Delete). 
The types of users are owners of the resource (the user who 
created the resource), members of a group resource, any non-guest 
users and all users. Permissions are similar to auto 
associations in that there are multiple formats that can be 
used to set them up for a resource.

#### Format

* String, array, number or object
* The preferred format is the string | deliminator - for 
disallowed format
* For numbers, the list and read bit are the same. This was 
done to make hex format more readable.

**Examples:**

```javascript
[] => [false, ..., false]
0xFFFF => [true, ..., true]
'lcrudlcrudlcrudlcrud' => [true, ..., true]
'lcrud|lcrud|lcrud|lcrud' => [true, ..., true]
'l-rud|lcrud|lcrud|lcrud' => [true, false, true, true, ..., true]
'lrud|lcrud|lcrud|lcrud' => [true, false, true, true, ..., true]
{owner: ['l', 'c', 'r']} => [true, true, true, false, false, ..., false]
[true, ..., true] => [true, ..., true]
// See test/tests/permissions/conversions.js for
// more examples of valid permissions formats
```

#### Note

The enabled bits in `-c---|-c---|----|-----` currently do not 
have a purpose. They will be given a purpose in a future version.

## Groups

Groups are a work in progress. Groups and users are linked 
through the userGroupXrefs resource. Setting group permissions 
on a non group resource can be done, but should not affect
the resource. Users can have many groups through group xrefs.

## Creating New Resources

Currently, the way to create more resources is by creating a new 
folder with the required files in the resources folder and adding 
the relevant information to the resources folder's index.js 
file. The best way of doing this would be to copy an existing 
resources folder. A better method for creating new resources 
will be implemented in a future version.
