var Promise = window.Promise;

/**
 * Some features.
 * @class PromiseFeatures
 */
function PromiseFeatures() {
    var that = this;

    /**
     * @typedef Deferrer
     * @property {Function} resolve fulfills the promise
     * @property {Function} reject rejects the promise
     * @property {Promise} promise a promise object
     */

    /**
     * @method defer
     * @memberOf PromiseFeatures
     * @instance
     * @return {Deferrer} a deferred object with resolve and reject
     */
    this.defer = function() {
        var deferred = {};
        var promise = new Promise(function(resolve, reject) {
            deferred.resolve = resolve;
            deferred.reject = reject;
        });
        deferred.promise = promise;
        return deferred;
    }

    /**
     * wrap a PromiseExectuer Object to a onFullfilled/onRejcted object
     * @method  wrap
     * @memberOf PromiseFeatures
     * @instance
     * @param  {PromiseExectuer} any
     * @return {(onFullfilled|onRejected)}
     */
    this.wrap = function (any) {
        var that = this;

        return function () {
            if (typeof any === 'function') {
                var deferred = that.defer();
                var promise = deferred.promise;
                var args = [deferred.resolve, deferred.reject]
                    .concat(Array.prototype.slice.call(arguments));

                var result = any.apply(this, args);
                if (that.isPromise(result)) {
                    return result;
                } else {
                    return deferred.promise;
                } 
            } else {
                return any;
            }
        }
    }

    /**
     * mix then/catch in the context
     * @method mixin
     * @memberOf PromiseFeatures
     * @instance
     * @param  {Promise} promise Promiseå®žä¾‹
     * @param  {Object} context ä¸Šä¸‹æ–‡å¯¹è±¡
     * @return {Object} ä¸Šä¸‹æ–‡å¯¹è±¡
     */
    this.mixin = function (promise, context) {
        ['then', 'catch'].forEach(function(method) {
            context[method] = function() {
                return promise[method].apply(promise, arguments);
            }
        });
        return context;
    }

    /**
     * if is a thenable object
     * @method isThenable
     * @memberOf PromiseFeatures
     * @instance
     * @param  {Object} any
     * @return {Boolean} true or false
     */
    this.isThenable = function (any) {
        return !!any && !!any.then && (typeof any.then === 'function');
    }

    /**
     * if is a Promise object
     * @method isPromise
     * @memberOf PromiseFeatures
     * @instance
     * @param  {Object} any
     * @return {Boolean} true or false
     */
    this.isPromise = function (any) {
        return !!(any instanceof Promise);
    }

    /**
     * @typedef PromiseRecorder
     * @property {String} PromiseState pending/fulfilled/rejected
     * @property {*} PromiseResult fullfilled value or rejected reason
     */

    /**
     * record a Promise object's state and result.
     * @method record
     * @memberOf PromiseFeatures
     * @instance
     * @param  {Promise} promise a Promise object
     * @return {PromiseRecorder} a recorder
     */
    this.record = function(promise) {
        var recorder = Object.create(promise);

        if (Object.defineProperties) {
            var state = 'pending';
            var result;

            Object.defineProperties(recorder, {
                PromiseState: {
                    get: function() {
                        return state;
                    },
                    enmurable: false
                },

                PromiseResult: {
                    get: function() {
                        return result;
                    },
                    enmurable: false
                }
            });

            promise.then(function(ret) {
                state = 'fullfilled';
                result = ret;
            }, function(reason) {
                state = 'rejected';
                result = reason;
            });
        } else {
            recorder.PromiseState = 'pending';
            recorder.PromiseResult = undefined;

            promise.then(function(ret) {
                recorder.PromiseState = 'fullfilled';
                recorder.PromiseResult = ret;
            }, function(reason) {
                recorder.PromiseState = 'rejected';
                recorder.PromiseResult = reason;
            });
        }

        return recorder;
    }
}

/**
 * Some Utilities. Quick And Dirty.
 * @class  PromiseUtilities
 */
function PromiseUtilities() {
    var that = this;

    /**
     * a DOMContentLoaded Event promise
     * @method domReady
     * @memberOf PromiseUtilities
     * @instance
     * @return {Promise} a Promise object
     */
    var domReadyPrmoise = new Promise(function(resolve, reject) {
        if(document.readyState === 'complete') {
            resolve();
        } else {
            if (document.addEventListener) {
                document.addEventListener('DOMContentLoaded', resolve);
            } else {
                window.attachEvent('onload', resolve);
            }
        }
    });
    this.domReady = function() {
        return domReadyPrmoise;
    }
    
    /**
     * a load Event promise
     * @method pageLoad
     * @memberOf PromiseUtilities
     * @instance
     * @return {Promise} a Promise object
     */
    var pageLoadPromise = new Promise(function(resolve, reject) {
        if (window.addEventListener) {
            window.addEventListener('load', resolve);
        } else {
            window.attachEvent('onload', resolve);
        }
    });
    this.pageLoad = function() {
        return pageLoadPromise;
    }
    
    /**
     * a delay promise
     * @method delay
     * @memberOf PromiseUtilities
     * @param {Number} duration the delayed time(ms)
     * @instance
     * @return {Promise} a Promise object
     */
    this.delay = function (duration){
        return new Promise(function(resolve, reject) {
            setTimeout(resolve, duration);
        });
    }

    /**
     * a Event promise
     * @method waitForEvent
     * @memberOf PromiseUtilities
     * @param {HTMLElement} element a dom elment
     * @param {String} eventName a event type/name
     * @param {Boolean} useCapture a event capture
     * @instance
     * @return {Promise} a Promise object
     */
    this.waitForEvent = function (element, eventName, useCapture){
        return new Promise(function(resolve, reject) {
            function handler(e) {
                if (element.removeEventListener) {
                    element.removeEventListener(eventName, handler);
                } else {
                    element.detachEvent('on' + eventName, handler);
                }
                resolve(e);
            }

            if (element.addEventListener) {
                element.addEventListener(eventName, handler, useCapture);
            } else {
                element.attachEvent('on' + eventName, handler);
            }
        });
    }

    /**
     * a parallel promise
     * @method parallel
     * @memberOf PromiseUtilities
     * @param {Promise[]} promises a list of promises
     * @instance
     * @return {Promise} a Promise object
     */
    this.parallel = function (promises) {
        return Promise.all(promises.map(function(any){
            if (lib.promise.isThenable(any)) {
                return Promise.resolve(any);
            } else if (typeof any === 'function') {
                return any();
            } else {
                return any;
            }
        }));
    }

    /**
     * a serial promise
     * @method serial
     * @memberOf PromiseUtilities
     * @param {Promise[]} promises a list of promises
     * @instance
     * @return {Promise} a Promise object
     */
    this.serial = function (promises) {
        var promise = Promise.resolve();

        promises.forEach(function(any) {
            if (lib.promise.isThenable(any)) {
                promise = promise.then(function() {
                    return Promise.resolve(any);
                });
            } else if (typeof any === 'function') {
                promise = promise.then(any);
            } else {
                promise = promise.then(function() {
                    return any;
                });
            }
        });

        return promise;
    }
}

var context = Object.create({
    Promise: Promise
});

PromiseFeatures.call(context);
PromiseUtilities.call(context);

export default context;