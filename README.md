Predis = promise + redis
=======

Predis is based on [node-redis](https://github.com/mranney/node_redis). Instead invoking callback function after communication with database it immediately returns a [Promise](https://github.com/natalan/Promise) object that will be resolved or rejected later.

Refer to [node-redis](https://github.com/mranney/node_redis) documentation for available commands and arguments

Usage
-----
**createClient** method can take optional argument with server, port, and password to redis server:

```javascript
var predis = require("predis");
var client = predis.createClient({
    port: 10229,
    server: "pub-redis-777.us-east-1-4.2.ec2.garantiadata.com",
    password: "secret"
});
```
If no options provided node-redis will try to connect to 127.0.0.1 on port 6379 (default for redis-server)

Examples (using Underscore.js)
--------
**Simple get example**

```javascript
// get key 'user:123' from Redis and output value to console
client.get("user:123").then(function(user) {
    console.log(user);
});

```
**Get all keys and their types**
```javascript
client.keys("*").then(function(keys) {
    return new Promise(keys.map(function(key) {
        return client.type(key);
    })).then(function(types) {
        return _.object(keys, types);
    })
});
```

**Fetch set with pointers with their values**
```javascript
client.smembers('stooges').then(function(users) {
    // users => ['user:1', 'user:2', 'user:3']
    return client.mget(users).then(function(names) {
        // names => ['Andrei', 'Dave', 'Sasha']
        return _.object(users, names); // => {'user:1': 'Andrei', 'user:2': 'Dave', 'user:3': 'Sasha'}
    })
});
```
**Store new user and add to 'stooges'**
client.incr('next:user').then(function(id) {
    return client.set(['user:' + id, 'Andy']).success(function() {
        alert('Andy stored as user:' + id);
    }).fail(function(err) {
        console.error('error occurred', err);
    });
}).then(function(id) {
    return client.sadd(['stooges', 'user:' + id]).success(function() {
        alert('done');
    }).fail(function(err) {
        console.error('error occurred', err);
    });
});


multi & exec
-----
Predis does not return a promise after Multi and exec commands. You can use this approach instead:

```javascript
var destroyModel = function(model) {
    var p = new Promise;
    var multi = client.multi();

    model.properties.forEach(function(key) {
        multi.del(key);
    });

    multi.exec(function (err) {
        if (err) {
            p.reject(err);
        } else {
            p.resolve("Model " + model.name + " successfully deleted");
        }
    });

    return p;
};

destroyModel(someModel).then(function(message) {
    console.log(message);
});

```