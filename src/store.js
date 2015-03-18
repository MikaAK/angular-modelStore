'use strict'

angular.module('not-flux')
  .service('Store', ['$rootScope', '$interval', ($rootScope, $interval) => {
    return class Store {
      // Store Constructor
      constructor(data) {
        // Setup array for users listening to model
        this._changeListeners  = []

        // Extend the new data into the class
        angular.extend(this, this._pullData(data))

        // Extend the new functions into the store
        angular.extend(this, this._filterFunctions(data))

        // Set up Object.observe so we can keep the modelCache updated
        // without thinking about it, as well as broadcast change events
        Nested.observe(this, this._objectChanged)

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

      // Bind to the data in the store, pass the scope so the callback is destroyed when the scope is
      bindTo(scope, callback) {
        if (!scope || !callback)
          throw new Error('You must provide a callback and scope')



        // Destroy the callback when scope is gone
        scope.$on('$destroy', () => this._changeListeners.splice(this._changeListeners.indexOf(callback), 1))

        // Add callback to the current classes cache in modelCache
        this._changeListeners.push(callback)
      }

      // Emit events along scopes
      emit(eventName = this.modelCacheId(), data) {
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

      _pullData(data) {
        var dataList = {}

        Object.keys(data).forEach(itemName => {
          if (typeof data[itemName] !== 'function')
            dataList[itemName] = data[itemName]
        })

        return dataList
      }

      _filterData(data = this) {
        if (data !== this) return angular.copy(data)

        let cloneData = {}

        Object.keys(this._pullData(data)).forEach(key => {
          if (key[0] !== '_')
            cloneData[key] = angular.copy(data[key])
        })

        return this.transformFn(cloneData)
      }

      _filterFunctions(data) {
        var functionSet = {},
            copyFns     = ['data', 'bindTo']

        if (!data)
          // We set these manually so ES6 Classes method's aren't
          // enumerable
          copyFns.forEach(fn => {
            functionSet[fn] = this[fn].bind(this)
          })
        else
          Object.keys(data).forEach(itemKey => {
            if (typeof data[itemKey] === 'function')
              functionSet[data[itemKey].name] = data[itemKey].bind(this)
          })

        return functionSet
      }

      _objectChanged(changes) { 
        var changedStores,
            unique = _ && _.uniq || function(a,b,c) {//array,placeholder,placeholder taken from stack
           
            b = a.length;
            while (c = --b)
              while (c--)
                a[b] !== a[c] || a.splice(c,1);

            return a
          }

        changedStores = unique(changes
          .filter(obj => !(obj.path === '/_changeListeners' && obj.removed.length))
          .map(obj => obj.root))
      
        thaw(changedStores, {
          each: function() {
            $rootScope.$apply(() => {
              this._changeListeners.forEach(callback => callback(this._filterData()))
            })
          }
        })
      }
    }
  }])
