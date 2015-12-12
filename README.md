## cycle-tingoDB-driver

[![GitHub version](https://badge.fury.io/gh/kaosat-dev%2Fcycle-tingodb-driver.svg)](https://badge.fury.io/gh/kaosat-dev%2Fcycle-tingodb-driver)

A [tingoDB](http://www.tingodb.com/) driver for cycle.js


##Notes:

- for server side use
- work in progress , use at your own risk !

##Using:


  ###Setup:

          let drivers = {
            db      : makeTingoDbDriver("path/to/my/database")
          }

          Cycle.run(main, drivers)

  ###In action:

          function db(){
            const inData = {
              data: {foo:42,bar:"someText"}
              ,collectionName:"testCollection"
            }

            const out$ = of(inData)
            return out$
          }

          function main(drivers) {  

            //get data from database

            db.find("testCollection",{foo:42},{toArray:true})
              .forEach(data=>{
                console.log("find results",data)
              })

            //output to database
            const db$       = db()
           
            return {
              db: db$
            }
          }


  Or without the cycle.js boilerplate

          const dbPath = "path/to/my/database"
          const tingoDBDriver = makeTingoDbDriver( dbPath )

          const inData = {
            data: {foo:42,bar:"someText"}
            ,collectionName:"testCollection"
          }

          const out$ = of(inData)
          const db = tingoDBDriver(out$)



## LICENSE

[The MIT License (MIT)](https://github.com/kaosat-dev/cycle-tingodb-driver/blob/master/LICENSE)

- - -

[![experimental](http://badges.github.io/stability-badges/dist/experimental.svg)](http://github.com/badges/stability-badges)
[![Build Status](https://travis-ci.org/kaosat-dev/cycle-tingodb-driver.svg)](https://travis-ci.org/kaosat-dev/cycle-tingodb-driver)
[![Dependency Status](https://david-dm.org/kaosat-dev/cycle-tingodb-driver.svg)](https://david-dm.org/kaosat-dev/cycle-tingodb-driver)
[![devDependency Status](https://david-dm.org/kaosat-dev/cycle-tingodb-driver/dev-status.svg)](https://david-dm.org/kaosat-dev/cycle-tingodb-driver#info=devDependencies)