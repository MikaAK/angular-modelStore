"use strict";

var helpers = {
  prototypeProperties: function prototypeProperties(child, staticProps, instanceProps) {
    if (staticProps) Object.defineProperties(child, staticProps);
    if (instanceProps) Object.defineProperties(child.prototype, instanceProps);
  },

  defineProperty: function defineProperty(obj, key, value) {
    return Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true });
  },

  classCallCheck: function classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  } },
    babelHelpers = babelHelpers && angular.extend(helpers, babelHelpers) || helpers;

angular.module("not-flux", []).factory("NotFlux", ["Store", "Action", function (Store, Action) {
  return {
    createActions: function createActions(actionList) {
      return Action.createFromList(actionList);
    },

    createStore: function createStore(data) {
      return new Store(data);
    }
  };
}]);
"use strict";

angular.module("not-flux").service("Action", ["$rootScope", function ($rootScope) {
  return (function () {
    function Action(actionName) {
      babelHelpers.classCallCheck(this, Action);

      var newAction = this.callAction.bind(this);
      this.name = actionName;
      this._listeners = [];

      newAction.listen = this.listen.bind(this);

      return newAction;
    }

    babelHelpers.prototypeProperties(Action, {
      createFromList: {
        value: function createFromList(actionList) {
          if (!angular.isArray(actionList)) throw new Error("You must pass actions an array");

          var functionSet = {};

          actionList.forEach(function (action) {
            functionSet[action] = new Action(action);
          });

          return functionSet;
        },
        writable: true,
        configurable: true
      }
    }, {
      listen: {

        /**
         * Add a callback as a listener to an action
         * @func
         * @param {function} callback - A single callback or an array of callbacks
         **/

        value: function listen(callback) {
          this._listeners = this._listeners.concat(callback);
        },
        writable: true,
        configurable: true
      },
      callAction: {
        value: function callAction() {
          for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
            args[_key] = arguments[_key];
          }

          if (!this._listeners.length) throw new Error("You action has nothing listening to it! Make sure to load it up first");

          this._listeners.forEach(function (listener) {
            return listener.apply(undefined, args);
          });
        },
        writable: true,
        configurable: true
      }
    });
    return Action;
  })();
}]);
"use strict";

angular.module("not-flux").service("Store", ["$rootScope", "$interval", function ($rootScope, $interval) {
  return (function () {
    // Store Constructor

    function Store(data) {
      babelHelpers.classCallCheck(this, Store);

      // Setup array for users listening to model
      this._changeListeners = [];

      // Extend the new data into the class
      angular.extend(this, this._pullData(data));
      // Extend the new functions into the store
      angular.extend(this, this._filterFunctions(data));

      // Set up Object.observe so we can keep the modelCache updated
      // without thinking about it, as well as broadcast change events
      Object.observe(this, this._objectChanged);

      // Run init function to be overloaded
      this.init();

      return this._filterFunctions();
    }

    babelHelpers.prototypeProperties(Store, null, {
      init: {

        // Init function, this is for overloading

        value: function init() {
          return this;
        },
        writable: true,
        configurable: true
      },
      transformFn: {

        // Transforming function to overload before listeners or data is returned

        value: function transformFn(data) {
          return data;
        },
        writable: true,
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
        configurable: true
      },
      data: {

        // Get a copy of the current data from the modelCache
        // optionally wait for attributes that could be not there yet

        value: function data(waitAttrs) {
          var _this = this;

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
          if (waitAttrs) waitAttrs = angular.isArray(waitAttrs) ? waitAttrs : [waitAttrs];else {
            return this._filterData();
          } // Set promises for wait attrs
          waitAttrs.forEach(function (attr) {
            promises.push(new Promise(function (resolve, reject) {
              var intervalCheck = null,
                  checkForAttribute = function () {
                var value = self[attr];

                if (angular.isDefined(value)) {
                  $interval.cancel(intervalCheck);
                  return resolve(babelHelpers.defineProperty({}, attr, value));
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
            attrsWaited = _this._filterData(attrsWaited);
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
        configurable: true
      },
      _pullData: {
        value: function _pullData(data) {
          var dataList = {};

          Object.keys(data).forEach(function (itemName) {
            if (typeof data[itemName] !== "function") dataList[itemName] = data[itemName];
          });

          return dataList;
        },
        writable: true,
        configurable: true
      },
      _filterData: {
        value: function _filterData() {
          var data = arguments[0] === undefined ? this : arguments[0];

          var cloneData = {};

          Object.keys(this._pullData(data)).forEach(function (key) {
            if (key[0] !== "_") cloneData[key] = angular.copy(data[key]);
          });

          return this.transformFn(cloneData);
        },
        writable: true,
        configurable: true
      },
      _filterFunctions: {
        value: function _filterFunctions(data) {
          var _this = this;

          var functionSet = {},
              copyFns = ["data", "bindTo"];

          if (!data)
            // We set these manually so ES6 Classes method's aren't
            // enumerable
            copyFns.forEach(function (fn) {
              functionSet[fn] = _this[fn].bind(_this);
            });else Object.keys(data).forEach(function (itemKey) {
            if (typeof data[itemKey] === "function") functionSet[data[itemKey].name] = data[itemKey].bind(_this);
          });

          return functionSet;
        },
        writable: true,
        configurable: true
      },
      _objectChanged: {
        value: function _objectChanged(changes) {
          // Must use semicolons on closures
          var listeners,
              _ = _ || angular.injector(["lodash"]).get("_"),

          // Use lodash or custom function to get unique objects of new changes
          newChanges = _ && _.uniq(changes.reverse(), function (change) {
            return change.name;
          }) || (function () {
            var keys,
                res = {},
                final = [];

            changes.reverse().forEach(function (change) {
              if (!res[change.name]) res[change.name] = change;
            });

            Object.keys(res).forEach(function (key) {
              return final.push(res[key]);
            });

            return final;
          })();

          listeners = (function () {
            var res = [];

            newChanges.forEach(function (change) {
              return res = res.concat(change.object._changeListeners);
            });

            return res;
          })();

          if (listeners.length) thaw(listeners, {
            each: function (i) {
              $rootScope.$apply(function () {
                return listeners[i](object._filterData());
              });
            }
          });
        },
        writable: true,
        configurable: true
      }
    });
    return Store;
  })();
}]);
