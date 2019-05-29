# Routers & Unit Tests: Mongoose & Mocha+Chai

## Routers and unit tests for a since abandoned app idea.

This single MongoDB database contains several collections that are linked together through ID references.

The itinerary collection contains references to its connected documents within the activity, lodging and travel collections (as well as as a reference to the user). For example, an itinerary document created for a particular trip will have a reference to flight information that is stored separately in the travel collection and hotel information stored in the lodging collection.

The user collection contains a reference to all itinerary documents authored, in addition to user information.

The unit tests ensure that not only are the endpoints/routes correctly handling database requests and responses, but that the creation, modification and deletion of any document is correctly updating/not adversely affecting any of its connected documents in other collections.