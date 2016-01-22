var _ = require('underscore'),
    q = require('q'),
    redis = require("redis"),
    commands = require('redis-commands');

var _createClient = function(redis_options) {
    var opts = _.extend({
            password: null
        }, redis_options),
        redisClient = redis.createClient(opts.port, opts.server),
        predis = {},
        exclude = ["multi", "exec"];

    redisClient.on("error", function (err) {
        console.error("ERROR in REDIS: " + err);
    });

    if (opts.password) {
        redisClient.auth(opts.password, function() {
            console.log("Connected and authenticated to REDIS db at %s:%s", opts.server || "127.0.0.1", opts.port || 6379);
        });
    } else {
        redisClient.on("connect", function() {
            console.log("Connected to REDIS db at %s:%s", opts.server || "127.0.0.1", opts.port || 6379);
        });
    }

    commands.list.forEach(function(command) {
        predis[command] = function() {

            if (_(exclude).contains(command)) {
                return redisClient[command].apply(redisClient, arguments);
            } else {
                var defer = new q.defer(),
                    args = Array.prototype.slice.apply(arguments);

                args.push(function(error, result) {
                    if (error) {
                        console.error("Predis :: ERROR! ", error, command, args);
                        defer.reject(error);
                    } else {
                        defer.resolve(result);
                    }
                });

                redisClient[command].apply(redisClient, args);

                return defer.promise;
            }
        };
    });

    return predis;
};

module.exports = {
    createClient: _createClient
};