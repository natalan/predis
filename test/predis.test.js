const redisMock = require("redis-mock");
const Promise = require("bluebird");

const predis = require("../predis");

describe("client", () => {
    let client;
    beforeEach(() => {
        client = predis.createClient({}, redisMock);
    });
    
    afterEach((done) => {
        client.flushdb((err, succeeded) => {
            done();
        });
        client.quit();
    });

    it("Check GET/SET operations", (done) => {
        client.set("key", "value").then((result) => {
            expect(result).toEqual("OK");
            done();
        }).then(() => {
            client.get("key").then((result) => {
                expect(result).toEqual("value");
                done();
            });
        });
    });
    
    describe("checks examples from README", () => {
        it("checks user:123 example", (done) => {
            client.set("user", "123").then(() => {
                client.get("user").then((user) => {
                    expect(user).toEqual("123");
                    done();
                });
            });
        });
        
        it("check * example", (done) => {
            Promise.all([
                client.set("key", "value"),
                client.set("user", "123")
            ]).then(() => client.keys("*").then((keys) => Promise.all(keys.map((key) => client.type(key))))).then((result) => {
                expect(result).toEqual(["string", "string"]);
                done();
            });
        });
        
        it("Fetch set with pointers and their values", (done) => {
            Promise.all([
                client.sadd("stooges", "user:1"),
                client.sadd("stooges", "user:2"),
                client.sadd("stooges", "user:3"),
                client.set("user:1", "Andrei"),
                client.set("user:2", "Dave"),
                client.set("user:3", "Sasha")
            ]).then(() => {
                client.smembers("stooges").then((users) => {
                    expect(users).toEqual(["user:1", "user:2", "user:3"]);
        
                    client.mget(users).then((names) => {
                        expect(names).toEqual(["Andrei", "Dave", "Sasha"]);
                        done();
                    });
                });
            });
        });
    
        it("Store new user, add to 'stooges', and list all stooges", (done) => {
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
                        expect(id).toEqual(4);
                        client.set([`user:${id}`, "Andy"]);
                        return id;
                    })
                    .then((id) => client.sadd("stooges", `user:${id}`))
                    .then(() => client.smembers("stooges").then(client.mget).then((stooges) => {
                        expect(stooges).toEqual(["Andrei", "Dave", "Sasha", "Andy"]);
                        done();
                    }));
            });
        });
    
        it("multi & exec", (done) => {
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
                    expect(message).toEqual("Model My test model successfully deleted");
                    done();
                });
            });
        });
    });
});
