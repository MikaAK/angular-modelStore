"use strict";

var _slicedToArray = function (arr, i) {
  if (Array.isArray(arr)) {
    return arr;
  } else {
    var _arr = [];

    for (var _iterator = arr[Symbol.iterator](), _step; !(_step = _iterator.next()).done;) {
      _arr.push(_step.value);

      if (i && _arr.length === i) break;
    }

    return _arr;
  }
};

var _defineProperty = function (obj, key, value) {
  return Object.defineProperty(obj, key, {
    value: value,
    enumerable: true,
    configurable: true,
    writable: true
  });
};

var _prototypeProperties = function (child, staticProps, instanceProps) {
  if (staticProps) Object.defineProperties(child, staticProps);
  if (instanceProps) Object.defineProperties(child.prototype, instanceProps);
};

angular.module("angular-store", []).service("Store", ["$rootScope", "$interval", function ($rootScope, $interval) {
  var modelCache = {};

  return (function () {
    // ~~~~DO NOT OVERLOAD!!!~~~~
    // Store Constructor
    function Store(storeName) {
      var model;
      // Check for modelName or assign anonId
      this._className = storeName;

      // Return the model if already exists
      if (model = modelCache[this.modelCacheId()]) return model._filterFunctions();

      // Setup array for users listening to model
      this._usersListening = [];


      // Set up Object.observe so we can keep the modelCache updated
      // without thinking about it, as well as broadcast change events
      Object.observe(this, this.__objectChanged__);

      // Store current object in modelCache
      modelCache[this.modelCacheId()] = this;

      // Run init function to be overloaded
      this.init();

      return this._filterFunctions();
    }

    _prototypeProperties(Store, {
      __modelCache__: {
        value: function ModelCache() {
          return modelCache;
        },
        writable: true,
        enumerable: true,
        configurable: true
      },
      extend: {

        // Extend the Store class, this is used over ES6 extension so we
        // can keep the return values of extended objects
        value: function extend(className, data) {
          var NewStore = function () {
            return Store.call(this, className);
          };

          Object.setPrototypeOf(NewStore.prototype, Store.prototype);
          NewStore.constructor = Store;

          for (var _iterator = Object.entries(data)[Symbol.iterator](), _step; !(_step = _iterator.next()).done;) {
            var _ref = _step.value;
            var _ref2 = _slicedToArray(_ref, 2);

            var key = _ref2[0];
            var value = _ref2[1];
            NewStore.prototype[key] = value;
          }

          return NewStore;
        },
        writable: true,
        enumerable: true,
        configurable: true
      }
    }, {
      init: {

        // Init function, this is for overloading
        value: function init() {
          return this;
        },
        writable: true,
        enumerable: true,
        configurable: true
      },
      transformFn: {

        // Transforming function to overload before listeners or data is returned
        value: function transformFn(data) {
          return data;
        },
        writable: true,
        enumerable: true,
        configurable: true
      },
      listen: {

        // Listen to all changes on model we use this for bindings to
        // Scope so they are constantly updated and insync with the modelCache
        value: function listen(callback) {
          // Add callback to the current classes cache in modelCache
          this._usersListening = this._usersListening.concat(callback);
        },
        writable: true,
        enumerable: true,
        configurable: true
      },
      emit: {

        // Emit events along scopes
        value: function emit() {
          var eventName = arguments[0] === undefined ? this.modelCacheId() : arguments[0];
          var data = arguments[1] === undefined ? this : arguments[1];
          // Broadcast events through the application scope only
          // passes a deep copy of the data
          $rootScope.$broadcast(eventName, this._filterData(data));
        },
        writable: true,
        enumerable: true,
        configurable: true
      },
      data: {

        // Get a copy of the current data from the modelCache
        // optionally wait for attributes that could be not there yet
        value: function data(waitAttrs) {
          var self = this,
              promiseList = null,
              promises = [],
              attrsWaited = {},
              model = modelCache[this.modelCacheId()],
              setKeyValue = function (setValue, obj) {
            return setValue[Object.keys(obj)[0]] = Object.values(obj)[0];
          };

          // Reassign waitAttrs to an array so
          // single wait can be used, or just return
          // filtered data if none waiting for
          if (waitAttrs) waitAttrs = angular.isArray(waitAttrs) ? waitAttrs : [waitAttrs];else return this._filterData(model);

          // Set promises for wait attrs
          waitAttrs.forEach(function (attr) {
            promises.push(new Promise(function (resolve, reject) {
              var intervalCheck = null,
                  checkForAttribute = function () {
                var value = model[attr],
                    isEmptyArray = Array.isArray(value) && value.length === 0,
                    isEmptyObject = typeof value === "object" && Object.values(value) && Object.values(value).length === 0;

                if (angular.isDefined(value) && !isEmptyArray && !isEmptyObject) {
                  $interval.cancel(intervalCheck);
                  return resolve(_defineProperty({}, attr, value));
                }

                intervalCheck = $interval(checkForAttribute, 200);
              };

              return checkForAttribute();
            }));
          });

          promiseList = Promise.all(promises);

          // Set the attributes waited for to attrsWaited
          promiseList.then(function (data) {
            data.forEach(function (obj) {
              return setKeyValue(attrsWaited, obj);
            });
          });

          return {
            result: this._filterData(attrsWaited),
            set: function set(obj) {
              // This will set keys on obj to the values of the data
              var resObj = {};

              promiseList.then(function (data) {
                data.forEach(function (dObj) {
                  return setKeyValue(resObj, dObj);
                });
                angular.extend(obj, self._filterData(resObj));
              });
            }
          };
        },
        writable: true,
        enumerable: true,
        configurable: true
      },
      modelCacheId: {

        // Id of model cache used for caching and default event names
        value: function modelCacheId() {
          var modelName = arguments[0] === undefined ? this._className : arguments[0];
          return "STORE:" + modelName;
        },
        writable: true,
        enumerable: true,
        configurable: true
      },
      _filterData: {
        value: function FilterData() {
          var data = arguments[0] === undefined ? this : arguments[0];
          var cloneData = {};

          for (var key in data) {
            if (key[0] !== "_" && typeof data[key] !== "function") cloneData[key] = angular.copy(data[key]);
          }return this.transformFn(cloneData);
        },
        writable: true,
        enumerable: true,
        configurable: true
      },
      _filterFunctions: {
        value: function FilterFunctions() {
          var data = arguments[0] === undefined ? this : arguments[0];
          var functionSet = {},
              model = modelCache[data.modelCacheId()],
              copyFns = ["_filterData", "_className", "_usersListening", "modelCacheId", "data", "listen", "emit"];

          // We set these manually so ES6 Classes method's aren't
          // enumerable
          copyFns.forEach(function (fn) {
            return functionSet[fn] = typeof model[fn] === "function" ? model[fn].bind(data) : model[fn];
          });

          for (var key in model) {
            (function (key) {
              if (!(key in functionSet)) {
                var isNotPrivFunction = key.substr(0, 2) !== "__" && typeof model[key] === "function",
                    isPrivString = typeof model[key] === "string" && key.substr(0, 2).match(/^_[^_]/);

                if (isNotPrivFunction || isPrivString) functionSet[key] = typeof model[key] === "string" ? angular.copy(model[key]) : function () {
                  for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
                    args[_key] = arguments[_key];
                  }

                  return model[key].apply(data, args);
                };
              }
            })(key);
          }

          return functionSet;
        },
        writable: true,
        enumerable: true,
        configurable: true
      },
      __objectChanged__: {
        value: function ObjectChanged(changes) {
          var self = this,
              changedModels = {};

          thaw(changes, {
            each: function (i) {
              var change = changes[i].object;
              changedModels[change._className] = change;
            },

            done: function () {
              for (var key in changedModels) {
                changedModels[key].__processCallbacks__();
              }
            }
          });
        },
        writable: true,
        enumerable: true,
        configurable: true
      },
      __processCallbacks__: {
        value: function ProcessCallbacks() {
          var model = arguments[0] === undefined ? this : arguments[0];
          thaw(model._usersListening, {
            each: function (i) {
              $rootScope.$apply(function () {
                return model._usersListening[i](model.modelCacheId(), model._filterData());
              });
            }
          });
        },
        writable: true,
        enumerable: true,
        configurable: true
      }
    });

    return Store;
  })();
}]);
