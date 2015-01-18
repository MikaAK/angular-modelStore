'use strict'

angular.module('modelStore', [])
  .service('Store', ['$rootScope', 'thaw', ($rootScope, thaw) => {
    var thawInst,
        modelCache = {},
        anonIndex  = 0

    return class Medit8ionApi {
      static __modelCache__() {
        return modelCache
      }

      constructor(modelName = null) {
        var model

        // Check for modelName or assign anonId
        this.modelName = modelName ? modelName : this._anonId(anonIndex++)
        model = modelCache[this.modelCacheId()]

        // Return the model if already exists
        if (model)
          return model

        this._usersListening = []

        // Set up Object.observe so we can keep the modelCache updated
        // without thinking about it
        if (modelName)
          Object.observe(this, this.__objectChanged__)

        // Store current object in modelCache
        modelCache[this.modelCacheId()] = this

        // Init function to be extended
        this.init()

        // cannot specify return so need to just assume object
        //is immutable and can only call functions
      }

      init() {
        return this._filterFunctions()
      }

      listen(callback) {
        // Add callback to the current classes cache in modelCache
        modelCache[this.modelCacheId()]._usersListening.push(callback)
      }

      emit(eventName = this.modelCacheId(), data = this) {
        // Broadcast events through the application scope only
        // passes a deep copy of the data
        $rootScope.$broadcast(eventName, this._filterData(data))
      }

      modelCacheId(name = this.modelName) {
        return `${this._className()}:${name}`
      }

      _className(object = this) {
        return object.constructor.name
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

        for (var key in data)
          if (typeof data[key] === 'function' && key.substr(0, 2) !== '__')
            functionSet[key] = angular.copy(data[key])

        return functionSet
      }

      __objectChanged__(changes) {
        var self = this,
            changedModels = {}

        thaw(changes, {
          each: (i) => {
            let change = changes[i].object
            changedModels[change._className()] = change
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
