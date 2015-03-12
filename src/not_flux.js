'use strict'

angular.module('not-flux', [])
  .factory('NotFlux', ['Store', 'Action', (Store, Action) => {
    return {
      createActions(actionList) {
        return Action.createFromList(actionList)
      },

      createStore(data) {
        return new Store(data)
      }
    }
  }])
