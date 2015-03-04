'use strict'

angular.module('angular-store', [])
  .service('Store', ['$rootScope', '$interval', ($rootScope, $interval) => {
    var modelCache = {}

    return class Store {
      static __modelCache__() {
        return modelCache
      }

      // Extend the Store class, this is used over ES6 extension so we
      // can keep the return values of extended objects
      static extend(className, data) {
        var NewStore = function() {
          return Store.call(this, className)
        }

        Object.setPrototypeOf(NewStore.prototype, Store.prototype)
        NewStore.constructor = Store

        for (let [key, value] of Object.entries(data))
            NewStore.prototype[key] = value

        return NewStore
      }

      // ~~~~DO NOT OVERLOAD!!!~~~~
      // Store Constructor
      constructor(storeName) {
        var model
        // Check for modelName or assign anonId
        this._className = storeName

        // Return the model if already exists
        if ((model = modelCache[this.modelCacheId()]))
          return model._filterFunctions()

        // Setup array for users listening to model
        this._usersListening = []


        // Set up Object.observe so we can keep the modelCache updated
        // without thinking about it, as well as broadcast change events
        Object.observe(this, this.__objectChanged__)

        // Store current object in modelCache
        modelCache[this.modelCacheId()] = this

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
      // Scope so they are constantly updated and insync with the modelCache
      listen(callback) {
        // Add callback to the current classes cache in modelCache
        this._usersListening = this._usersListening.concat(callback)
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
        var promiseList = null,
            promises    = [],
            attrsWaited = {},
            model       = modelCache[this.modelCacheId()],
            setKeyValue = (setValue, obj) => setValue[Object.keys(obj)[0]] = Object.values(obj)[0]

        // Reassign waitAttrs to an array so
        // single wait can be used, or just return
        // filtered data if none waiting for
        if (waitAttrs)
          waitAttrs = angular.isArray(waitAttrs) ? waitAttrs : [waitAttrs]
        else
          return this._filterData(model)

        // Set promises for wait attrs
        waitAttrs.forEach(attr => {
          promises.push(new Promise((resolve, reject) => {
            var intervalCheck     = null,
                checkForAttribute = () => {
                  var value         = model[attr],
                      isEmptyArray  = Array.isArray(value) && value.length === 0,
                      isEmptyObject = Object.values(value) && Object.values(value).length === 0

                  if (value && !isEmptyArray && !isEmptyObject) {
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
        })

        return {
          result: attrsWaited,
          set: function(obj) {
            // This will set keys on obj to the values of the data
            promiseList.then(data => {
              data.forEach(dObj => setKeyValue(obj, dObj))
            })
          }
        }
      }

      // Id of model cache used for caching and default event names
      modelCacheId(modelName = this._className) {
        return `STORE:${modelName}`
      }

      _filterData(data = this) {
        var cloneData = {}

        for (let key in data)
          if (key[0] !== '_' && typeof data[key] !== 'function')
            cloneData[key] = angular.copy(data[key])

        return this.transformFn(cloneData)
      }

      _filterFunctions(data = this) {
        var functionSet = {},
            model       = modelCache[data.modelCacheId()],
            copyFns     = [
              '_filterData', '_className',
              '_usersListening', 'modelCacheId',
              'data', 'listen', 'emit'
            ]

        // We set these manually so ES6 Classes method's aren't
        // enumerable
        copyFns.forEach((fn) => functionSet[fn] = typeof model[fn] === 'function' ? model[fn].bind(data) : model[fn])

        for (let key in model) {
          if (!(key in functionSet)) {

            let isNotPrivFunction = key.substr(0, 2) !== '__' && typeof model[key] === 'function',
                isPrivString   = typeof model[key] === 'string' && key.substr(0, 2).match(/^_[^_]/)

            if (isNotPrivFunction || isPrivString)
              functionSet[key] = typeof model[key] === 'string' ? angular.copy(model[key]) : (...args) => {return model[key].apply(data, args)}
          }
        }

        return functionSet
      }

      __objectChanged__(changes) {
        var self          = this,
            changedModels = {}

        thaw(changes, {
          each: i => {
            let change = changes[i].object
            changedModels[change._className] = change
          },

          done: () => {
            for (let key in changedModels)
              changedModels[key].__processCallbacks__()
          }
        })
      }

      __processCallbacks__(model = this) {
        thaw(model._usersListening, {
          each: i => {
            $rootScope.$apply(() => model._usersListening[i](model.modelCacheId(), model._filterData()))
          }
        })
      }
    }
  }])
