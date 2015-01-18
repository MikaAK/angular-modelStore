ModelStore
====
The model store is a service that keeps track of all the models you have created, it will also update the modelCache so you are sharing the same data everywhere without having to pass the data around.

Event's can also be emitted from inside the class and will broadcast throughout the app

### Dependancies
The only has two dependancies [thaw.js](robertleeplummerjr.github.io/thaw.js/) and the `browser-polyfill` from `6to5` (inside the `vendor/` directory). This helps to run callbacks at a browser convenient time.

### Usage
Create a new service and extend the ModelStore onto it. Be careful not to override the constructor. To add stuff to the initialization overload the `init` method.

#### EG
```javascript
.service('Student', function() {
  return class Student extends Store {
    init() {
      console.log("I'm initializing")
    }

    save() {
      this.makeApiPost()
      this.emit('studentUpdated')
    }
  }
})
```

### Initializing a model
To initalize a model create a `new` instance and give it a name, for example a Student with the Id of 1 could be used like `new Student('1')` this way you can call `new Student('1')` from anywhere in your code without creating a new instance. The other benifit of this is you don't have to search different scopes for data. It is all availible through the model cache.


### Anon Listeners
Another thing you can do is setup anonomys listeners for the entire model. For example if you wanted to listen for all changes on the Student model you would call

```javascript
(new Student()).listen(function(eventName, data) {

})
```

#### Or on a specific model

```javascript
var current = new Student('current')

current.listen(function(eventName, student) {

})
```
