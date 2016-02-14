## cycle-tingoDB-driver

[![GitHub version](https://badge.fury.io/gh/kaosat-dev%2Fcycle-tingodb-driver.svg)](https://badge.fury.io/gh/kaosat-dev%2Fcycle-tingodb-driver)

A [tingoDB](http://www.tingodb.com/) driver for cycle.js


##Notes:

- for **server side** use only !


##Using:


#### Setup:

```js
let drivers = {
  db      : makeTingoDbDriver("path/to/my/database")
}

Cycle.run(main, drivers)
```

#### In action:

```js
  
  function main(sources) {  

    sources.db
      .filter(res$ => res$.query.method === 'find' && id===72 )// we wanted to find something in the database, and the query had id 72
      .mergeAll() // flattens the metastream
      .forEach(function(result){
        console.log("query result",result)// 
      })
    
    //Use this type of query to insert data {method:'insert', collectionName:"testCollection", data: {foo:42,bar:"someText"} }

    const dbQueries$  = Rx.Observable.interval(1000)
      .map(() => {//get data from database
        return {method:'find', id:72, collectionName:"testCollection", query:{foo:42}, options:{toArray:true} }
      })
   
    return {
      db: db$
    }
  }
```
For a more advanced usage, check the [tests](https://github.com/kaosat-dev/cycle-tingodb/blob/make-cyclic/test/index.js) and the [documentation](https://github.com/kaosat-dev/cycle-tingodb/blob/master/docs/api.md).


## LICENSE

[The MIT License (MIT)](https://github.com/kaosat-dev/cycle-tingodb-driver/blob/master/LICENSE)

- - -

[![experimental](http://badges.github.io/stability-badges/dist/experimental.svg)](http://github.com/badges/stability-badges)
[![Build Status](https://travis-ci.org/kaosat-dev/cycle-tingodb-driver.svg)](https://travis-ci.org/kaosat-dev/cycle-tingodb-driver)
[![Dependency Status](https://david-dm.org/kaosat-dev/cycle-tingodb-driver.svg)](https://david-dm.org/kaosat-dev/cycle-tingodb-driver)
[![devDependency Status](https://david-dm.org/kaosat-dev/cycle-tingodb-driver/dev-status.svg)](https://david-dm.org/kaosat-dev/cycle-tingodb-driver#info=devDependencies)