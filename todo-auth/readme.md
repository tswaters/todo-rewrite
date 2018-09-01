# auth service

auth's job is to take authentication, login and registration requests and validate them against the database.

once validated, a json web token is returned and used until it expires.

you can also send me an expired token and i'll give you back a fresh one.

