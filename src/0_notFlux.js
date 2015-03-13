'use strict'

var babelHelpers = babelHelpers || {
  prototypeProperties(child, staticProps, instanceProps) {
    if (staticProps) Object.defineProperties(child, staticProps)
    if (instanceProps) Object.defineProperties(child.prototype, instanceProps)
  },

  defineProperty(obj, key, value) {
    return Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true })
  },

  classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function")
    }
  }
}

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
