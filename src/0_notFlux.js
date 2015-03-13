'use strict'

var helpers = {
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
    },
    babelHelpers = (babel && angular.extend(helpers, babelHelpers)) || helpers

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
