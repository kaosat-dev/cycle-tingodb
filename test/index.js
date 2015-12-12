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
    const out$ = of({collectionName, data})

    tingoDBDriver(out$)
    
    assert.strictEqual( true, fs.existsSync(dbPath) )
    
    done()
  })

  it('has a find function to search for data, optionally converting output to array', function( done ){
    this.timeout(6000)
    const tingoDBDriver = makeTingoDbDriver( dbPath )

    const inData = {
      fieldOne: "some text"
      ,fieldTwo: 27.87
      ,fieldThree: {
        sub:true
      }
    }
    const collectionName = "testCollection"
    const out$ = of({collectionName, data:inData})
    const db = tingoDBDriver(out$)

    const expData = { 
      fieldOne: 'some text',
      fieldTwo: 27.87,
      fieldThree: { sub: true },
      _id: {id:2} }

    db.find("testCollection",{},{toArray:true})
      .filter(data=>data.length === 1)
      .map(data=>data[0]) 
      .forEach(obsData=>{
      
        try {// FIXME: have to use try catch , very annoying, see link on top 
          assert.deepEqual(obsData,expData) 
        } catch(e){ return done(e)}
        done()
      })
  })

  it('can delete documents', function( done ){
    this.timeout(6000)
    const tingoDBDriver = makeTingoDbDriver( dbPath )

    const collectionName = "testCollection"
    const inData = [{data:{name:"joe"},collectionName},{data:{name:"malek"},collectionName}]
  
    const out$ = Rx.Observable.from(inData)
    const db = tingoDBDriver(out$)

    const expData = [{name:"malek"}]

    db.remove("testCollection",{name:"joe"})
      .flatMap(e=>{
        return db.find("testCollection",{},{toArray:true})
      })
      .forEach(obsData=>{
        console.log("obsData",obsData, obsData.length)

        try {// FIXME: have to use try catch , very annoying, see link on top 
          assert.deepEqual(obsData,expData) 
        } catch(e){ return done(e)}

        done()
      })
  })


})

