'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = makeTingoDbDriver;

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _rx = require('rx');

var _rx2 = _interopRequireDefault(_rx);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

/////////////
var Datastore = require('tingodb')().Db;

function makeTingoDbDriver(dbPath) {
  var db = new Datastore(dbPath, {});

  if (!_fs2.default.existsSync(dbPath)) {
    _fs2.default.mkdirSync(dbPath);
  }

  return function tingoDbDriver(output$) {
    var _cachedCollections = {};

    //output$ = new Rx.Subject() //output TO DB

    function insert(_ref) {
      var collectionName = _ref.collectionName;
      var data = _ref.data;

      //console.log("insert",data)

      var collection = _cachedCollections[collectionName];
      if (!collection) {
        collection = db.collection(collectionName);
        _cachedCollections[collectionName] = collection;
      }
      collection.insert(data, function (err, result) {
        //console.log("insert",data, err,result)
      });
    }

    function findOne(collectionName, selectors) {
      var obs = new _rx2.default.Subject();
      var collection = _cachedCollections[collectionName];
      if (!collection) {
        collection = db.collection(collectionName);
        //obs.onError(`collection ${collectionName} not found`)
      }

      collection.findOne(selectors, function (err, item) {
        //console.log("finding stuff",err,item)
        if (item) {
          obs.onNext(item);
        } else if (err) {
          obs.onError(err);
        }
      });

      return obs;
    }

    //selectors,  options
    function find(collectionName) {
      var _collection;

      for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        args[_key - 1] = arguments[_key];
      }

      var argc = args.length;
      var options = {};
      var selectors = [];

      if (argc === 1) //only one argument
        {
          options = undefined;
          selectors = [args[argc - 1]]; //last arg is options
        } else if (argc > 1) {
          options = args[argc - 1]; //last arg is options
          selectors = args.slice(0, argc - 1); //all the rest is what we want to use to find data : selectors, mappers etc
        }

      //console.log("args",args,"len",argc, "options",options,"selectors",selectors)

      var obs = new _rx2.default.Subject();
      var collection = _cachedCollections[collectionName];
      if (!collection) {
        collection = db.collection(collectionName);
        //obs.onError(`collection ${collectionName} not found`)
      }
      (_collection = collection).find.apply(_collection, _toConsumableArray(selectors).concat([function (err, item) {
        //console.log("finding stuff",err,item, options)
        if (item) {
          if (options.toArray) {
            item.toArray(function (err, res) {
              //console.log("err",err,res)
              if (err) {
                obs.onError(err);
              } else {
                obs.onNext(res);
              }
            });
          } else {
            obs.onNext(item);
          }
        } else if (err) {
          obs.onError(err);
        }
      }]));

      return obs;
    }

    function update(collectionName) {
      var _collection2;

      for (var _len2 = arguments.length, args = Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
        args[_key2 - 1] = arguments[_key2];
      }

      var argc = args.length;
      var options = {};
      var selectors = [];

      options = undefined; //args[argc-1]   //last arg is options
      selectors = args.slice(0, argc); //all the rest is what we want to use to find data : selectors, mappers etc

      var collection = collection = db.collection(collectionName); //_cachedCollections[collectionName]
      var obs = new _rx2.default.Subject();

      if (!collection) {
        obs.onError('collection ' + collectionName + ' not found');
      }

      (_collection2 = collection).update.apply(_collection2, _toConsumableArray(selectors).concat([function (err, item) {
        if (err) {
          obs.onError(err);
        } else {
          obs.onNext(undefined);
        }
      }]));

      return obs;
    }

    function remove(collectionName) {
      var _collection3;

      for (var _len3 = arguments.length, args = Array(_len3 > 1 ? _len3 - 1 : 0), _key3 = 1; _key3 < _len3; _key3++) {
        args[_key3 - 1] = arguments[_key3];
      }

      var argc = args.length;
      var options = {};
      var selectors = [];

      if (argc === 1) //only one argument
        {
          options = undefined;
          selectors = [args[argc - 1]]; //last arg is options
          //console.log("options",options,selectors)
        } else if (argc > 1) {
          options = args[argc - 1]; //last arg is options
          selectors = args.slice(0, argc - 1); //all the rest is what we want to use to find data : selectors, mappers etc
        }

      var collection = collection = db.collection(collectionName); //_cachedCollections[collectionName]
      var obs = new _rx2.default.Subject();

      if (!collection) {
        obs.onError('collection ' + collectionName + ' not found');
      }

      (_collection3 = collection).remove.apply(_collection3, _toConsumableArray(selectors).concat([function (err, result) {
        if (err) {
          obs.onError(err);
        } else {
          obs.onNext(result);
        }
      }]));

      return obs;
    }

    //handle ouputs
    output$.forEach(insert);

    return {
      findOne: findOne,
      find: find,
      update: update,
      remove: remove
    };
  };
}