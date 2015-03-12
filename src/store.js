'use strict'

angular.module('angular-data', [])
  .service('Store', ['$rootScope', '$interval', ($rootScope, $interval) => {
    return class Store {
      // Create the Store class, this is used over ES6 extension so we
      // can keep the return values of extended objects
      static create(data) {
        return new Store(data)
      }

      // Store Constructor
      constructor(data) {
        // Setup array for users listening to model
        this._usersListening = []

        // Extend the new data into the class
        angular.extend(this, data)

        // Set up Object.observe so we can keep the modelCache updated
        // without thinking about it, as well as broadcast change events
        Object.observe(this, this.__objectChanged__)

        // Run init function to be overloaded
        this.init()

        return this._filterFunctions()
      }

      // Init function, this is for overloading
      init() {
        return this
      }

      // Transforming function to overload before listeners or data is returned
      transformFn(data) {
        return data
      }

      // Listen to all changes on model we use this for bindings to
      // Scope so they are constantly updated and in sync with the modelCache
      listen(scope, callback) {
        if (!scope || !callback)
          throw new Error('You must provide a callback and scope')

        scope.$on('$destroy', () => this._usersListening.splice(this._usersListening.indexOf(callback), 1))
        // Add callback to the current classes cache in modelCache
        this._usersListening.push(callback)
      }

      // Emit events along scopes
      emit(eventName = this.modelCacheId(), data = this) {
        // Broadcast events through the application scope only
        // passes a deep copy of the data
        $rootScope.$broadcast(eventName, this._filterData(data))
      }

      // Get a copy of the current data from the modelCache
      // optionally wait for attributes that could be not there yet
      data(waitAttrs) {
        var self        = this,
            promiseList = null,
            promises    = [],
            attrsWaited = {},
            setKeyValue = (setValue, obj) => setValue[Object.keys(obj)[0]] = Object.values(obj)[0]

        // Reassign waitAttrs to an array so
        // single wait can be used, or just return
        // filtered data if none waiting for
        if (waitAttrs)
          waitAttrs = angular.isArray(waitAttrs) ? waitAttrs : [waitAttrs]
        else
          return this._filterData()

        // Set promises for wait attrs
        waitAttrs.forEach(attr => {
          promises.push(new Promise((resolve, reject) => {
            var intervalCheck     = null,
                checkForAttribute = () => {
                  var value = self[attr]

                  if (angular.isDefined(value)) {
                    $interval.cancel(intervalCheck)
                    return resolve({[attr]: value})
                  }

                  intervalCheck = $interval(checkForAttribute, 200)
                }

            return checkForAttribute()
          }))
        })

        promiseList = Promise.all(promises)

        // Set the attributes waited for to attrsWaited
        promiseList.then(data => {
          data.forEach(obj => setKeyValue(attrsWaited, obj))
          attrsWaited = this._filterData(attrsWaited)
        })

        return {
          result: attrsWaited,
          set(obj) {
            // This will set keys on obj to the values of the data
            var resObj = {}

            promiseList.then(data => {
              data.forEach(dObj => setKeyValue(resObj, dObj))
              angular.extend(obj, self._filterData(resObj))
            })
          }
        }
      }

      _filterData(data = this) {
        var cloneData = {}

        for (let key in data)
          if (key[0] !== '_' && typeof data[key] !== 'function')
            cloneData[key] = angular.copy(data[key])

        return this.transformFn(cloneData)
      }

      _filterFunctions() {
        var functionSet = {},
            copyFns     = [
              '_filterData', '_actionName',
              'data', 'listen'
            ]

        // We set these manually so ES6 Classes method's aren't
        // enumerable
        copyFns.forEach((fn) => functionSet[fn] = typeof this[fn] === 'function' ? this[fn].bind(this) : this[fn])

        for (let key in this) {
          if (!(key in functionSet)) {
            let isPrivFunction = typeof this[key] === 'function' && key.substr(0, 1) === '_'

            if (!isPrivFunction)
              if (typeof this[key] !== 'function')
                functionSet[key] = angular.copy(this[key])
              else
                functionSet[key] = (...args) =>  this[key].apply(this, args)
          }
        }

        return functionSet
      }

      _actionName(action) {
        debugger
      }

      __objectChanged__(changes) {
        var object    = changes[changes.length - 1].object,
            listeners = object._usersListening

        if (listeners.length)
          thaw(listeners, {
            each: i => {
              $rootScope.$apply(() => listeners[i](object._filterData()))
            }
          })
      }
    }
  }])
