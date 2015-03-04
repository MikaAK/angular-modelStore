ModelStore
====
The Store is a service that allows you to create stores with immutable data.

Event's can also be emitted from inside the store and will broadcast throughout the app

### Dependancies
The only has two dependancies [thaw.js](robertleeplummerjr.github.io/thaw.js/) and
the `browser-polyfill` from `6to5` (inside the `vendor/` directory).
thaw.js allows us to run all callbacks at a browser convientent time.

### Usage
Create a new service and extend the Store onto it. Be careful not to override
the constructor. To add stuff to the initialization overload the `init` method.

#### EG
```javascript
.service('Students', function() {
  return Store.extend('Students', {
    items: [],

    init() {
      console.log("I'm initializing")
    },

    get() {
      // some asyncronus get
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
var StudentStore = new Student(),
    studentCopy  = StudentStore.data()

StudentStore.listen(function(eventName, data) {
  $scope.test = data.testing // Update our bindings
})

StudentStore.change()
```

#### Cloning Unresolved data
```javascript
var StudentStore = new Students()

scope.clone = StudentStore
  .data('students')
  .result // scope.clone.students

scope.clone = StudentStore
  .data(['items', 'stuff'])
  .set(this) // scope.items
```

### Why No Class inheritance
Your probably wondering why I don't just use `MyStore extends Store`, the reason
is because you cannot return values from the constructor in extended classes the
workaround is to call super on your new class. Luckily all you need to do here is
call it with extend and let the `modelStore` do its magic.

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

### What about transforming the data before we recieve the listen cbs
You can overide the default `transformFn` in your class, this allows you to change any data before you recieve your clone

```javascript
{
  transformFn(data) {
    data.currentCalcs = data.currentCalcs + 40 * 2
    data.totalMoney   = data.totalMoney + data.currentCalcs

    return data
  }
}
