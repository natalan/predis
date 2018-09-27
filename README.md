Predis = promise + redis
=======

[![Build Status](https://travis-ci.com/natalan/predis.svg?branch=master)](https://travis-ci.com/natalan/predis) [![Greenkeeper badge](https://badges.greenkeeper.io/natalan/predis.svg)](https://greenkeeper.io/)

Predis is based on [node-redis](https://github.com/natalan/predis). Instead invoking callback function after communication with database, it immediately returns a [Promise](https://github.com/natalan/Promise) object that will be resolved or rejected later.

Refer to [node-redis](https://github.com/mranney/node_redis) documentation for available commands and arguments.

Usage
-----
Requires Node v8 or above.
Install with:

    npm install predis


`createClient` takes an optional argument with server, port, and password for redis server:

```javascript
const predis = require("predis");

const client = predis.createClient({
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
client.get("user:123").then((user) => {
    console.log(user);
});
```
**Get all keys and their types**
```javascript
Promise.all([
    client.set("key", "value"),
    client.set("user", "123")
]).then(() => client.keys("*").then((keys) => Promise.all(keys.map((key) => client.type(key))))).then((result) => {
    console.log(result); // => ["string", "string"]
});
```

**Fetch set with pointers and their values**
```javascript
Promise.all([
    client.sadd("stooges", "user:1"),
    client.sadd("stooges", "user:2"),
    client.sadd("stooges", "user:3"),
    client.set("user:1", "Andrei"),
    client.set("user:2", "Dave"),
    client.set("user:3", "Sasha")
]).then(() => {
    client.smembers("stooges").then((users) => {
        console.log(users); // => ["user:1", "user:2", "user:3"]

        client.mget(users).then((names) => {
            console.log(names); // => ["Andrei", "Dave", "Sasha"]
        });
    });
});
```
**Store new user, add to 'stooges', and list all stooges**
```javascript
Promise.all([
    client.sadd("stooges", "user:1"),
    client.sadd("stooges", "user:2"),
    client.sadd("stooges", "user:3"),
    client.set("user:1", "Andrei"),
    client.set("user:2", "Dave"),
    client.set("user:3", "Sasha"),
    client.set("next:user", "3")
]).then(() => {
    client.incr("next:user")
        .then((id) => {
            console.log(id); // => 4
            client.set([`user:${id}`, "Andy"]);
            return id;
        })
        .then((id) => {
            return client.sadd("stooges", `user:${id}`);
        })
        .then(() => client.smembers("stooges").then(client.mget).then((stooges) => {
            console.log(stooges); // => ["Andrei", "Dave", "Sasha", "Andy"]
        }));
});
```

multi & exec
-----
Predis does not return a promise after `multi` and `exec` commands. You can use this approach instead:

```javascript
const destroyModel = ({ name, ...properties }) => new Promise((resolve, reject) => {
    const multi = client.multi();

    Object.keys(properties).forEach((key) => {
        multi.del(key);
    });

    multi.exec((err) => {
        if (err) {
            reject(err);
        } else {
            resolve(`Model ${name} successfully deleted`);
        }
    });
});

Promise.all([
    client.set("key1", "value1"),
    client.set("key2", "value2"),
    client.set("key3", "value3")
]).then(() => {
    destroyModel({
        name: "My test model",
        key1: "value1",
        key2: "value2",
        key3: "value3"
    }).then((message) => {
        console.log(message); // => "Model My test model successfully deleted"
    });
});
```
