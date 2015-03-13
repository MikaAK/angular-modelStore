'use strict'

angular.module('not-flux')
  .service('Action', ['$rootScope', ($rootScope) => {
    return class Action {
      static createFromList(actionList) {
        if (!angular.isArray(actionList)) throw new Error('You must pass actions an array')

        let functionSet = {}

        actionList.forEach(action => {
          functionSet[action] = new Action(action)
        })

        return functionSet
      }

      constructor(actionName) {
        var newAction   = this.callAction.bind(this)
        this.name       = actionName
        this._listeners = []

        newAction.listen = this.listen.bind(this)

        return newAction
      }

      /**
       * Add a callback as a listener to an action
       * @func
       * @param {function} callback - A single callback or an array of callbacks
       **/
      listen(callback) {
        this._listeners = this._listeners.concat(callback)
      }

      callAction(...args) {
        if (!this._listeners.length) throw new Error('You action has nothing listening to it! Make sure to load it up first')

        this._listeners.forEach(listener => listener(...args))
      }
    }
  }])
