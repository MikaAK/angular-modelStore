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

var _prototypeProperties = function (child, staticProps, instanceProps) {
  if (staticProps) Object.defineProperties(child, staticProps);
  if (instanceProps) Object.defineProperties(child.prototype, instanceProps);
};

angular.module("modelStore", []).service("Store", ["$rootScope", function ($rootScope) {
  var modelCache = {},
      anonIndex = 0;

  return (function () {
    // ~~~~DO NOT OVERLOAD!!!~~~~
    // Store Constructor
    function Store(storeName) {
      var modelName = arguments[1] === undefined ? null : arguments[1];
      var model;

      // Check for modelName or assign anonId
      this._modelName = modelName ? modelName : this._anonId(anonIndex++);
      this._className = storeName;
      model = modelCache[this.modelCacheId()];

      // Return the model if already exists
      if (model) return model._filterFunctions();

      // Setup array for users listening to model
      this._usersListening = [];

      // Set up Object.observe so we can keep the modelCache updated
      // without thinking about it
      if (modelName) Object.observe(this, this.__objectChanged__);

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
          var Model = function (modelName) {
            return Store.call(this, className, modelName);
          };

          Model.prototype = Object.create(Store.prototype);
          Model.constructor = Store;

          for (var _iterator = Object.entries(data)[Symbol.iterator](), _step; !(_step = _iterator.next()).done;) {
            var _ref = _step.value;
            var _ref2 = _slicedToArray(_ref, 2);

            var key = _ref2[0];
            var value = _ref2[1];
            Model.prototype[key] = value;
          }

          return Model;
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
      modelCacheId: {

        // Id of model cache used for caching and default event names
        value: function modelCacheId() {
          var name = arguments[0] === undefined ? this._modelName : arguments[0];
          return "" + this._className + ":" + name;
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

        // Unused fN
        value: function FilterData() {
          var data = arguments[0] === undefined ? this : arguments[0];
          var cloneData = {},
              model = modelCache[data.modelCacheId()];

          for (var key in model) {
            if (key[0] !== "_" && typeof model[key] !== "function") cloneData[key] = angular.copy(model[key]);
          }return cloneData;
        },
        writable: true,
        enumerable: true,
        configurable: true
      },
      _filterFunctions: {
        value: function FilterFunctions() {
          var data = arguments[0] === undefined ? this : arguments[0];
          var functionSet = {},
              model = modelCache[data.modelCacheId()];

          for (var key in model) {
            var isPrivFunction = key.substr(0, 2) !== "__" && typeof model[key] === "function",
                isPrivString = typeof model[key] === "string" && key.substr(0, 2).match(/^_[^_]/);

            if (isPrivFunction || isPrivString) functionSet[key] = typeof model[key] === "string" ? angular.copy(model[key]) : angular.copy(model[key].bind(this));
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
          console.log("changed", changes);
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
          var allCallbacks = model._usersListening.concat(model._anonCallbacks());

          thaw(allCallbacks, {
            each: function (i) {
              $rootScope.$apply(function () {
                return allCallbacks[i](model.modelCacheId(), model._filterData());
              });
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
