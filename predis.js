const Promise = require("bluebird");
const redis = require("redis");
const commands = require("redis-commands");

module.exports = {
    createClient(redis_options = {}, _redisClient = redis) {
        const opts = {
            password: null,
            server: "127.0.0.1",
            port: 6379,
            ...redis_options
        };
    
        const redisClient = _redisClient.createClient(opts.port, opts.server);
        const predis = {};
        const exclude = ["multi", "exec"];
    
        redisClient.on("error", (err) => {
            console.error(`ERROR in REDIS: ${err}`);
        });
    
        if (opts.password) {
            redisClient.auth(opts.password, () => {
                console.log(`Connected and authenticated to REDIS db at ${opts.server}:${opts.port}`);
            });
        } else {
            redisClient.on("connect", () => {
                console.log(`Connected to REDIS db at ${opts.server}:${opts.port}`);
            });
        }
    
        commands.list.forEach((command) => {
            predis[command] = function(...args) {
                if (exclude.includes(command)) {
                    return redisClient[command].apply(redisClient, arguments);
                }
            
                return new Promise((resolve, reject) => {
                    redisClient[command].apply(redisClient, [...args, (error, result) => {
                        if (error) {
                            console.error("Predis :: ERROR! ", error, command, args);
                            reject(error);
                        } else {
                            resolve(result);
                        }
                    }]);
                });
            };
        });
    
        return predis;
    }
};
