# localization service

localization's job is to respond to update requests from the ui

when we receive an update request, we'll:

- persist it to the database

- fire a fanout message to all interested consumers

this way, consumers have up-to-date keys.
