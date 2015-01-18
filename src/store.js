'use strict'

angular.module('modelStore', [])

  .service('Store', ['$rootScope', ($rootScope) => {
    var thawInst,
        modelCache = {},
        anonIndex  = 0

    return class Store {
      static __modelCache__() {
        return modelCache
      }

      static extend(className, data) {
        var Model = function(modelName) {
          return Store.call(this, className, modelName)
        }

        Model.prototype = Object.create(Store.prototype)
        Model.constructor = Store
        angular.extend(Model.prototype, data)

        return Model
      }

      constructor(storeName, modelName = null) {
        var model

        // Check for modelName or assign anonId
        this._modelName = modelName ? modelName : this._anonId(anonIndex++)
        this._className = storeName
        model = modelCache[this.modelCacheId()]

        // Return the model if already exists
        if (model)
          return model

        // Setup array for users listening to model
        this._usersListening = []

        // Set up Object.observe so we can keep the modelCache updated
        // without thinking about it
        if (modelName)
          Object.observe(this, this.__objectChanged__)

        // Store current object in modelCache
        modelCache[this.modelCacheId()] = this

        // Run init function to be overloaded
        this.init()

        // cannot specify return so need to just assume object
        //is immutable and can only call functions
        return this._filterFunctions()
      }

      // Init function, this is for overloading
      init() {
        return this
      }

      // Listen to all changes on model
      listen(callback) {
        // Add callback to the current classes cache in modelCache
        modelCache[this.modelCacheId()]._usersListening.push(callback)
      }

      // Emit events along scopes
      emit(eventName = this.modelCacheId(), data = this) {
        // Broadcast events through the application scope only
        // passes a deep copy of the data
        $rootScope.$broadcast(eventName, this._filterData(data))
      }

      // Id of model cache used for caching and default event names
      modelCacheId(name = this._modelName) {
        return `${this._className}:${name}`
      }

      _anonId(index) {
        return `ANON:${index}`
      }

      _anonCallbacks() {
        var anonCallbacks = []

        for (let i = 0; i <= anonIndex; i++) {
          let model = modelCache[this.modelCacheId(this._anonId(i))]

          if (model)
            anonCallbacks = anonCallbacks.concat(model._usersListening)
        }

        return anonCallbacks
      }

      _filterData(data = this) {
        var cloneData = {}

        for (let [key, value] of Object.entries(data))
          if (key[0] !== '_' && typeof value !== 'function')
            cloneData[key] = angular.copy(value)

        return cloneData
      }

      _filterFunctions(data = this) {
        var functionSet = {}

        for (let key in data) {
          let isPrivFunction = key.substr(0, 2) !== '__' && typeof data[key] === 'function',
              isPrivString   = typeof data[key] === 'string' && key.substr(0, 2).match(/^_[^_]/)

          if (isPrivFunction || isPrivString)
            functionSet[key] = typeof data[key] === 'string' ? data[key] : data[key].bind(this)
        }

        return functionSet
      }

      __objectChanged__(changes) {
        var self = this,
            changedModels = {}

        thaw(changes, {
          each: (i) => {
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
        var allCallbacks = model._usersListening.concat(model._anonCallbacks())

        thaw(allCallbacks, {
          each: (i) => {
            allCallbacks[i](model.modelCacheId(), model._filterData())
          },

          done: () => {
            modelCache[model.modelCacheId()] = model
          }
        })
      }
    }
  }])
