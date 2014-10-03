redis-lock-q
==========

A promisified version of [redis-lock](https://github.com/errorception/redis-lock), which implements a locking primitive using redis in node.js.

## Example

Take the [redis-lock example](https://github.com/errorception/redis-lock#example) 
```js
var client = require("redis").createClient(),
    lock = require("redis-lock")(client);

lock("myLock", function(done) {
  // No one else will be able to get a lock on 'myLock' until you call done()
  done(function () {
    // You can optionally call done with a callback,
    // which is called when the lock is released
  });
});
```

The redis-lock-q version looks something like this
```js
lock("myLock", function() {
  // No one else will be able to get a lock on 'myLock' until your return value resolves/rejects
  // You can return non-promise values, but they will be treated as promises resolved with the value
  return q.resolve().delay(1000); // in a second, the lock will be released
}).fin(function() {
  // The lock has been released
});
```

`lock` itself now returns a promise, which is just a proxy for the resolved/rejected promise that your function returned.
