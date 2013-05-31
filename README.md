Predis = promise + redis
=======

Predis is based on [node-redis](https://github.com/mranney/node_redis). Instead invoking callback function after communication with database, it immediately returns a [Promise](https://github.com/natalan/Promise) object that will be resolved or rejected later.

Refer to [node-redis](https://github.com/mranney/node_redis) documentation for available commands and arguments.
Check [Promise](https://github.com/natalan/Promise) code, tests, and poor documentation to get some ideas on how you can use it.

Usage
-----
Install with:

    npm install predis


`createClient` takes an optional argument with server, port, and password for redis server:

```javascript
var predis = require("predis"),
    client = predis.createClient({
        port: 10229,
        server: "pub-redis-777.us-east-1-4.2.ec2.garantiadata.com",
        password: "secret"
    });
```
If no options provided `node-redis` will try to connect to 127.0.0.1 on port 6379 (default for redis-server)

Examples
--------
**Simple get example**

```javascript
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

**Fetch set with pointers and their values**
```javascript
client.smembers('stooges').then(function(users) {
    // users => ['user:1', 'user:2', 'user:3']
    return client.mget(users).then(function(names) {
        // names => ['Andrei', 'Dave', 'Sasha']
        return _.object(users, names); // => {'user:1': 'Andrei', 'user:2': 'Dave', 'user:3': 'Sasha'}
    })
});
```
**Store new user, add to 'stooges', and list all stooges**
```javascript
client.incr('next:user').then(function(id) {
    return client.set(['user:' + id, 'Andy']).then(function() {
         return client.sadd(['stooges', 'user:' + id]).success(function() {
             console.log('done');
         }).fail(function(err) {
             console.error('error occurred', err);
         });
    });
}).always(function() {
    return client.smembers('stooges').then(client.mget).then(function(stooges) {
        console.log(stooges); // => ['Andrei', 'Dave', 'Sasha', 'Andy']
    })
});
```

multi & exec
-----
Predis doesn't return a promise after `multi` and `exec` commands. You can use this approach instead:

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
