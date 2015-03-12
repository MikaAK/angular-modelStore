'use strict'

angular.module('not-flux')
  .service('Action', ['$rootScope', ($rootScope) => {
    return class Action {
      static createFromList(actionList) {
        if (!angular.isArray(actionList)) throw new Error('You must pass actions an array')

        let functionSet = {}

        actionList.forEach(action => {
          var newAction = new Action(action)

          functionSet[action]          = newAction.callAction.bind(newAction)
          functionSet[action].listenTo = newAction.listenTo.bind(newAction)
        })

        return functionSet
      }

      constructor(actionName) {
        this.name       = actionName
        this._listeners = []
      }

      listenTo(callback) {
        this._listeners = this._listeners.concat(callback)
      }

      callAction(...args) {
        if (!this._listeners.length) throw new Error('You action has nothing listening to it! Make sure to load it up first')

        this._listeners.forEach(listener => listener.apply(this, args))
      }
    }
  }])
