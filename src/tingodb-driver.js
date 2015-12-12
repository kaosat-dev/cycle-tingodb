import fs from 'fs'
import Rx from 'rx'

/////////////
let Datastore = require('tingodb')().Db

export default function makeTingoDbDriver(dbPath){
  let db = new Datastore(dbPath, {})

  if (!fs.existsSync(dbPath)){
    fs.mkdirSync(dbPath)
  }

  return function tingoDbDriver(output$)
  {
    let _cachedCollections = {}

    //output$ = new Rx.Subject() //output TO DB 

    function insert({collectionName, data}){
      console.log("insert",data)

      let collection = _cachedCollections[collectionName]
      if(!collection){
        collection = db.collection(collectionName)
        _cachedCollections[collectionName] = collection
      }
      collection.insert(data , function(err, result) {
        //console.log("insert",data, err,result)
      })
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
      let argc = args.length
      let options = {}
      let selectors = []

      if (argc === 1 ) //only one argument
      {
        options   = undefined
        selectors = args[argc-1] //last arg is options
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
      let argc = args.length
      let options = {}
      let selectors = []

  
      options = undefined//args[argc-1]   //last arg is options
      selectors = args.slice(0,argc)//all the rest is what we want to use to find data : selectors, mappers etc
      

      let collection = collection = db.collection(collectionName) //_cachedCollections[collectionName]
      let obs = new Rx.Subject()

      if(!collection){
        obs.onError(`collection ${collectionName} not found`)
      }

      console.log("update",selectors)
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
      let argc = args.length
      let options = {}
      let selectors = []

      if (argc === 1 ) //only one argument
      {
        options   = undefined
        selectors = args[argc-1] //last arg is options
        console.log("options",options,selectors)

      }else if(argc > 1){
        options = args[argc-1] //last arg is options
        selectors = args.slice(0,argc-1)//all the rest is what we want to use to find data : selectors, mappers etc
      }

      let collection = collection = db.collection(collectionName) //_cachedCollections[collectionName]
      let obs = new Rx.Subject()

      if(!collection){
        obs.onError(`collection ${collectionName} not found`)
      }

      console.log("remove",selectors)
      collection.remove(...selectors, function(err, item){
        if(err){
          obs.onError(err)
        }else{
          obs.onNext(undefined)
        }
      })

      return obs
    }




    //handle ouputs
    output$
      .forEach(insert)

    return {
      findOne
      ,find
      ,update
      ,remove
    }
  }
}
