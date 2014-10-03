var q = require('q');

module.exports = function () {
    var lock = require('redis-lock').apply(this, arguments);
    return function () {
        var defer = q.defer();
        var task = Array.prototype.slice.call(arguments, -1)[0];
        var args = Array.prototype.slice.call(arguments, 0, arguments.length - 1);
        args.push(function (done) {
            var promise = q.resolve().then(task);
            promise.fin(function () {
                done(function () {
                    defer.resolve(promise);
                });
            });
        });
        lock.apply(this, args);
        return defer.promise;
    };
};
