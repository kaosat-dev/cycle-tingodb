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
    function find(collectionName, ...args){
      //console.log("finding",collectionName, args)
      let argc = args.length
      let options = {}
      let selectors = []

      if (argc === 1 ) //only one argument
      {
        options   = undefined
        selectors = [args[argc-1]] //last arg is options
      }else if(argc > 1){
        options = args[argc-1] //last arg is options
        selectors = args.slice(0,argc-1)//all the rest is what we want to use to find data : selectors, mappers etc
      }

      //console.log("args",args,"len",argc, "options",options,"selectors",selectors)

      let obs = new Rx.Subject()
      let collection = _cachedCollections[collectionName]
      if(!collection){
        collection = db.collection(collectionName)
        //obs.onError(`collection ${collectionName} not found`)
      }
      collection.find(...selectors, function(err, item) {
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

    function update(collectionName, ...args){
      console.log("updating", collectionName, args)
      let argc = args.length
    
      const selectors = args[0]//args.slice(0,argc)//all the rest is what we want to use to find data : selectors, mappers etc
      
      console.log("selectors", selectors)

      let collection = collection = db.collection(collectionName) //_cachedCollections[collectionName]
      let obs = new Rx.Subject()

      if(!collection){
        obs.onError(`collection ${collectionName} not found`)
      }

      collection.update(...selectors, function(err, item){
        if(err){
          obs.onError(err)
        }else{
          obs.onNext(undefined)
        }
      })

      return obs
    }

    function remove(collectionName, ...args){
      //console.log("remove",collectionName, args)
      let argc = args.length
      let options = {}
      let selectors = []

      if (argc === 1 ) //only one argument
      {
        options   = undefined
        selectors = [args[argc-1]] //last arg is options
      }else if(argc > 1){
        options = args[argc-1] //last arg is options
        selectors = args.slice(0,argc-1)//all the rest is what we want to use to find data : selectors, mappers etc
      }

      let collection = collection = db.collection(collectionName) //_cachedCollections[collectionName]
      let obs = new Rx.Subject()

      if(!collection){
        obs.onError(`collection ${collectionName} not found`)
      }else{
        collection.remove(...selectors, function(err, result){
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
      .flatMap(o=>find(o.collectionName,...o.params))

    const updates$ = query$
      .filter(o=>o.method.toLowerCase() === 'update')
      .flatMap(o=>update(o.collectionName, o.params))

    const removes$ = query$
      .filter(o=>o.method.toLowerCase() === 'delete')
      .flatMap(o=>remove(o.collectionName, o.params))

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

        //some need to fire in any case ? ie , insert, update, delete should take place
        //even when not observed
        //NVM : eager does the same ! 
        if(['insert','update','delete'].indexOf(query.method.toLowerCase())>-1 ){
          //response$.forEach(e=>e)
        }

        response$.query = query
       
        return response$
      })
      .replay(null, 1)

    response$$.connect()
    return response$$
  }
}