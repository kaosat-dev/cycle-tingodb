'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = makeTingoDBDriver;

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _rx = require('rx');

var _rx2 = _interopRequireDefault(_rx);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var _Rx$Observable = _rx2.default.Observable;
var merge = _Rx$Observable.merge;
var of = _Rx$Observable.of;

/////////////

var Datastore = require('tingodb')().Db;

function makeTingoDBDriver(dbPath) {
  var db = new Datastore(dbPath, {});

  if (!_fs2.default.existsSync(dbPath)) {
    _fs2.default.mkdirSync(dbPath);
  }

  function createResponse(query$) {
    var _cachedCollections = {};

    function insert(_ref) {
      var collectionName = _ref.collectionName;
      var data = _ref.data;

      var obs = new _rx2.default.Subject();
      //console.log("insert",data)

      var collection = _cachedCollections[collectionName];
      if (!collection) {
        collection = db.collection(collectionName);
        _cachedCollections[collectionName] = collection;
      }
      collection.insert(data, function (err, result) {
        //console.log("insert",data, err, result)
        obs.onNext(result);
      });
      return obs;
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
    function find(_ref2) {
      var collectionName = _ref2.collectionName;
      var _ref2$query = _ref2.query;
      var query = _ref2$query === undefined ? undefined : _ref2$query;
      var _ref2$projection = _ref2.projection;
      var projection = _ref2$projection === undefined ? undefined : _ref2$projection;
      var _ref2$options = _ref2.options;
      var options = _ref2$options === undefined ? {} : _ref2$options;

      //console.log("finding",collectionName, query, projection, options)

      var obs = new _rx2.default.Subject();
      var collection = _cachedCollections[collectionName];
      if (!collection) {
        collection = db.collection(collectionName);
        //obs.onError(`collection ${collectionName} not found`)
      }
      collection.find(query, projection, function (err, item) {
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
      });

      return obs;
    }

    function update(_ref3) {
      var collectionName = _ref3.collectionName;
      var _ref3$query = _ref3.query;
      var query = _ref3$query === undefined ? undefined : _ref3$query;
      var _ref3$update = _ref3.update;
      var update = _ref3$update === undefined ? undefined : _ref3$update;
      var _ref3$options = _ref3.options;
      var options = _ref3$options === undefined ? undefined : _ref3$options;

      //console.log("updating", collectionName, query, update, options)

      var collection = collection = db.collection(collectionName); //_cachedCollections[collectionName]
      var obs = new _rx2.default.Subject();

      if (!collection) {
        obs.onError('collection ' + collectionName + ' not found');
      }

      collection.update(query, update, options, function (err, item) {
        if (err) {
          obs.onError(err);
        } else {
          obs.onNext(undefined);
        }
      });

      return obs;
    }

    function remove(_ref4) {
      var collectionName = _ref4.collectionName;
      var _ref4$query = _ref4.query;
      var query = _ref4$query === undefined ? undefined : _ref4$query;
      var _ref4$options = _ref4.options;
      var options = _ref4$options === undefined ? undefined : _ref4$options;

      //console.log("remove", collectionName, query, options)

      var collection = collection = db.collection(collectionName); //_cachedCollections[collectionName]
      var obs = new _rx2.default.Subject();

      if (!collection) {
        obs.onError('collection ' + collectionName + ' not found');
      } else {
        collection.remove(query, options, function (err, result) {
          if (err) {
            obs.onError(err);
          } else {
            obs.onNext(result);
          }
        });
      }

      return obs;
    }

    query$ = query$.share();
    //.tap(e=>console.log("query",e))

    //handle ouputs
    var inserts$ = query$.filter(function (o) {
      return o.method.toLowerCase() === 'insert';
    }).flatMap(insert);

    var reads$ = query$.filter(function (o) {
      return o.method.toLowerCase() === 'find';
    }).flatMap(find);

    var updates$ = query$.filter(function (o) {
      return o.method.toLowerCase() === 'update';
    }).flatMap(update);

    var removes$ = query$.filter(function (o) {
      return o.method.toLowerCase() === 'delete';
    }).flatMap(remove);

    //some need to fire in any case ? ie , insert, update, delete should take place
    //even when not observed

    var results$ = merge(inserts$, reads$, updates$, removes$);

    return results$;
  }

  return function tingoDBDriver(query$) {
    var eager = arguments.length <= 1 || arguments[1] === undefined ? true : arguments[1];

    var response$$ = query$.map(function (query) {
      var response$ = createResponse(of(query));
      if (eager || query.eager) {
        response$ = response$.replay(null, 1);
        response$.connect();
      }

      response$.query = query;

      return response$;
    }).replay(null, 1);

    response$$.connect();
    return response$$;
  };
}