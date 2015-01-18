System.register([], function (_export) {
  "use strict";

  var _slicedToArray, _prototypeProperties;
  return {
    setters: [],
    execute: function () {
      _slicedToArray = function (arr, i) {
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

      _prototypeProperties = function (child, staticProps, instanceProps) {
        if (staticProps) Object.defineProperties(child, staticProps);
        if (instanceProps) Object.defineProperties(child.prototype, instanceProps);
      };

      (function () {
        "use strict";

        angular.module("modelStore", []).service("Store", ["$rootScope", "thaw", function ($rootScope, thaw) {
          var thawInst,
              modelCache = {},
              anonIndex = 0;

          return (function () {
            function Store() {
              var modelName = arguments[0] === undefined ? null : arguments[0];
              var model;

              // Check for modelName or assign anonId
              this.modelName = modelName ? modelName : this._anonId(anonIndex++);
              model = modelCache[this.modelCacheId()];

              // Return the model if already exists
              if (model) return model;

              this._usersListening = [];

              // Set up Object.observe so we can keep the modelCache updated
              // without thinking about it
              if (modelName) Object.observe(this, this.__objectChanged__);

              // Store current object in modelCache
              modelCache[this.modelCacheId()] = this;

              // Init function to be extended
              this.init();
            }

            _prototypeProperties(Store, {
              __modelCache__: {
                value: function ModelCache() {
                  return modelCache;
                },
                writable: true,
                enumerable: true,
                configurable: true
              }
            }, {
              init: {

                // Init function to overload
                value: function init() {
                  return this._filterFunctions();
                },
                writable: true,
                enumerable: true,
                configurable: true
              },
              listen: {

                // Listen to all changes on model
                value: function listen(callback) {
                  // Add callback to the current classes cache in modelCache
                  modelCache[this.modelCacheId()]._usersListening.push(callback);
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
              modelCacheId: {

                // Id of model cache used for caching and default event names
                value: function modelCacheId() {
                  var name = arguments[0] === undefined ? this.modelName : arguments[0];
                  return "" + this._className() + ":" + name;
                },
                writable: true,
                enumerable: true,
                configurable: true
              },
              _className: {
                value: function ClassName() {
                  var object = arguments[0] === undefined ? this : arguments[0];
                  return object.constructor.name;
                },
                writable: true,
                enumerable: true,
                configurable: true
              },
              _anonId: {
                value: function AnonId(index) {
                  return "ANON:" + index;
                },
                writable: true,
                enumerable: true,
                configurable: true
              },
              _anonCallbacks: {
                value: function AnonCallbacks() {
                  var anonCallbacks = [];

                  for (var i = 0; i <= anonIndex; i++) {
                    var model = modelCache[this.modelCacheId(this._anonId(i))];

                    if (model) anonCallbacks = anonCallbacks.concat(model._usersListening);
                  }

                  return anonCallbacks;
                },
                writable: true,
                enumerable: true,
                configurable: true
              },
              _filterData: {
                value: function FilterData() {
                  var data = arguments[0] === undefined ? this : arguments[0];
                  var cloneData = {};

                  for (var _iterator = Object.entries(data)[Symbol.iterator](), _step; !(_step = _iterator.next()).done;) {
                    var _ref = _step.value;
                    var _ref2 = _slicedToArray(_ref, 2);

                    var key = _ref2[0];
                    var value = _ref2[1];
                    if (key[0] !== "_" && typeof value !== "function") cloneData[key] = angular.copy(value);
                  }

                  return cloneData;
                },
                writable: true,
                enumerable: true,
                configurable: true
              },
              _filterFunctions: {
                value: function FilterFunctions() {
                  var data = arguments[0] === undefined ? this : arguments[0];
                  var functionSet = {};

                  for (var key in data) if (typeof data[key] === "function" && key.substr(0, 2) !== "__") functionSet[key] = angular.copy(data[key]);

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
                      changedModels[change._className()] = change;
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
                  var allCallbacks = model._usersListening.concat(model._anonCallbacks());

                  thaw(allCallbacks, {
                    each: function (i) {
                      allCallbacks[i](model.modelCacheId(), model._filterData());
                    },

                    done: function () {
                      modelCache[model.modelCacheId()] = model;
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
      })();
    }
  };
});

// cannot specify return so need to just assume object
//is immutable and can only call functions
