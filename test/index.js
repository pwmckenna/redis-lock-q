var assert = require('better-assert');
var q = require('q');
var sinon = require('sinon');
var redisClient = require('redis').createClient();
var lock = require('..')(redisClient);

describe('redis-lock-q', function () {
    it('resolves once the task function resolves', function (done) {
        var spy = sinon.spy();
        lock('test-lock-1', function () {
            return q.resolve().delay(100).then(spy);
        }).then(function () {
            assert(spy.callCount === 1);
        }).nodeify(done);
    });
    it('resolves the first task before calling the second', function (done) {
        var spy = sinon.spy();
        q.all([
            lock('test-lock-2', function () {
                assert(spy.callCount === 0);
                return q.resolve().delay(100).then(function () {
                    assert(spy.callCount === 0);
                    spy();
                });
            }).then(function () {
                assert(spy.callCount === 1);
            }),
            lock('test-lock-2', function () {
                assert(spy.callCount === 1);
                return q.resolve().delay(100).then(function () {
                    assert(spy.callCount === 1);
                    spy();
                });
            }).then(function () {
                assert(spy.callCount === 2);
            })
        ]).nodeify(done);
    });
    it('releases the lock even if the task returns a rejected promise', function (done) {
        var spy = sinon.spy();
        q.all([
            lock('test-lock-3', function () {
                throw new Error('intentional error');
            }).then(function () {
                throw new Error('unintentional success');
            }, spy),
            lock('test-lock-3', function () {
                throw new Error('intentional error');
            }).then(function () {
                throw new Error('unintentional success');
            }, spy),
            lock('test-lock-3', function () {
                throw new Error('intentional error');
            }).then(function () {
                throw new Error('unintentional success');
            }, spy)
        ]).then(function () {
            assert(spy.callCount === 3);
        }).nodeify(done);
    });
    it('resolves the lock promise with the value that the task was resolved with', function (done) {
        var val = 'expected';
        lock('test-lock-4', function () {
            return val;
        }).then(function (res) {
            assert(res === val);
        }).nodeify(done);
    });
    it('rejects the lock promise with the error that the task was rejected with', function (done) {
        var val = 'expected';
        lock('test-lock-4', function () {
            throw new Error(val);
        }).then(function () {
            throw new Error('unintentional success');
        }, function (err) {
            assert(err.message === val);
        }).nodeify(done);
    });
    it('releases the lock after a specified timeout', function (done) {
        var spy = sinon.spy();
        q.all([
            lock('test-lock-5', 100, function () {
                return q.resolve().then(spy).delay(10000);
            }),
            lock('test-lock-5', 100, function () {
                return q.resolve().then(spy).delay(10000);
            }),
            lock('test-lock-5', 100, function () {
                return q.resolve().then(spy).delay(10000);
            }),
            lock('test-lock-5', 100, function () {
                return q.resolve().then(spy).delay(10000);
            }),
            lock('test-lock-5', 100, function () {
                return q.resolve().then(spy);
            })
        ]).timeout(1000).fail(function () {
            assert(spy.callCount === 5);
        }).nodeify(done);
    })
});