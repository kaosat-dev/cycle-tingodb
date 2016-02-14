import assert from 'assert'
import path from 'path'
import fs from 'fs'
import Rx from 'rx'
const of = Rx.Observable.of
const never = Rx.Observable.never
import rmdirSync from './utils'

import makeTingoDbDriver from '../src/tingodb-driver'

//some very annoying issues with mocha , see here : https://www.bountysource.com/issues/1401310-mocha-times-out-when-tests-fail-reports-nothing

describe("tingoDB-driver", function() {
  
  const dbPath = path.join(__dirname, 'dbTest')

  afterEach(()=> {
    //remove test db folder
    rmdirSync(dbPath)    
  })


  it('should write input data to db ', (done) => {
    
    const tingoDBDriver = makeTingoDbDriver( dbPath )

    const data = {
      fieldOne: "some text"
      ,fieldTwo: 27.87
      ,fieldThree: {
        sub:true
      }
    }
    const collectionName = "testCollection"
    const out$ = of({method:'insert', collectionName, data})

    tingoDBDriver(out$)
    
    assert.strictEqual( true, fs.existsSync(dbPath) )
    
    done()
  })

  it('enables you to search for data, optionally converting output to array', function( done ){
    this.timeout(6000)
    const tingoDBDriver = makeTingoDbDriver( dbPath )

    const inData = {
      fieldOne: "some text"
      ,fieldTwo: 27.87
      ,fieldThree: {
        sub:true
      }
    }
    const expData = { 
      fieldOne: 'some text',
      fieldTwo: 27.87,
      fieldThree: { sub: true },
      _id: {"id": 2} }

    const collectionName = "testCollection"
    const queries$       = new Rx.Subject()
    const db = tingoDBDriver(queries$)

    /*db.forEach(function(e){
      console.log("driver output",e)
      e.forEach(f=>console.log("bla",f))
    })*/

    /*db
      .filter(res$ => res$.query.method === 'insert')
      .mergeAll()
      .forEach(e=>console.log("insert",e))*/

    db
      .filter(res$ => res$.query.method === 'find')
      .mergeAll()
      .filter(data=>data.length>0)
      .map(data=>data[0])
      .forEach(function(obsData){
        try {// FIXME: have to use try catch , very annoying, see link on top 
          //console.log("obsData",obsData,"expData",expData)
          assert.deepEqual(obsData,expData) 
        } catch(e){ return done(e)}
        done()
      })

    queries$.onNext({method:'insert', collectionName, data:inData, eager:true})
    queries$.onNext({method:'find'  , collectionName, query:{}, options:{toArray:true} })
  })

  it('can update documents', function( done ){
    this.timeout(6000)
    const tingoDBDriver = makeTingoDbDriver( dbPath )

    const collectionName = "testCollection"
    const inData  = [{name:"joe"}]
    const expData = [{name:"malek",age:28, _id: {id:2} }]
  
    const queries$       = new Rx.Subject()
    const db = tingoDBDriver(queries$)

    db
      .filter(res$ => res$.query.method === 'find')
      .mergeAll()
      .forEach(function(obsData){
        try {// FIXME: have to use try catch , very annoying, see link on top 
          //console.log("obsData",obsData,"expData",expData)
          assert.deepEqual(obsData,expData) 
        } catch(e){ return done(e)}
        done()
      })

    queries$.onNext({method:'insert', collectionName, data:inData})
    queries$.onNext({method:'update', collectionName, query:{name:"joe"}, update:{name:"malek",age:28} })
    queries$.onNext({method:'find'  , collectionName, query:{}, options:{toArray:true} })

  })

  it('can delete documents', function( done ){
    this.timeout(6000)
    const tingoDBDriver = makeTingoDbDriver( dbPath )

    const collectionName = "testCollection"
    const inData         = [{name:"joe",foo:0},{name:"malek",foo:2}]
    const expData        = [{name:"malek",foo:2,_id:{id:3}}]

    const queries$       = new Rx.Subject()
    const db             = tingoDBDriver(queries$)

    db
      .filter(res$ => res$.query.method === 'find')
      .mergeAll()
      .forEach(function(obsData){
        try {// FIXME: have to use try catch , very annoying, see link on top 
          assert.deepEqual(obsData,expData) 
        } catch(e){ return done(e)}
        done()
      })

    queries$.onNext({method:'insert', collectionName, data:inData})
    queries$.onNext({method:'delete', collectionName, query:{name:"joe"} })
    queries$.onNext({method:'find'  , collectionName, query:{}, options:{toArray:true} })

  })

  
})

