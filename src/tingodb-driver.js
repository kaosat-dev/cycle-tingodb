import fs from 'fs'
import Rx from 'rx'

const {merge, of} = Rx.Observable

/////////////
let Datastore = require('tingodb')().Db

export default function makeTingoDbDriver(dbPath){
  let db = new Datastore(dbPath, {})

  if (!fs.existsSync(dbPath)){
    fs.mkdirSync(dbPath)
  }

  function createResponse(query$)
  {
    let _cachedCollections = {}

    function insert({collectionName, data}){
      let obs = new Rx.Subject()
      //console.log("insert",data)

      let collection = _cachedCollections[collectionName]
      if(!collection){
        collection = db.collection(collectionName)
        _cachedCollections[collectionName] = collection
      }
      collection.insert(data , function(err, result) {
        //console.log("insert",data, err, result)
        obs.onNext(result)
      })
      return obs
    }

  
    function findOne(collectionName, selectors){
      let obs = new Rx.Subject()
      let collection = _cachedCollections[collectionName]
      if(!collection){
        collection = db.collection(collectionName)
        //obs.onError(`collection ${collectionName} not found`)
      }

      collection.findOne(selectors, function(err, item) {
        //console.log("finding stuff",err,item)
        if(item){
          obs.onNext(item)
        }
        else if(err){
          obs.onError(err)
        }
      })
      
      return obs
    }

    //selectors,  options
    function find({collectionName, query=undefined, projection=undefined, options={}}){
      //console.log("finding",collectionName, query, projection, options)
     
      let obs = new Rx.Subject()
      let collection = _cachedCollections[collectionName]
      if(!collection){
        collection = db.collection(collectionName)
        //obs.onError(`collection ${collectionName} not found`)
      }
      collection.find(query, projection, function(err, item) {
        //console.log("finding stuff",err,item, options)
        if(item){
          if(options.toArray){
            item.toArray(function(err,res){
              //console.log("err",err,res)
              if(err){
                obs.onError(err)
              }else{
                obs.onNext(res)
              }
            })
          }else{
            obs.onNext(item)
          }
          
        }
        else if(err){
          obs.onError(err)
        }
      })
      
      return obs
    }

    function update({collectionName, query=undefined, update=undefined, options=undefined}){
      //console.log("updating", collectionName, query, update, options)

      let collection = collection = db.collection(collectionName) //_cachedCollections[collectionName]
      let obs = new Rx.Subject()

      if(!collection){
        obs.onError(`collection ${collectionName} not found`)
      }

      collection.update(query, update, options, function(err, item){
        if(err){
          obs.onError(err)
        }else{
          obs.onNext(undefined)
        }
      })

      return obs
    }

    function remove({collectionName, query=undefined, options=undefined }){
      //console.log("remove", collectionName, query, options)

      let collection = collection = db.collection(collectionName) //_cachedCollections[collectionName]
      let obs = new Rx.Subject()

      if(!collection){
        obs.onError(`collection ${collectionName} not found`)
      }else{
        collection.remove(query, options, function(err, result){
          if(err){
            obs.onError(err)
          }else{
            obs.onNext(result)
          }
        })
      }

      return obs
    }

    query$ = query$.share()
      //.tap(e=>console.log("query",e))

    //handle ouputs
    const inserts$ = query$
      .filter(o=>o.method.toLowerCase() === 'insert')
      .flatMap(insert)

    const reads$ = query$
      .filter(o=>o.method.toLowerCase() === 'find')
      .flatMap(find)

    const updates$ = query$
      .filter(o=>o.method.toLowerCase() === 'update')
      .flatMap(update)

    const removes$ = query$
      .filter(o=>o.method.toLowerCase() === 'delete')
      .flatMap(remove)

    //some need to fire in any case ? ie , insert, update, delete should take place
    //even when not observed

    const results$ =  merge(inserts$, reads$, updates$, removes$)

    return results$

  }

  return function tingoDBDriver(query$, eager=true){
    let response$$ = query$
      .map(query => {
        let response$ = createResponse( of(query) )
        if (eager || query.eager) {
          response$ = response$.replay(null, 1)
          response$.connect()
        }

        response$.query = query
       
        return response$
      })
      .replay(null, 1)

    response$$.connect()
    return response$$
  }
}