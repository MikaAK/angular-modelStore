"use strict";

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

angular.module("not-flux").service("Store", ["$rootScope", "$interval", function ($rootScope, $interval) {
  return (function () {
    // Store Constructor
    function Store(data) {
      // Setup array for users listening to model
      this._changeListeners = [];

      // Extend the new data into the class
      angular.extend(this, data);

      // Set up Object.observe so we can keep the modelCache updated
      // without thinking about it, as well as broadcast change events
      Object.observe(this, this._objectChanged);

      // Run init function to be overloaded
      this.init();

      return this._filterFunctions();
    }

    _prototypeProperties(Store, null, {
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
      bindTo: {

        // Bind to the data in the store, pass the scope so the callback is destroyed when the scope is
        value: function bindTo(scope, callback) {
          var _this = this;
          if (!scope || !callback) throw new Error("You must provide a callback and scope");



          // Destroy the callback when scope is gone
          scope.$on("$destroy", function () {
            return _this._changeListeners.splice(_this._changeListeners.indexOf(callback), 1);
          });

          // Add callback to the current classes cache in modelCache
          this._changeListeners.push(callback);
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
          var _this2 = this;
          var self = this,
              promiseList = null,
              promises = [],
              attrsWaited = {},
              setKeyValue = function (setValue, obj) {
            return setValue[Object.keys(obj)[0]] = Object.values(obj)[0];
          };

          // Reassign waitAttrs to an array so
          // single wait can be used, or just return
          // filtered data if none waiting for
          if (waitAttrs) waitAttrs = angular.isArray(waitAttrs) ? waitAttrs : [waitAttrs];else return this._filterData();

          // Set promises for wait attrs
          waitAttrs.forEach(function (attr) {
            promises.push(new Promise(function (resolve, reject) {
              var intervalCheck = null,
                  checkForAttribute = function () {
                var value = self[attr];

                if (angular.isDefined(value)) {
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
            attrsWaited = _this2._filterData(attrsWaited);
          });

          return {
            result: attrsWaited,
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
          var _this3 = this;
          var functionSet = {},
              copyFns = ["data", "bindTo"];

          // We set these manually so ES6 Classes method's aren't
          // enumerable
          copyFns.forEach(function (fn) {
            return functionSet[fn] = typeof _this3[fn] === "function" ? _this3[fn].bind(_this3) : _this3[fn];
          });

          return functionSet;
        },
        writable: true,
        enumerable: true,
        configurable: true
      },
      _objectChanged: {
        value: function ObjectChanged(changes) {
          var object = changes[changes.length - 1].object,
              listeners = object._changeListeners;

          if (listeners.length) thaw(listeners, {
            each: function (i) {
              $rootScope.$apply(function () {
                return listeners[i](object._filterData());
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
