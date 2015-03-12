Not Flux
===

### What is Not Flux
It's a flux library :) Implemented in angular to provide a quick flux pattern without having to worry about using `emitChange` everywhere


### Features

- Actions and Stores
- Stores emit clones
- NO EMIT CHANGE!!

## Examples

### Creating a store

```javascript
.factory('SettingsStore', ['NotFlux', function(NotFlux) {
  return NotFlux.createStore({
    myInfo: {hello: 'world'},
    userId: 4,

    modifyInfo: function(id, info) {
      this.myInfo.hello = 'bill' + info

      // Emit events through the app!
      this.emit('myEvent', this.myInfo)
    },

    changeUserId: function(id) {
      this.userId = id
    }
  })
}])
```

### Creating actions
```javascript
.factory('SettingsActions', ['NotFlux', function(NotFlux) {
  return NotFlux.createActions([
    'setUserId',
    'changeInfo'
  ])
}])
```

### Linking Actions to Stores
```javascript
.factory('SettingsStore', ['NotFlux', 'SettingsActions', function(NotFlux, SettingsActions) {
  return NotFlux.createStore({
    myInfo: {hello: 'world'},
    userId: 4,

    init: function() {
      // We set the action to listen to the
      // changeUserId callback from the store
      SettingsActions.setUserId.listen(this.changeUserId)

      // We can even define multiple handlers
      SettingsActions.changeInfo.listen([this.modifyInfo, this.changeUserId])
    },

    modifyInfo: function(id, info) {
      this.myInfo.hello = 'bill' + info
    },

    changeUserId: function(id) {
      this.userId = id
    }
  })
}])
```

### Linking up the view
```javascript
// We must load up the store as well as the actions. This is
// so the store can be initialzed! You only
// need to initialize a store in one location
// though it will not effect anything doing so in multiple places
.controller('myCtrl', ['$scope', 'SettingsStore', 'SettingsActions', function($scope, SettingsStore, SettingsActions) {

  // Call bindTo to update the view on changes
  SettingsStore.bindTo($scope, function(data) {
    $scope.userId = data.userId
  })

  $scope.onClick = function() {
    // Call an action which will change the store
    SettingsActions.changeUserId(5)
  }
})
```



# Methods

## Store
## Outside the definition
### `.bindTo($scope, cb)`
This is for binding to the data of a store. To modify the datastream we can use `tranformFn`

## Inside the definition
### `.init`
A method to overload for initialization of the store. Used to bind actions.
```
init: function() {
  // Set `setUserId` to run store.changedUserId 
  SettingsActions.setUserId.listen(this.changeUserId)

  // We can even define multiple handlers
  SettingsActions.changeInfo.listen([this.modifyInfo, this.changeUserId])
},
```
### `.transformFn(data)`
This is so you can modify the outgoing stream from the store.
IE.
```javascript
NotFlux.createStore({

  // Data received by bindTo will have be +500
  transformFn: function(data) {
    data.userId += 500

    return data
  }
})
```

### `.emit(data)`
Use this to emit system wide events
IE.
```javascript
NotFlux.createStore({
  myFn: function(data) {
    this.emit('hello', data)
  }
})

$scope.$on('hello', function(data) {
  console.log(data)
})
```

## Actions
### `Actions.{name}.listen(handler)`
Setup a listener for an action
