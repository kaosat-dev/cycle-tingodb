
# `tingoDB` object API

- [`makeTingoDBDriver`](#makeTingoDBDriver)

### <a id="makeTingoDBDriver"></a> `makeTingoDBDriver(options)`

TingoDB Driver factory.

This is a function which, when called, returns a TingoDB Driver for Cycle.js
apps. The driver is also a function, and it takes an Observable of queries
as input, and generates a metastream of responses.

**Requests**. The Observable of queries should emit objects. These should be
instructions how tingoDB should execute the queries. 
`query` object properties:

- `collectionName` *(String)*: the name of the collection to manipulate. **required**
- `method` *(String)*: method for the query (insert, find, update, delete).
- `eager` *(Boolean)*: whether or not to execute the query regardless of
  usage of its corresponding response. Default value is `true` (i.e.,
  the query is NOT lazy). Carefull ! if you set it to false, you will not have database insertions,
  updates etc, if there are no observables listening to those operations

Depending on the method, you can have these optional parameters

**insert**
- `data` *(Object)*: an object /array of data to insert into the database

**find**
- `query` *(Object)*: an object with mongo/tingoDB query parameters
- `options` *(Object)*: an object for extra parameters usually you want to use {toArray:true} to
convert outputs to useable arrays

**update**
- `query` *(Object)*: an object with mongo/tingoDB query parameters (what we want to change)
- `update` *(Object)*: an object with mongo/tingoDB update parameters (what we want to change the results to)

**delete**
- `query` *(Object)*: an object with mongo/tingoDB query parameters (what we want to delete)



**Responses**. A metastream is an Observable of Observables. The response
metastream emits Observables of responses. These Observables of responses
have a `query` field attached to them (to the Observable object itself)
indicating which request (from the driver input) generated this response
Observable. 

#### Arguments:

- `options :: Object` an object with settings options that apply globally for all queries processed by the returned TingoDB Driver function. The
options are:
- `eager` *(Boolean)*: execute the TingoDB eagerly, even if its
  response Observable is not subscribed to. Default: **false**.

#### Return:

*(Function)* the TingoDB Driver function

- - -
