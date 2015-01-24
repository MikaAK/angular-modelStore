ModelStore
====
The model store is a service that allows you to create stores with immutable data.

Event's can also be emitted from inside the store and will broadcast throughout the app

### Dependancies
The only has two dependancies [thaw.js](robertleeplummerjr.github.io/thaw.js/) and
the `browser-polyfill` from `6to5` (inside the `vendor/` directory).
thaw.js allows us to run all callbacks at a browser convientent time.

### Usage
Create a new service and extend the ModelStore onto it. Be careful not to override
the constructor. To add stuff to the initialization overload the `init` method.

#### EG
```javascript
.service('Student', function() {
  return Store.extend('Student', {
    init() {
      console.log("I'm initializing")
    },

    change() {
      this.testing = 1234
    },

    save() {
      this.makeApiPost()
      this.emit('studentPostMade')
    }
  })
})
```

#### To Listen
```javascript
var StudentModel = new Student(studentId)

StudentModel.listen(function(eventName, data) {
  $scope.test = data.testing // Update our bindings
})

StudentModel.change()
```

### Why No Class inheritance
Your probably wondering why I don't just use `MyStore extends Store`, the reason
is because you cannot return values from the constructor in extended classes the
workaround is to call super on your new class. Luckily all you need to do here is
call it with extend and let the `modelStore` do its magic.

### Initializing a model
To initialize a model create a `new` instance and give it a name, for example a
Student with the Id of 1 could be used like `new Student('1')` this way you can
call `new Student('1')` from anywhere in your code without creating a new instance.
The other benefit of this is you don't have to search different scopes for data.
It is all available through the model cache.


### Anon Listeners
Another thing you can do is setup anonymous listeners for the entire model. For
example if you wanted to listen for all changes on the Student model you would call

```javascript
(new Student()).listen(function(eventName, data) {
  // Will receive updates from every student model
})
```

#### Or on a specific model

```javascript
var current = new Student('current')

current.listen(function(eventName, student) {

})
```
