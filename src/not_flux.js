'use strict'

angular.module('store-angular', [])
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
