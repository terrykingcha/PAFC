/**
 * Copyright (c) 2014, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * https://raw.github.com/facebook/regenerator/master/LICENSE file. An
 * additional grant of patent rights can be found in the PATENTS file in
 * the same directory.
 */

!(function(global) {
  "use strict";

  var hasOwn = Object.prototype.hasOwnProperty;
  var undefined; // More compressible than void 0.
  var iteratorSymbol =
    typeof Symbol === "function" && Symbol.iterator || "@@iterator";

  var inModule = typeof module === "object";
  var runtime = global.regeneratorRuntime;
  if (runtime) {
    if (inModule) {
      // If regeneratorRuntime is defined globally and we're in a module,
      // make the exports object identical to regeneratorRuntime.
      module.exports = runtime;
    }
    // Don't bother evaluating the rest of this file if the runtime was
    // already defined globally.
    return;
  }

  // Define the runtime globally (as expected by generated code) as either
  // module.exports (if we're in a module) or a new, empty object.
  runtime = global.regeneratorRuntime = inModule ? module.exports : {};

  function wrap(innerFn, outerFn, self, tryLocsList) {
    // If outerFn provided, then outerFn.prototype instanceof Generator.
    var generator = Object.create((outerFn || Generator).prototype);
    var context = new Context(tryLocsList || []);

    // The ._invoke method unifies the implementations of the .next,
    // .throw, and .return methods.
    generator._invoke = makeInvokeMethod(innerFn, self, context);

    return generator;
  }
  runtime.wrap = wrap;

  // Try/catch helper to minimize deoptimizations. Returns a completion
  // record like context.tryEntries[i].completion. This interface could
  // have been (and was previously) designed to take a closure to be
  // invoked without arguments, but in all the cases we care about we
  // already have an existing method we want to call, so there's no need
  // to create a new function object. We can even get away with assuming
  // the method takes exactly one argument, since that happens to be true
  // in every case, so we don't have to touch the arguments object. The
  // only additional allocation required is the completion record, which
  // has a stable shape and so hopefully should be cheap to allocate.
  function tryCatch(fn, obj, arg) {
    try {
      return { type: "normal", arg: fn.call(obj, arg) };
    } catch (err) {
      return { type: "throw", arg: err };
    }
  }

  var GenStateSuspendedStart = "suspendedStart";
  var GenStateSuspendedYield = "suspendedYield";
  var GenStateExecuting = "executing";
  var GenStateCompleted = "completed";

  // Returning this object from the innerFn has the same effect as
  // breaking out of the dispatch switch statement.
  var ContinueSentinel = {};

  // Dummy constructor functions that we use as the .constructor and
  // .constructor.prototype properties for functions that return Generator
  // objects. For full spec compliance, you may wish to configure your
  // minifier not to mangle the names of these two functions.
  function Generator() {}
  function GeneratorFunction() {}
  function GeneratorFunctionPrototype() {}

  var Gp = GeneratorFunctionPrototype.prototype = Generator.prototype;
  GeneratorFunction.prototype = Gp.constructor = GeneratorFunctionPrototype;
  GeneratorFunctionPrototype.constructor = GeneratorFunction;
  GeneratorFunction.displayName = "GeneratorFunction";

  // Helper for defining the .next, .throw, and .return methods of the
  // Iterator interface in terms of a single ._invoke method.
  function defineIteratorMethods(prototype) {
    ["next", "throw", "return"].forEach(function(method) {
      prototype[method] = function(arg) {
        return this._invoke(method, arg);
      };
    });
  }

  runtime.isGeneratorFunction = function(genFun) {
    var ctor = typeof genFun === "function" && genFun.constructor;
    return ctor
      ? ctor === GeneratorFunction ||
        // For the native GeneratorFunction constructor, the best we can
        // do is to check its .name property.
        (ctor.displayName || ctor.name) === "GeneratorFunction"
      : false;
  };

  runtime.mark = function(genFun) {
    if (Object.setPrototypeOf) {
      Object.setPrototypeOf(genFun, GeneratorFunctionPrototype);
    } else {
      genFun.__proto__ = GeneratorFunctionPrototype;
    }
    genFun.prototype = Object.create(Gp);
    return genFun;
  };

  // Within the body of any async function, `await x` is transformed to
  // `yield regeneratorRuntime.awrap(x)`, so that the runtime can test
  // `value instanceof AwaitArgument` to determine if the yielded value is
  // meant to be awaited. Some may consider the name of this method too
  // cutesy, but they are curmudgeons.
  runtime.awrap = function(arg) {
    return new AwaitArgument(arg);
  };

  function AwaitArgument(arg) {
    this.arg = arg;
  }

  function AsyncIterator(generator) {
    function invoke(method, arg, resolve, reject) {
      var record = tryCatch(generator[method], generator, arg);
      if (record.type === "throw") {
        reject(record.arg);
      } else {
        var result = record.arg;
        var value = result.value;
        if (value instanceof AwaitArgument) {
          return Promise.resolve(value.arg).then(function(value) {
            invoke("next", value, resolve, reject);
          }, function(err) {
            invoke("throw", err, resolve, reject);
          });
        }

        return Promise.resolve(value).then(function(unwrapped) {
          // When a yielded Promise is resolved, its final value becomes
          // the .value of the Promise<{value,done}> result for the
          // current iteration. If the Promise is rejected, however, the
          // result for this iteration will be rejected with the same
          // reason. Note that rejections of yielded Promises are not
          // thrown back into the generator function, as is the case
          // when an awaited Promise is rejected. This difference in
          // behavior between yield and await is important, because it
          // allows the consumer to decide what to do with the yielded
          // rejection (swallow it and continue, manually .throw it back
          // into the generator, abandon iteration, whatever). With
          // await, by contrast, there is no opportunity to examine the
          // rejection reason outside the generator function, so the
          // only option is to throw it from the await expression, and
          // let the generator function handle the exception.
          result.value = unwrapped;
          resolve(result);
        }, reject);
      }
    }

    if (typeof process === "object" && process.domain) {
      invoke = process.domain.bind(invoke);
    }

    var previousPromise;

    function enqueue(method, arg) {
      function callInvokeWithMethodAndArg() {
        return new Promise(function(resolve, reject) {
          invoke(method, arg, resolve, reject);
        });
      }

      return previousPromise =
        // If enqueue has been called before, then we want to wait until
        // all previous Promises have been resolved before calling invoke,
        // so that results are always delivered in the correct order. If
        // enqueue has not been called before, then it is important to
        // call invoke immediately, without waiting on a callback to fire,
        // so that the async generator function has the opportunity to do
        // any necessary setup in a predictable way. This predictability
        // is why the Promise constructor synchronously invokes its
        // executor callback, and why async functions synchronously
        // execute code before the first await. Since we implement simple
        // async functions in terms of async generators, it is especially
        // important to get this right, even though it requires care.
        previousPromise ? previousPromise.then(
          callInvokeWithMethodAndArg,
          // Avoid propagating failures to Promises returned by later
          // invocations of the iterator.
          callInvokeWithMethodAndArg
        ) : callInvokeWithMethodAndArg();
    }

    // Define the unified helper method that is used to implement .next,
    // .throw, and .return (see defineIteratorMethods).
    this._invoke = enqueue;
  }

  defineIteratorMethods(AsyncIterator.prototype);

  // Note that simple async functions are implemented on top of
  // AsyncIterator objects; they just return a Promise for the value of
  // the final result produced by the iterator.
  runtime.async = function(innerFn, outerFn, self, tryLocsList) {
    var iter = new AsyncIterator(
      wrap(innerFn, outerFn, self, tryLocsList)
    );

    return runtime.isGeneratorFunction(outerFn)
      ? iter // If outerFn is a generator, return the full iterator.
      : iter.next().then(function(result) {
          return result.done ? result.value : iter.next();
        });
  };

  function makeInvokeMethod(innerFn, self, context) {
    var state = GenStateSuspendedStart;

    return function invoke(method, arg) {
      if (state === GenStateExecuting) {
        throw new Error("Generator is already running");
      }

      if (state === GenStateCompleted) {
        if (method === "throw") {
          throw arg;
        }

        // Be forgiving, per 25.3.3.3.3 of the spec:
        // https://people.mozilla.org/~jorendorff/es6-draft.html#sec-generatorresume
        return doneResult();
      }

      while (true) {
        var delegate = context.delegate;
        if (delegate) {
          if (method === "return" ||
              (method === "throw" && delegate.iterator[method] === undefined)) {
            // A return or throw (when the delegate iterator has no throw
            // method) always terminates the yield* loop.
            context.delegate = null;

            // If the delegate iterator has a return method, give it a
            // chance to clean up.
            var returnMethod = delegate.iterator["return"];
            if (returnMethod) {
              var record = tryCatch(returnMethod, delegate.iterator, arg);
              if (record.type === "throw") {
                // If the return method threw an exception, let that
                // exception prevail over the original return or throw.
                method = "throw";
                arg = record.arg;
                continue;
              }
            }

            if (method === "return") {
              // Continue with the outer return, now that the delegate
              // iterator has been terminated.
              continue;
            }
          }

          var record = tryCatch(
            delegate.iterator[method],
            delegate.iterator,
            arg
          );

          if (record.type === "throw") {
            context.delegate = null;

            // Like returning generator.throw(uncaught), but without the
            // overhead of an extra function call.
            method = "throw";
            arg = record.arg;
            continue;
          }

          // Delegate generator ran and handled its own exceptions so
          // regardless of what the method was, we continue as if it is
          // "next" with an undefined arg.
          method = "next";
          arg = undefined;

          var info = record.arg;
          if (info.done) {
            context[delegate.resultName] = info.value;
            context.next = delegate.nextLoc;
          } else {
            state = GenStateSuspendedYield;
            return info;
          }

          context.delegate = null;
        }

        if (method === "next") {
          if (state === GenStateSuspendedYield) {
            context.sent = arg;
          } else {
            context.sent = undefined;
          }

        } else if (method === "throw") {
          if (state === GenStateSuspendedStart) {
            state = GenStateCompleted;
            throw arg;
          }

          if (context.dispatchException(arg)) {
            // If the dispatched exception was caught by a catch block,
            // then let that catch block handle the exception normally.
            method = "next";
            arg = undefined;
          }

        } else if (method === "return") {
          context.abrupt("return", arg);
        }

        state = GenStateExecuting;

        var record = tryCatch(innerFn, self, context);
        if (record.type === "normal") {
          // If an exception is thrown from innerFn, we leave state ===
          // GenStateExecuting and loop back for another invocation.
          state = context.done
            ? GenStateCompleted
            : GenStateSuspendedYield;

          var info = {
            value: record.arg,
            done: context.done
          };

          if (record.arg === ContinueSentinel) {
            if (context.delegate && method === "next") {
              // Deliberately forget the last sent value so that we don't
              // accidentally pass it on to the delegate.
              arg = undefined;
            }
          } else {
            return info;
          }

        } else if (record.type === "throw") {
          state = GenStateCompleted;
          // Dispatch the exception by looping back around to the
          // context.dispatchException(arg) call above.
          method = "throw";
          arg = record.arg;
        }
      }
    };
  }

  // Define Generator.prototype.{next,throw,return} in terms of the
  // unified ._invoke helper method.
  defineIteratorMethods(Gp);

  Gp[iteratorSymbol] = function() {
    return this;
  };

  Gp.toString = function() {
    return "[object Generator]";
  };

  function pushTryEntry(locs) {
    var entry = { tryLoc: locs[0] };

    if (1 in locs) {
      entry.catchLoc = locs[1];
    }

    if (2 in locs) {
      entry.finallyLoc = locs[2];
      entry.afterLoc = locs[3];
    }

    this.tryEntries.push(entry);
  }

  function resetTryEntry(entry) {
    var record = entry.completion || {};
    record.type = "normal";
    delete record.arg;
    entry.completion = record;
  }

  function Context(tryLocsList) {
    // The root entry object (effectively a try statement without a catch
    // or a finally block) gives us a place to store values thrown from
    // locations where there is no enclosing try statement.
    this.tryEntries = [{ tryLoc: "root" }];
    tryLocsList.forEach(pushTryEntry, this);
    this.reset(true);
  }

  runtime.keys = function(object) {
    var keys = [];
    for (var key in object) {
      keys.push(key);
    }
    keys.reverse();

    // Rather than returning an object with a next method, we keep
    // things simple and return the next function itself.
    return function next() {
      while (keys.length) {
        var key = keys.pop();
        if (key in object) {
          next.value = key;
          next.done = false;
          return next;
        }
      }

      // To avoid creating an additional object, we just hang the .value
      // and .done properties off the next function object itself. This
      // also ensures that the minifier will not anonymize the function.
      next.done = true;
      return next;
    };
  };

  function values(iterable) {
    if (iterable) {
      var iteratorMethod = iterable[iteratorSymbol];
      if (iteratorMethod) {
        return iteratorMethod.call(iterable);
      }

      if (typeof iterable.next === "function") {
        return iterable;
      }

      if (!isNaN(iterable.length)) {
        var i = -1, next = function next() {
          while (++i < iterable.length) {
            if (hasOwn.call(iterable, i)) {
              next.value = iterable[i];
              next.done = false;
              return next;
            }
          }

          next.value = undefined;
          next.done = true;

          return next;
        };

        return next.next = next;
      }
    }

    // Return an iterator with no values.
    return { next: doneResult };
  }
  runtime.values = values;

  function doneResult() {
    return { value: undefined, done: true };
  }

  Context.prototype = {
    constructor: Context,

    reset: function(skipTempReset) {
      this.prev = 0;
      this.next = 0;
      this.sent = undefined;
      this.done = false;
      this.delegate = null;

      this.tryEntries.forEach(resetTryEntry);

      if (!skipTempReset) {
        for (var name in this) {
          // Not sure about the optimal order of these conditions:
          if (name.charAt(0) === "t" &&
              hasOwn.call(this, name) &&
              !isNaN(+name.slice(1))) {
            this[name] = undefined;
          }
        }
      }
    },

    stop: function() {
      this.done = true;

      var rootEntry = this.tryEntries[0];
      var rootRecord = rootEntry.completion;
      if (rootRecord.type === "throw") {
        throw rootRecord.arg;
      }

      return this.rval;
    },

    dispatchException: function(exception) {
      if (this.done) {
        throw exception;
      }

      var context = this;
      function handle(loc, caught) {
        record.type = "throw";
        record.arg = exception;
        context.next = loc;
        return !!caught;
      }

      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
        var entry = this.tryEntries[i];
        var record = entry.completion;

        if (entry.tryLoc === "root") {
          // Exception thrown outside of any try block that could handle
          // it, so set the completion value of the entire function to
          // throw the exception.
          return handle("end");
        }

        if (entry.tryLoc <= this.prev) {
          var hasCatch = hasOwn.call(entry, "catchLoc");
          var hasFinally = hasOwn.call(entry, "finallyLoc");

          if (hasCatch && hasFinally) {
            if (this.prev < entry.catchLoc) {
              return handle(entry.catchLoc, true);
            } else if (this.prev < entry.finallyLoc) {
              return handle(entry.finallyLoc);
            }

          } else if (hasCatch) {
            if (this.prev < entry.catchLoc) {
              return handle(entry.catchLoc, true);
            }

          } else if (hasFinally) {
            if (this.prev < entry.finallyLoc) {
              return handle(entry.finallyLoc);
            }

          } else {
            throw new Error("try statement without catch or finally");
          }
        }
      }
    },

    abrupt: function(type, arg) {
      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
        var entry = this.tryEntries[i];
        if (entry.tryLoc <= this.prev &&
            hasOwn.call(entry, "finallyLoc") &&
            this.prev < entry.finallyLoc) {
          var finallyEntry = entry;
          break;
        }
      }

      if (finallyEntry &&
          (type === "break" ||
           type === "continue") &&
          finallyEntry.tryLoc <= arg &&
          arg <= finallyEntry.finallyLoc) {
        // Ignore the finally entry if control is not jumping to a
        // location outside the try/catch block.
        finallyEntry = null;
      }

      var record = finallyEntry ? finallyEntry.completion : {};
      record.type = type;
      record.arg = arg;

      if (finallyEntry) {
        this.next = finallyEntry.finallyLoc;
      } else {
        this.complete(record);
      }

      return ContinueSentinel;
    },

    complete: function(record, afterLoc) {
      if (record.type === "throw") {
        throw record.arg;
      }

      if (record.type === "break" ||
          record.type === "continue") {
        this.next = record.arg;
      } else if (record.type === "return") {
        this.rval = record.arg;
        this.next = "end";
      } else if (record.type === "normal" && afterLoc) {
        this.next = afterLoc;
      }
    },

    finish: function(finallyLoc) {
      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
        var entry = this.tryEntries[i];
        if (entry.finallyLoc === finallyLoc) {
          this.complete(entry.completion, entry.afterLoc);
          resetTryEntry(entry);
          return ContinueSentinel;
        }
      }
    },

    "catch": function(tryLoc) {
      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
        var entry = this.tryEntries[i];
        if (entry.tryLoc === tryLoc) {
          var record = entry.completion;
          if (record.type === "throw") {
            var thrown = record.arg;
            resetTryEntry(entry);
          }
          return thrown;
        }
      }

      // The context.catch method must only be called with a location
      // argument that corresponds to a known catch block.
      throw new Error("illegal catch attempt");
    },

    delegateYield: function(iterable, resultName, nextLoc) {
      this.delegate = {
        iterator: values(iterable),
        resultName: resultName,
        nextLoc: nextLoc
      };

      return ContinueSentinel;
    }
  };
})(
  // Among the various tricks for obtaining a reference to the global
  // object, this seems to be the most reliable technique that does not
  // use indirect eval (which violates Content Security Policy).
  typeof global === "object" ? global :
  typeof window === "object" ? window :
  typeof self === "object" ? self : this
);

!function(a,b){function c(a,b){return[[(a/3+(a+b)/3-a)/(b-a),(a*a/3+a*b*2/3-a*a)/(b*b-a*a)],[(b/3+(a+b)/3-a)/(b-a),(b*b/3+a*b*2/3-a*a)/(b*b-a*a)]]}function d(a){if(this.v=a.v||0,this.a=a.a||0,"undefined"!=typeof a.t&&(this.t=a.t),"undefined"!=typeof a.s&&(this.s=a.s),"undefined"==typeof this.t)if("undefined"==typeof this.s)this.t=-this.v/this.a;else{var b=(Math.sqrt(this.v*this.v+2*this.a*this.s)-this.v)/this.a,c=(-Math.sqrt(this.v*this.v+2*this.a*this.s)-this.v)/this.a;this.t=Math.min(b,c)}"undefined"==typeof this.s&&(this.s=this.a*this.t*this.t/2+this.v*this.t)}d.prototype.generateCubicBezier=function(){return c(this.v/this.a,this.t+this.v/this.a)},b.motion=function(a){return new d(a)}}(window,window.lib||(window.lib={}));!function(a){"use strict";function b(a,b){for(var c=a;c;){if(c.contains(b)||c==b)return c;c=c.parentNode}return null}function c(a,b,c){var d=i.createEvent("HTMLEvents");if(d.initEvent(b,!0,!0),"object"==typeof c)for(var e in c)d[e]=c[e];a.dispatchEvent(d)}function d(a,b,c,d,e,f,g,h){var i=Math.atan2(h-f,g-e)-Math.atan2(d-b,c-a),j=Math.sqrt((Math.pow(h-f,2)+Math.pow(g-e,2))/(Math.pow(d-b,2)+Math.pow(c-a,2))),k=[e-j*a*Math.cos(i)+j*b*Math.sin(i),f-j*b*Math.cos(i)-j*a*Math.sin(i)];return{rotate:i,scale:j,translate:k,matrix:[[j*Math.cos(i),-j*Math.sin(i),k[0]],[j*Math.sin(i),j*Math.cos(i),k[1]],[0,0,1]]}}function e(a){0===Object.keys(l).length&&(j.addEventListener("touchmove",f,!1),j.addEventListener("touchend",g,!1),j.addEventListener("touchcancel",h,!1));for(var d=0;d<a.changedTouches.length;d++){var e=a.changedTouches[d],i={};for(var m in e)i[m]=e[m];var n={startTouch:i,startTime:Date.now(),status:"tapping",element:a.srcElement||a.target,pressingHandler:setTimeout(function(b){return function(){"tapping"===n.status&&(n.status="pressing",c(b,"press",{touchEvent:a})),clearTimeout(n.pressingHandler),n.pressingHandler=null}}(a.srcElement||a.target),500)};l[e.identifier]=n}if(2==Object.keys(l).length){var o=[];for(var m in l)o.push(l[m].element);c(b(o[0],o[1]),"dualtouchstart",{touches:k.call(a.touches),touchEvent:a})}}function f(a){for(var e=0;e<a.changedTouches.length;e++){var f=a.changedTouches[e],g=l[f.identifier];if(!g)return;g.lastTouch||(g.lastTouch=g.startTouch),g.lastTime||(g.lastTime=g.startTime),g.velocityX||(g.velocityX=0),g.velocityY||(g.velocityY=0),g.duration||(g.duration=0);var h=Date.now()-g.lastTime,i=(f.clientX-g.lastTouch.clientX)/h,j=(f.clientY-g.lastTouch.clientY)/h,k=70;h>k&&(h=k),g.duration+h>k&&(g.duration=k-h),g.velocityX=(g.velocityX*g.duration+i*h)/(g.duration+h),g.velocityY=(g.velocityY*g.duration+j*h)/(g.duration+h),g.duration+=h,g.lastTouch={};for(var m in f)g.lastTouch[m]=f[m];g.lastTime=Date.now();var n=f.clientX-g.startTouch.clientX,o=f.clientY-g.startTouch.clientY,p=Math.sqrt(Math.pow(n,2)+Math.pow(o,2));("tapping"===g.status||"pressing"===g.status)&&p>10&&(g.status="panning",g.isVertical=!(Math.abs(n)>Math.abs(o)),c(g.element,"panstart",{touch:f,touchEvent:a,isVertical:g.isVertical}),c(g.element,(g.isVertical?"vertical":"horizontal")+"panstart",{touch:f,touchEvent:a})),"panning"===g.status&&(g.panTime=Date.now(),c(g.element,"pan",{displacementX:n,displacementY:o,touch:f,touchEvent:a,isVertical:g.isVertical}),g.isVertical?c(g.element,"verticalpan",{displacementY:o,touch:f,touchEvent:a}):c(g.element,"horizontalpan",{displacementX:n,touch:f,touchEvent:a}))}if(2==Object.keys(l).length){for(var q,r=[],s=[],t=[],e=0;e<a.touches.length;e++){var f=a.touches[e],g=l[f.identifier];r.push([g.startTouch.clientX,g.startTouch.clientY]),s.push([f.clientX,f.clientY])}for(var m in l)t.push(l[m].element);q=d(r[0][0],r[0][1],r[1][0],r[1][1],s[0][0],s[0][1],s[1][0],s[1][1]),c(b(t[0],t[1]),"dualtouch",{transform:q,touches:a.touches,touchEvent:a})}}function g(a){if(2==Object.keys(l).length){var d=[];for(var e in l)d.push(l[e].element);c(b(d[0],d[1]),"dualtouchend",{touches:k.call(a.touches),touchEvent:a})}for(var i=0;i<a.changedTouches.length;i++){var n=a.changedTouches[i],o=n.identifier,p=l[o];if(p){if(p.pressingHandler&&(clearTimeout(p.pressingHandler),p.pressingHandler=null),"tapping"===p.status&&(p.timestamp=Date.now(),c(p.element,"tap",{touch:n,touchEvent:a}),m&&p.timestamp-m.timestamp<300&&c(p.element,"doubletap",{touch:n,touchEvent:a}),m=p),"panning"===p.status){var q=Date.now(),r=q-p.startTime,s=((n.clientX-p.startTouch.clientX)/r,(n.clientY-p.startTouch.clientY)/r,n.clientX-p.startTouch.clientX),t=n.clientY-p.startTouch.clientY,u=Math.sqrt(p.velocityY*p.velocityY+p.velocityX*p.velocityX),v=u>.5&&q-p.lastTime<100,w={duration:r,isflick:v,velocityX:p.velocityX,velocityY:p.velocityY,displacementX:s,displacementY:t,touch:n,touchEvent:a,isVertical:p.isVertical};c(p.element,"panend",w),v&&(c(p.element,"flick",w),p.isVertical?c(p.element,"verticalflick",w):c(p.element,"horizontalflick",w))}"pressing"===p.status&&c(p.element,"pressend",{touch:n,touchEvent:a}),delete l[o]}}0===Object.keys(l).length&&(j.removeEventListener("touchmove",f,!1),j.removeEventListener("touchend",g,!1),j.removeEventListener("touchcancel",h,!1))}function h(a){if(2==Object.keys(l).length){var d=[];for(var e in l)d.push(l[e].element);c(b(d[0],d[1]),"dualtouchend",{touches:k.call(a.touches),touchEvent:a})}for(var i=0;i<a.changedTouches.length;i++){var m=a.changedTouches[i],n=m.identifier,o=l[n];o&&(o.pressingHandler&&(clearTimeout(o.pressingHandler),o.pressingHandler=null),"panning"===o.status&&c(o.element,"panend",{touch:m,touchEvent:a}),"pressing"===o.status&&c(o.element,"pressend",{touch:m,touchEvent:a}),delete l[n])}0===Object.keys(l).length&&(j.removeEventListener("touchmove",f,!1),j.removeEventListener("touchend",g,!1),j.removeEventListener("touchcancel",h,!1))}var i=a.document,j=i.documentElement,k=Array.prototype.slice,l={},m=null;j.addEventListener("touchstart",e,!1)}(window,window.lib||(window.lib={}));!function(a,b){function c(a,b,c,d){function e(a){return(3*k*a+2*l)*a+m}function f(a){return((k*a+l)*a+m)*a}function g(a){return((n*a+o)*a+p)*a}function h(a){for(var b,c,d=a,g=0;8>g;g++){if(c=f(d)-a,Math.abs(c)<j)return d;if(b=e(d),Math.abs(b)<j)break;d-=c/b}var h=1,i=0;for(d=a;h>i;){if(c=f(d)-a,Math.abs(c)<j)return d;c>0?h=d:i=d,d=(h+i)/2}return d}function i(a){return g(h(a))}var j=1e-6,k=3*a-3*c+1,l=3*c-6*a,m=3*a,n=3*b-3*d+1,o=3*d-6*b,p=3*b;return i}b.cubicbezier=c,b.cubicbezier.linear=c(0,0,1,1),b.cubicbezier.ease=c(.25,.1,.25,1),b.cubicbezier.easeIn=c(.42,0,1,1),b.cubicbezier.easeOut=c(0,0,.58,1),b.cubicbezier.easeInOut=c(.42,0,.58,1)}(window,window.lib||(window.lib={}));!function(a,b){function c(a){return setTimeout(a,l)}function d(a){clearTimeout(a)}function e(){var a={},b=new m(function(b,c){a.resolve=b,a.reject=c});return a.promise=b,a}function f(a,b){return["then","catch"].forEach(function(c){b[c]=function(){return a[c].apply(a,arguments)}}),b}function g(b){var c,d,h=!1;this.request=function(){h=!1;var g=arguments;return c=e(),f(c.promise,this),d=n(function(){h||c&&c.resolve(b.apply(a,g))}),this},this.cancel=function(){return d&&(h=!0,o(d),c&&c.reject("CANCEL")),this},this.clone=function(){return new g(b)}}function h(a,b){"function"==typeof b&&(b={0:b});for(var c=a/l,d=1/c,e=[],f=Object.keys(b).map(function(a){return parseInt(a)}),h=0;c>h;h++){var i=f[0],j=d*h;if(null!=i&&100*j>=i){var k=b[""+i];k instanceof g||(k=new g(k)),e.push(k),f.shift()}else e.length&&e.push(e[e.length-1].clone())}return e}function i(a){var c;return"string"==typeof a||a instanceof Array?b.cubicbezier?"string"==typeof a?b.cubicbezier[a]&&(c=b.cubicbezier[a]):a instanceof Array&&4===a.length&&(c=b.cubicbezier.apply(b.cubicbezier,a)):console.error("require lib.cubicbezier"):"function"==typeof a&&(c=a),c}function j(a,b,c){var d,g=h(a,c),j=1/(a/l),k=0,m=i(b);if(!m)throw new Error("unexcept timing function");var n=!1;this.play=function(){function a(){var c=j*(k+1).toFixed(10),e=g[k];e.request(c.toFixed(10),b(c).toFixed(10)).then(function(){n&&(k===g.length-1?(n=!1,d&&d.resolve("FINISH"),d=null):(k++,a()))},function(){})}if(!n)return n=!0,d||(d=e(),f(d.promise,this)),a(),this},this.stop=function(){return n?(n=!1,g[k]&&g[k].cancel(),this):void 0}}var k=60,l=1e3/k,m=a.Promise||b.promise&&b.promise.ES6Promise,n=window.requestAnimationFrame||window.msRequestAnimationFrame||window.webkitRequestAnimationFrame||window.mozRequestAnimationFrame||c,o=window.cancelAnimationFrame||window.msCancelAnimationFrame||window.webkitCancelAnimationFrame||window.mozCancelAnimationFrame||d;(n===c||o===d)&&(n=c,o=d),b.animation=function(a,b,c){return new j(a,b,c)},b.animation.frame=function(a){return new g(a)},b.animation.requestFrame=function(a){var b=new g(a);return b.request()}}(window,window.lib||(window.lib={}));
!function(a,b){function c(){b.scroll.outputDebugLog&&console.debug.apply(console,arguments)}function d(a){var b=a.getBoundingClientRect();if(!b){b={},b.width=a.offsetWidth,b.height=a.offsetHeight,b.left=a.offsetLeft,b.top=a.offsetTop;for(var c=a.offsetParent;c;)b.left+=c.offsetLeft,b.top+=c.offsetTop,c=c.offsetParent;b.right=b.left+b.width,b.bottom=b.top+b.height}return b}function e(a){return 0-a.options[a.axis+"PaddingTop"]}function f(a){var b=d(a.element),c=d(a.viewport),f=e(a);if("y"===a.axis)var g=0-b.height+c.height;else var g=0-b.width+c.width;return Math.min(g+a.options[a.axis+"PaddingBottom"],f)}function g(a,b){return b>a.minScrollOffset?b-a.minScrollOffset:b<a.maxScrollOffset?b-a.maxScrollOffset:void 0}function h(a,b){return b>a.minScrollOffset?b=a.minScrollOffset:b<a.maxScrollOffset&&(b=a.maxScrollOffset),b}function i(a,b,d){c(a.element.scrollId,b,d);var e=o.createEvent("HTMLEvents");if(e.initEvent(b,!1,!0),e.scrollObj=a,d)for(var f in d)e[f]=d[f];a.element.dispatchEvent(e),a.viewport.dispatchEvent(e)}function j(a){var b,c={x:0,y:0},d=getComputedStyle(a.element)[x+"Transform"];return"none"!==d&&(b=d.match(/^matrix3d\((?:[-\d.]+,\s*){12}([-\d.]+),\s*([-\d.]+)(?:,\s*[-\d.]+){2}\)/)||d.match(/^matrix\((?:[-\d.]+,\s*){4}([-\d.]+),\s*([-\d.]+)\)$/))&&(c.x=parseFloat(b[1])||0,c.y=parseFloat(b[2])||0),c}function k(a,b){return a=parseFloat(a),b=parseFloat(b),0!=a&&(a+="px"),0!=b&&(b+="px"),z?"translate3d("+a+", "+b+", 0)":"translate("+a+", "+b+")"}function l(a,b,c){a.element.style[x+"Transition"]=""===b&&""===c?"":w+"transform "+b+" "+c+" 0s"}function m(a,b){var c=0,d=0;"object"==typeof b?(c=b.x,d=b.y):"y"===a.axis?d=b:c=b,a.element.style[x+"Transform"]=k(c,d)}function n(a,k){function n(a){return F||L?(a.preventDefault(),a.stopPropagation(),!1):!0}function o(a){F||L||setTimeout(function(){var b=document.createEvent("HTMLEvents");b.initEvent("niceclick",!0,!0),a.target.dispatchEvent(b)},300)}function p(a,c){I=null,clearTimeout(J),J=setTimeout(function(){I&&(I=null,b.animation.requestFrame(a))},c||400),I=a}function s(a){if(!E.enabled)return!1;if("undefined"!=typeof a.isVertical){if(!("y"===E.axis&&a.isVertical||"x"===E.axis&&!a.isVertical))return!1;a.stopPropagation()}return!0}function v(a){if(s(a))if(L&&D(),k.useFrameAnimation)H&&H.stop(),H=null;else{var b=j(E);m(E,b),l(E,"",""),I=null,clearTimeout(J)}}function w(a){if(s(a)){var c=j(E)[E.axis],d=g(E,c);if(d){var e=h(E,c);if(k.useFrameAnimation){var f=e-c;H=new b.animation(400,b.cubicbezier.ease,function(a,b){var d=(c+f*b).toFixed(2);m(E,d),i(E,"scrolling")}),H.play().then(D)}else{var n=e.toFixed(0);l(E,"0.4s","ease"),m(E,n),p(D,400),b.animation.requestFrame(function(){L&&E.enabled&&(i(E,"scrolling"),b.animation.requestFrame(arguments.callee))})}d>0?i(E,"y"===E.axis?"pulldownend":"pullrightend"):0>d&&i(E,"y"===E.axis?"pullupend":"pullleftend")}else L&&D()}}function y(a){s(a)&&(E.transformOffset=j(E),E.minScrollOffset=e(E),E.maxScrollOffset=f(E),K=2.5,N=!0,L=!0,M=!1,i(E,"scrollstart"),O=a["displacement"+E.axis.toUpperCase()])}function z(a){if(s(a)){var b=a["displacement"+E.axis.toUpperCase()];if(Math.abs(b-O)<5)return a.stopPropagation(),void 0;O=b;var c=E.transformOffset[E.axis]+b;c>E.minScrollOffset?(c=E.minScrollOffset+(c-E.minScrollOffset)/K,K*=1.003):c<E.maxScrollOffset&&(c=E.maxScrollOffset-(E.maxScrollOffset-c)/K,K*=1.003),K>4&&(K=4);var d=g(E,c);d&&(i(E,d>0?"y"===E.axis?"pulldown":"pullright":"y"===E.axis?"pullup":"pullleft",{boundaryOffset:Math.abs(d)}),E.options.noBounce&&(c=h(E,c))),m(E,c.toFixed(2)),i(E,"scrolling")}}function B(a){s(a)&&a.isflick&&C(a)}function C(a){N=!0;var d,e,f,h,n,o,q,r,s,u,v,w,x,y,z,A,B;h=j(E)[E.axis];var C=g(E,h);if(!C){d=a["velocity"+E.axis.toUpperCase()];var F=2,G=.0015;k.inertia&&t[k.inertia]&&(F=t[k.inertia][0],G=t[k.inertia][1]),d>F&&(d=F),-F>d&&(d=-F),e=G*(d/Math.abs(d)),o=new b.motion({v:d,a:-e}),f=o.t,n=h+o.s;var I=g(E,n);if(I){c("惯性计算超出了边缘",I),q=d,r=e,I>0?(u=E.minScrollOffset,w=1):(u=E.maxScrollOffset,w=-1),v=new b.motion({v:w*q,a:-w*r,s:Math.abs(u-h)}),s=v.t;var J=v.generateCubicBezier();x=q-r*s,y=.03*(x/Math.abs(x)),B=new b.motion({v:x,a:-y}),z=B.t,A=u+B.s;{B.generateCubicBezier()}if(k.noBounce)if(c("没有回弹效果"),h!==u)if(k.useFrameAnimation){var K=u-h,O=b.cubicbezier(J[0][0],J[0][1],J[1][0],J[1][1]);H=new b.animation(s.toFixed(0),O,function(a,b){var c=h+K*b;j(E,c.toFixed(2)),i(E,"scrolling",{afterFlick:!0})}),H.play().then(D)}else{var P=u.toFixed(0);l(E,(s/1e3).toFixed(2)+"s","cubic-bezier("+J+")"),m(E,P),p(D,1e3*(s/1e3).toFixed(2))}else D();else if(h!==A)if(c("惯性滚动","s="+A.toFixed(0),"t="+((s+z)/1e3).toFixed(2)),k.useFrameAnimation){var K=A-h,O=b.cubicbezier.easeOut;H=new b.animation((s+z).toFixed(0),O,function(a,b){var c=h+K*b;m(E,c.toFixed(2)),i(E,"scrolling",{afterFlick:!0})}),H.play().then(function(){if(E.enabled){var a=u-A,c=b.cubicbezier.ease;H=new b.animation(400,c,function(b,c){var d=A+a*c;m(E,d.toFixed(2)),i(E,"scrolling",{afterFlick:!0})}),H.play().then(D)}})}else{var P=A.toFixed(0);l(E,((s+z)/1e3).toFixed(2)+"s","ease-out"),m(E,P),p(function(){if(E.enabled)if(c("惯性回弹","s="+u.toFixed(0),"t=400"),A!==u){var a=u.toFixed(0);l(E,"0.4s","ease"),m(E,a),p(D,400)}else D()},1e3*((s+z)/1e3).toFixed(2))}else D()}else{c("惯性计算没有超出边缘");var Q=o.generateCubicBezier();if(k.useFrameAnimation){var K=n-h,O=b.cubicbezier(Q[0][0],Q[0][1],Q[1][0],Q[1][1]);H=new b.animation(f.toFixed(0),O,function(a,b){var c=(h+K*b).toFixed(2);m(E,c),i(E,"scrolling",{afterFlick:!0})}),H.play().then(D)}else{var P=n.toFixed(0);l(E,(f/1e3).toFixed(2)+"s","cubic-bezier("+Q+")"),m(E,P),p(D,1e3*(f/1e3).toFixed(2))}}M=!0,k.useFrameAnimation||b.animation.requestFrame(function(){L&&M&&E.enabled&&(i(E,"scrolling",{afterFlick:!0}),b.animation.requestFrame(arguments.callee))})}}function D(){E.enabled&&(N=!1,setTimeout(function(){!N&&L&&(L=!1,M=!1,k.useFrameAnimation?(H&&H.stop(),H=null):l(E,"",""),i(E,"scrollend"))},50))}var E=this;if(k=k||{},k.noBounce=!!k.noBounce,k.padding=k.padding||{},k.isPrevent=null==k.isPrevent?!0:!!k.isPrevent,k.isFixScrollendClick=null==k.isFixScrollendClick?!0:!!k.isFixScrollendClick,k.padding?(k.yPaddingTop=-k.padding.top||0,k.yPaddingBottom=-k.padding.bottom||0,k.xPaddingTop=-k.padding.left||0,k.xPaddingBottom=-k.padding.right||0):(k.yPaddingTop=0,k.yPaddingBottom=0,k.xPaddingTop=0,k.xPaddingBottom=0),k.direction=k.direction||"y",k.inertia=k.inertia||"normal",this.options=k,E.axis=k.direction,this.element=a,this.viewport=a.parentNode,this.plugins={},this.element.scrollId=setTimeout(function(){q[E.element.scrollId+""]=E},1),this.viewport.addEventListener("touchstart",v,!1),this.viewport.addEventListener("touchend",w,!1),this.viewport.addEventListener("touchcancel",w,!1),this.viewport.addEventListener("panstart",y,!1),this.viewport.addEventListener("pan",z,!1),this.viewport.addEventListener("panend",B,!1),k.isPrevent&&(this.viewport.addEventListener("touchstart",function(){A=!0},!1),E.viewport.addEventListener("touchend",function(){A=!1},!1)),k.isFixScrollendClick){var F,G;this.viewport.addEventListener("scrolling",function(){F=!0,G&&clearTimeout(G),G=setTimeout(function(){F=!1},400)},!1),this.viewport.addEventListener("click",n,!1),this.viewport.addEventListener("tap",o,!1)}if(k.useFrameAnimation){var H;Object.defineProperty(this,"animation",{get:function(){return H}})}else{var I,J=0;a.addEventListener(u?"transitionend":x+"TransitionEnd",function(a){if(I){var c=I;I=null,clearTimeout(J),b.animation.requestFrame(function(){c(a)})}},!1)}var K,L,M,N;Object.defineProperty(this,"isScrolling",{get:function(){return!!L}});var O,P={init:function(){return this.enable(),this.refresh(),this.scrollTo(0),this},enable:function(){return this.enabled=!0,this},disable:function(){var a=this.element;return this.enabled=!1,this.options.useFrameAnimation?H&&H.stop():b.animation.requestFrame(function(){a.style[x+"Transform"]=getComputedStyle(a)[x+"Transform"]}),this},getScrollWidth:function(){return d(this.element).width},getScrollHeight:function(){return d(this.element).height},getScrollLeft:function(){return-j(this).x-this.options.xPaddingTop},getScrollTop:function(){return-j(this).y-this.options.yPaddingTop},getMaxScrollLeft:function(){return-E.maxScrollOffset-this.options.xPaddingTop},getMaxScrollTop:function(){return-E.maxScrollOffset-this.options.yPaddingTop},getBoundaryOffset:function(){return Math.abs(g(this,j(this)[this.axis])||0)},refresh:function(){var a=this.element,b="y"===this.axis,c=b?"height":"width";if(null!=this.options[c])a.style[c]=this.options[c]+"px";else if(this.options.useElementRect)a.style[c]="auto",a.style[c]=d(a)[c]+"px";else if(a.childElementCount>0){var g,h,k=a.firstElementChild,l=a.lastElementChild;if(document.createRange&&!this.options.ignoreOverflow&&(g=document.createRange(),g.selectNodeContents(a),h=d(g)),h)a.style[c]=h[c]+"px";else{for(;k&&0===d(k)[c]&&k.nextElementSibling;)k=k.nextElementSibling;for(;l&&l!==k&&0===d(l)[c]&&l.previousElementSibling;)l=l.previousElementSibling;a.style[c]=d(l)[b?"bottom":"right"]-d(k)[b?"top":"left"]+"px"}}return this.transformOffset=j(this),this.minScrollOffset=e(this),this.maxScrollOffset=f(this),this.scrollTo(-this.transformOffset[this.axis]-this.options[this.axis+"PaddingTop"]),i(this,"contentrefresh"),this},offset:function(a){var b=d(this.element),c=d(a);if("y"===this.axis){var e={top:c.top-b.top-this.options.yPaddingTop,left:c.left-b.left,right:b.right-c.right,width:c.width,height:c.height};e.bottom=e.top+e.height}else{var e={top:c.top-b.top,bottom:b.bottom-c.bottom,left:c.left-b.left-this.options.xPaddingTop,width:c.width,height:c.height};e.right=e.left+e.width}return e},getRect:function(a){var b=d(this.viewport),c=d(a);if("y"===this.axis){var e={top:c.top-b.top,left:c.left-b.left,right:b.right-c.right,width:c.width,height:c.height};e.bottom=e.top+e.height}else{var e={top:c.top-b.top,bottom:b.bottom-c.bottom,left:c.left-b.left,width:c.width,height:c.height};e.right=e.left+e.width}return e},isInView:function(a){var b=this.getRect(this.viewport),c=this.getRect(a);return"y"===this.axis?b.top<c.bottom&&b.bottom>c.top:b.left<c.right&&b.right>c.left},scrollTo:function(a,c){{var d=this;this.element}if(a=-a-this.options[this.axis+"PaddingTop"],a=h(this,a),L=!0,c===!0)if(this.options.useFrameAnimation){var e=j(d)[this.axis],f=a-e;H=new b.animation(400,b.cubicbezier.ease,function(a,b){var c=(e+f*b).toFixed(2);m(d,c),i(d,"scrolling")}),H.play().then(D)}else l(d,"0.4s","ease"),m(d,a),p(D,400),b.animation.requestFrame(function(){L&&d.enabled&&(i(d,"scrolling"),b.animation.requestFrame(arguments.callee))});else this.options.useFrameAnimation||l(d,"",""),m(d,a),D();return this},scrollToElement:function(a,b){var c=this.offset(a);return c=c["y"===this.axis?"top":"left"],this.scrollTo(c,b)},getViewWidth:function(){return d(this.viewport).width},getViewHeight:function(){return d(this.viewport).height},addPulldownHandler:function(a){var b=this;return this.element.addEventListener("pulldownend",function(c){b.disable(),a.call(b,c,function(){b.scrollTo(0,!0),b.refresh(),b.enable()})},!1),this},addPullupHandler:function(a){var b=this;return this.element.addEventListener("pullupend",function(c){b.disable(),a.call(b,c,function(){b.scrollTo(b.getScrollHeight(),!0),b.refresh(),b.enable()})},!1),this},addScrollstartHandler:function(a){var b=this;return this.element.addEventListener("scrollstart",function(c){a.call(b,c)},!1),this},addScrollingHandler:function(a){var b=this;return this.element.addEventListener("scrolling",function(c){a.call(b,c)},!1),this},addScrollendHandler:function(a){var b=this;return this.element.addEventListener("scrollend",function(c){a.call(b,c)},!1),this},addContentrenfreshHandler:function(a){var b=this;this.element.addEventListener("contentrefresh",function(c){a.call(b,c)},!1)},addEventListener:function(a,b,c){var d=this;this.element.addEventListener(a,function(a){b.call(d,a)},!!c)},removeEventListener:function(a,b){var c=this;this.element.removeEventListener(a,function(a){b.call(c,a)})},enablePlugin:function(a,b){var c=r[a];return c&&!this.plugins[a]&&(this.plugins[a]=!0,b=b||{},c.call(this,a,b)),this}};for(var Q in P)this[Q]=P[Q];delete P}var o=a.document,p=a.navigator.userAgent,q={},r={},s=a.dpr||(a.navigator.userAgent.match(/iPhone|iPad|iPod/)?document.documentElement.clientWidth/a.screen.availWidth:1),t={normal:[2*s,.0015*s],slow:[1.5*s,.003*s],veryslow:[1.5*s,.005*s]},u=!!p.match(/Firefox/i),v=!!p.match(/IEMobile/i),w=u?"-moz-":v?"-ms-":"-webkit-",x=u?"Moz":v?"ms":"webkit",y=v?"MSCSSMatrix":"WebKitCSSMatrix",z=!!u||y in a&&"m11"in new a[y],A=!1;o.addEventListener("touchmove",function(a){return A?(a.preventDefault(),!1):!0},!1),b.scroll=function(a,c){if(1===arguments.length&&!(arguments[0]instanceof HTMLElement))if(c=arguments[0],c.scrollElement)a=c.scrollElement;else{if(!c.scrollWrap)throw new Error("no scroll element");a=c.scrollWrap.firstElementChild}if(!a.parentNode)throw new Error("wrong dom tree");if(c&&c.direction&&["x","y"].indexOf(c.direction)<0)throw new Error("wrong direction");var d;return d=c.downgrade===!0&&b.scroll.downgrade?b.scroll.downgrade(a,c):a.scrollId?q[a.scrollId]:new n(a,c)},b.scroll.plugin=function(a,b){return b?(a=a.split(","),a.forEach(function(a){r[a]=b}),void 0):r[a]}}(window,window.lib||(window.lib={}));
/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;
/******/
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var _this = this;
	
	__webpack_require__(1);
	
	__webpack_require__(4);
	
	var _libPromise = __webpack_require__(6);
	
	var win = window;
	var doc = win.document;
	
	$on.call(doc, 'touchmove', function (e) {
	    e.preventDefault();
	});
	
	var CONTAINER = '\n<div id="wrap">\n    <div id="logo"></div>\n    <div id="tips">请在电脑上浏览本站<br>please visit this website via PC</div>\n    <a id="story-btn">THE STORY</a>\n</div>\n<div id="story"></div>\n';
	
	var PATH = 'assets/story';
	
	var STORY = '\n<div class="scrollWrap">\n    <div class="scrollElement">\n        <div class="slogan"><img src="' + PATH + '/slogan.jpg"></div>\n        <section>\n            <p class="en">Among all the sounds in nature, wind is the most mysterious. It is a messenger of nature, wind communicates to humans. Our Team, the Creators from Saatchi & Saatchi GZ, try to collect these messages.We want to re-express nature found in prosperity,  through a Concert of the Wind.</p>\n            <p class="cn">大自然的声音里面，风是最神秘的。以风为信使，大自然向人们传递讯息。我们的团队，广州 Saatchi & Saatchi 的创意者们，尝试把这些信息收集起来。用一场风的音乐会，让人们再次重视繁华下的自然。</p>\n        </section>\n        <div class="video">\n            <video controls\n                crossorigin="anonymous"\n                poster="' + PATH + '/poster.jpg"\n                preload="auto">\n            </video>\n        </div>\n        <section>\n            <p class="en">First, we look for the best location to catch the wind. Shenzhen mirrors China in its miraculous speed of progress. And 600 meters PAFC is at the top of Shenzhen, where the sky, land and humans meet. This is where the wind chose.</p>\n            <p class="cn">首先要找到合适的捕风地。深圳速度堪称为奇迹，是中国的缩影。600米高的PAFC（深圳平安金融大厦）就在这个奇迹之颠。这里，连接天、地与人，没有比这更适合的了，是风选择了这里。</p>\n            <p class="en">It is more difficult to preserve wind as it is than to change it. We had to do a lot of calculations to create this instrument, which is designed specifically to catch the sound of the wind.We invite the artists from Nexus Interactive Arts to design such a special windtrument.</p>\n            <p class="cn">保留风的原貌比改变它更难。为了捕捉到风的原始形态，需要经过精密计算，设计特殊乐器收集这些珍贵的音频。为此，我们邀请了伦敦艺术团队Nexus Interactive Arts，耗时2个月，设计了这一独特的捕风装置。</p>       \n        </section>\n        <div class="img"><img src="' + PATH + '/banner.jpg"></div>\n        <div class="img"><img src="' + PATH + '/img1.jpg"></div>\n        <div class="img"><img src="' + PATH + '/img2.jpg"></div>\n        <div class="img"><img src="' + PATH + '/img3.jpg"></div>\n        <div class="img"><img src="' + PATH + '/img4.jpg"></div>\n        <section>\n            <p class="en">The wind is collected at one end and the pure sounds of nature is saved after travelling the length of each tube, thereby preserving the true, original sound.</p>\n            <p class="cn">我们从特殊装置末端收集穿梭每一条铝管的风，从而实现保留最真实、最纯粹的风的音符。</p>\n            <p class="en">The wind shows us its different forms in different times. We want to recover its true sound and present it in music. Well-known jazz musician and composer Dr. Wang Cong, cooperating with Etienne Schwarcz, lighting director of the closing ceremony of Athens Olympics, helped us to make it come true. Wind sounds of 600 meters above the ground was firstly collected, based on features of wind at different times as well as 12 Earthly Time Branches (an ancient Chinese time measure), and sculpted the wind into 8 different pieces of music.</p>\n            <p class="cn">风在不同的时间段表现出不同的生命力。我们要做的，是通过音乐让风声返璞归真。著名爵士音乐家和作曲家王璁博士帮我们实现了这一点，她联合希腊奥运多媒体、灯光总监Etienne Schwarc，通过在600米高空的捕风取样，根据风声在城市中不同时间段的不同特点、按照中国传统的12时辰划分为8段，形成一张独特的风之音乐原声大碟。</p>\n            <p class="en">This is a great attempt for art and technology. We were hoping to recall people’s respect for nature. Instead, a miracle was created. <!--Here is the album, feel free to download and share it. Enjoy~--></p>\n            <p class="cn">这是一次新的艺术与科技的尝试，我们希望做一些实实在在的东西，唤起人们对自然的敬畏。而我们也确实实现了这一奇迹。<!--以下是完整的专辑，请随意聆听、下载和分享，尽情地感受自然吧。--></p>\n        </section>\n        <div class="video">\n            <video controls\n                crossorigin="anonymous"\n                poster="' + PATH + '/poster.jpg"\n                preload="auto">\n            </video>\n        </div>\n    </div>\n</div>\n<div class="close"></div>\n';
	
	var $storyBtn;
	var $story;
	var storyScroll;
	
	(function callee$0$0() {
	    var _context;
	
	    return regeneratorRuntime.async(function callee$0$0$(context$1$0) {
	        while (1) switch (context$1$0.prev = context$1$0.next) {
	            case 0:
	                context$1$0.next = 2;
	                return regeneratorRuntime.awrap((0, _libPromise.domReady)());
	
	            case 2:
	
	                (_context = $find.call(doc, 'body'), $append).call(_context, CONTAINER);
	
	                $storyBtn = $find.call(doc, '#story-btn');
	                $story = $find.call(doc, '#story');
	
	                (_context = $story, $append).call(_context, STORY);
	
	                storyScroll = new win.lib.scroll({
	                    scrollWrap: (_context = $story, $find).call(_context, '.scrollWrap'),
	                    scrollElement: (_context = $story, $find).call(_context, '.scrollElement')
	                });
	                storyScroll.init();
	
	                (_context = $storyBtn, $on).call(_context, 'click', function callee$1$0() {
	                    var _context2;
	
	                    return regeneratorRuntime.async(function callee$1$0$(context$2$0) {
	                        while (1) switch (context$2$0.prev = context$2$0.next) {
	                            case 0:
	                                (_context2 = $story, $addClass).call(_context2, 'anime');
	
	                                context$2$0.next = 3;
	                                return regeneratorRuntime.awrap((0, _libPromise.delay)(10));
	
	                            case 3:
	
	                                (_context2 = $story, $addClass).call(_context2, 'show');
	
	                                context$2$0.next = 6;
	                                return regeneratorRuntime.awrap(Promise.race([(0, _libPromise.waitForEvent)($story, 'webkitTranstionEnd'), (0, _libPromise.waitForEvent)($story, 'transitionend'), (0, _libPromise.delay)(400)]));
	
	                            case 6:
	
	                                storyScroll.refresh();
	
	                            case 7:
	                            case 'end':
	                                return context$2$0.stop();
	                        }
	                    }, null, this);
	                });
	
	                (_context = (_context = $story, $find).call(_context, '.close'), $on).call(_context, 'click', function callee$1$0() {
	                    var _context3;
	
	                    return regeneratorRuntime.async(function callee$1$0$(context$2$0) {
	                        while (1) switch (context$2$0.prev = context$2$0.next) {
	                            case 0:
	                                (_context3 = $story, $removeClass).call(_context3, 'show');
	
	                                context$2$0.next = 3;
	                                return regeneratorRuntime.awrap(Promise.race([(0, _libPromise.waitForEvent)($story, 'webkitTranstionEnd'), (0, _libPromise.waitForEvent)($story, 'transitionend'), (0, _libPromise.delay)(400)]));
	
	                            case 3:
	
	                                (_context3 = $story, $removeClass).call(_context3, 'anime');
	
	                            case 4:
	                            case 'end':
	                                return context$2$0.stop();
	                        }
	                    }, null, this);
	                });
	
	            case 10:
	            case 'end':
	                return context$1$0.stop();
	        }
	    }, null, _this);
	})();

/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	// style-loader: Adds some css to the DOM by adding a <style> tag
	
	// load the styles
	var content = __webpack_require__(2);
	if(typeof content === 'string') content = [[module.id, content, '']];
	// add the styles to the DOM
	var update = __webpack_require__(3)(content, {});
	if(content.locals) module.exports = content.locals;
	// Hot Module Replacement
	if(false) {
		// When the styles change, update the <style> tags
		if(!content.locals) {
			module.hot.accept("!!./../../node_modules/raw-loader/index.js!./../../node_modules/less-loader/index.js!./main.less", function() {
				var newContent = require("!!./../../node_modules/raw-loader/index.js!./../../node_modules/less-loader/index.js!./main.less");
				if(typeof newContent === 'string') newContent = [[module.id, newContent, '']];
				update(newContent);
			});
		}
		// When the module is disposed, remove the <style> tags
		module.hot.dispose(function() { update(); });
	}

/***/ },
/* 2 */
/***/ function(module, exports) {

	module.exports = "html,\nbody {\n  width: 100%;\n  height: 100%;\n  overflow: hidden;\n  font-family: \"Microsoft YaHei\", \"SC Heiti\", sans-serif;\n}\n#wrap {\n  position: absolute;\n  width: 100%;\n  height: 100%;\n  left: 0;\n  top: 0;\n  overflow: hidden;\n  background: url(assets/bg.jpg) no-repeat center center;\n  background-size: cover;\n}\n#logo {\n  position: absolute;\n  width: 7.546875rem;\n  height: 5.734375rem;\n  top: 50%;\n  left: 50%;\n  margin-top: -2.8671875rem;\n  margin-left: -3.7734375rem;\n  background: url(assets/logo.png) no-repeat center center;\n  background-size: contain;\n}\n#tips {\n  position: absolute;\n  left: 0;\n  right: 0;\n  text-align: center;\n  line-height: 2em;\n  font-size: 0.375rem;\n  color: #FFF;\n  top: 70%;\n}\n#story-btn {\n  position: absolute;\n  width: 4.375rem;\n  height: 1.09375rem;\n  top: 80%;\n  left: 50%;\n  margin-left: -2.1875rem;\n  box-sizing: border-box;\n  border: 1px solid #FFF;\n  font-size: 0.5rem;\n  color: #FFF;\n  text-align: center;\n  line-height: 1.0625rem;\n}\n#story {\n  width: 100%;\n  height: 100%;\n  left: 0;\n  top: 0;\n  overflow: hidden;\n  position: absolute;\n  background-color: #FFF;\n  -webkit-transform: translateY(100%);\n  transform: translateY(100%);\n}\n#story.show {\n  -webkit-transform: translateY(0);\n  transform: translateY(0);\n}\n#story.anime {\n  -webkit-transition: -webkit-transform 0.4s ease 0s;\n  transition: transform 0.4s ease 0s;\n}\n#story img {\n  width: 100%;\n  vertical-align: middle;\n  font-size: 0;\n  line-height: 0;\n}\n#story .scrollWrap {\n  width: 100%;\n  height: 100%;\n  overflow: hidden;\n}\n#story .scrollElement > * {\n  margin-left: auto;\n  margin-right: auto;\n  overflow: hidden;\n}\n#story .slogan {\n  width: 5.46875rem;\n  height: 1.328125rem;\n  padding-top: 1.875rem;\n}\n#story section {\n  width: 7.5625rem;\n  padding-top: 0.625rem;\n}\n#story section p {\n  font-size: 0.375rem;\n  color: #000;\n  margin: 0;\n  padding-top: 0.3125rem;\n  line-height: 1.5em;\n}\n#story .video {\n  width: 9.53125rem;\n  height: 5.3125rem;\n  margin-top: 0.625rem;\n}\n#story .video video {\n  width: 100%;\n  height: 100%;\n}\n#story .img {\n  width: 100%;\n  margin-top: 1.25rem;\n}\n#story .close {\n  position: absolute;\n  width: 0.84375rem;\n  height: 0.84375rem;\n  overflow: hidden;\n  background: url(assets/story/close.png) no-repeat center center;\n  background-size: contain;\n  right: 0.4375rem;\n  top: 0.4375rem;\n}\n"

/***/ },
/* 3 */
/***/ function(module, exports, __webpack_require__) {

	/*
		MIT License http://www.opensource.org/licenses/mit-license.php
		Author Tobias Koppers @sokra
	*/
	var stylesInDom = {},
		memoize = function(fn) {
			var memo;
			return function () {
				if (typeof memo === "undefined") memo = fn.apply(this, arguments);
				return memo;
			};
		},
		isOldIE = memoize(function() {
			return /msie [6-9]\b/.test(window.navigator.userAgent.toLowerCase());
		}),
		getHeadElement = memoize(function () {
			return document.head || document.getElementsByTagName("head")[0];
		}),
		singletonElement = null,
		singletonCounter = 0;
	
	module.exports = function(list, options) {
		if(false) {
			if(typeof document !== "object") throw new Error("The style-loader cannot be used in a non-browser environment");
		}
	
		options = options || {};
		// Force single-tag solution on IE6-9, which has a hard limit on the # of <style>
		// tags it will allow on a page
		if (typeof options.singleton === "undefined") options.singleton = isOldIE();
	
		var styles = listToStyles(list);
		addStylesToDom(styles, options);
	
		return function update(newList) {
			var mayRemove = [];
			for(var i = 0; i < styles.length; i++) {
				var item = styles[i];
				var domStyle = stylesInDom[item.id];
				domStyle.refs--;
				mayRemove.push(domStyle);
			}
			if(newList) {
				var newStyles = listToStyles(newList);
				addStylesToDom(newStyles, options);
			}
			for(var i = 0; i < mayRemove.length; i++) {
				var domStyle = mayRemove[i];
				if(domStyle.refs === 0) {
					for(var j = 0; j < domStyle.parts.length; j++)
						domStyle.parts[j]();
					delete stylesInDom[domStyle.id];
				}
			}
		};
	}
	
	function addStylesToDom(styles, options) {
		for(var i = 0; i < styles.length; i++) {
			var item = styles[i];
			var domStyle = stylesInDom[item.id];
			if(domStyle) {
				domStyle.refs++;
				for(var j = 0; j < domStyle.parts.length; j++) {
					domStyle.parts[j](item.parts[j]);
				}
				for(; j < item.parts.length; j++) {
					domStyle.parts.push(addStyle(item.parts[j], options));
				}
			} else {
				var parts = [];
				for(var j = 0; j < item.parts.length; j++) {
					parts.push(addStyle(item.parts[j], options));
				}
				stylesInDom[item.id] = {id: item.id, refs: 1, parts: parts};
			}
		}
	}
	
	function listToStyles(list) {
		var styles = [];
		var newStyles = {};
		for(var i = 0; i < list.length; i++) {
			var item = list[i];
			var id = item[0];
			var css = item[1];
			var media = item[2];
			var sourceMap = item[3];
			var part = {css: css, media: media, sourceMap: sourceMap};
			if(!newStyles[id])
				styles.push(newStyles[id] = {id: id, parts: [part]});
			else
				newStyles[id].parts.push(part);
		}
		return styles;
	}
	
	function createStyleElement() {
		var styleElement = document.createElement("style");
		var head = getHeadElement();
		styleElement.type = "text/css";
		head.appendChild(styleElement);
		return styleElement;
	}
	
	function createLinkElement() {
		var linkElement = document.createElement("link");
		var head = getHeadElement();
		linkElement.rel = "stylesheet";
		head.appendChild(linkElement);
		return linkElement;
	}
	
	function addStyle(obj, options) {
		var styleElement, update, remove;
	
		if (options.singleton) {
			var styleIndex = singletonCounter++;
			styleElement = singletonElement || (singletonElement = createStyleElement());
			update = applyToSingletonTag.bind(null, styleElement, styleIndex, false);
			remove = applyToSingletonTag.bind(null, styleElement, styleIndex, true);
		} else if(obj.sourceMap &&
			typeof URL === "function" &&
			typeof URL.createObjectURL === "function" &&
			typeof URL.revokeObjectURL === "function" &&
			typeof Blob === "function" &&
			typeof btoa === "function") {
			styleElement = createLinkElement();
			update = updateLink.bind(null, styleElement);
			remove = function() {
				styleElement.parentNode.removeChild(styleElement);
				if(styleElement.href)
					URL.revokeObjectURL(styleElement.href);
			};
		} else {
			styleElement = createStyleElement();
			update = applyToTag.bind(null, styleElement);
			remove = function() {
				styleElement.parentNode.removeChild(styleElement);
			};
		}
	
		update(obj);
	
		return function updateStyle(newObj) {
			if(newObj) {
				if(newObj.css === obj.css && newObj.media === obj.media && newObj.sourceMap === obj.sourceMap)
					return;
				update(obj = newObj);
			} else {
				remove();
			}
		};
	}
	
	var replaceText = (function () {
		var textStore = [];
	
		return function (index, replacement) {
			textStore[index] = replacement;
			return textStore.filter(Boolean).join('\n');
		};
	})();
	
	function applyToSingletonTag(styleElement, index, remove, obj) {
		var css = remove ? "" : obj.css;
	
		if (styleElement.styleSheet) {
			styleElement.styleSheet.cssText = replaceText(index, css);
		} else {
			var cssNode = document.createTextNode(css);
			var childNodes = styleElement.childNodes;
			if (childNodes[index]) styleElement.removeChild(childNodes[index]);
			if (childNodes.length) {
				styleElement.insertBefore(cssNode, childNodes[index]);
			} else {
				styleElement.appendChild(cssNode);
			}
		}
	}
	
	function applyToTag(styleElement, obj) {
		var css = obj.css;
		var media = obj.media;
		var sourceMap = obj.sourceMap;
	
		if(media) {
			styleElement.setAttribute("media", media)
		}
	
		if(styleElement.styleSheet) {
			styleElement.styleSheet.cssText = css;
		} else {
			while(styleElement.firstChild) {
				styleElement.removeChild(styleElement.firstChild);
			}
			styleElement.appendChild(document.createTextNode(css));
		}
	}
	
	function updateLink(linkElement, obj) {
		var css = obj.css;
		var media = obj.media;
		var sourceMap = obj.sourceMap;
	
		if(sourceMap) {
			// http://stackoverflow.com/a/26603875
			css += "\n/*# sourceMappingURL=data:application/json;base64," + btoa(unescape(encodeURIComponent(JSON.stringify(sourceMap)))) + " */";
		}
	
		var blob = new Blob([css], { type: "text/css" });
	
		var oldSrc = linkElement.href;
	
		linkElement.href = URL.createObjectURL(blob);
	
		if(oldSrc)
			URL.revokeObjectURL(oldSrc);
	}


/***/ },
/* 4 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	Object.defineProperty(exports, '__esModule', {
	    value: true
	});
	
	__webpack_require__(5);
	
	var Zepto = window.Zepto;
	var originFn = Zepto.fn;
	
	function isUndef() {
	    return typeof this === 'undefined';
	}
	
	function isNull() {
	    return typeof this == null;
	}
	
	var fn = {};
	
	exports.fn = fn;
	
	var _loop = function (_name) {
	    var value = originFn[value];
	    fn[_name] = window['$' + _name] = function () {
	        var _Zepto2;
	
	        if (isUndef.call(this)) {
	            throw new Error('Uncaught TypeError: Cannot read property \'' + _name + '\' of undefined');
	        } else if (isNull.call(this)) {
	            throw new Error('Uncaught TypeError: Cannot read property \'' + _name + '\' of null');
	        }
	        var r = (_Zepto2 = Zepto(this))[_name].apply(_Zepto2, arguments);
	        if (r && r.__proto__ === originFn && r.length === 1) {
	            if (r.length === 1) {
	                return r[0];
	            } else {
	                return Array.from(r);
	            }
	        } else {
	            return r;
	        }
	    };
	};
	
	for (var _name in originFn) {
	    _loop(_name);
	}
	
	fn.findAll = window.$findAll = function () {
	    var _Zepto;
	
	    if (isUndef.call(this)) {
	        throw new Error('Uncaught TypeError: Cannot read property \'findAll\' of undefined');
	    } else if (isNull.call(this)) {
	        throw new Error('Uncaught TypeError: Cannot read property \'findAll\' of null');
	    }
	    return Array.from((_Zepto = Zepto(this)).find.apply(_Zepto, arguments));
	};

/***/ },
/* 5 */
/***/ function(module, exports) {

	/* Zepto v1.0-1-ga3cab6c - polyfill zepto detect event ajax form fx - zeptojs.com/license */
	(function(a){String.prototype.trim===a&&(String.prototype.trim=function(){return this.replace(/^\s+|\s+$/g,"")}),Array.prototype.reduce===a&&(Array.prototype.reduce=function(b){if(this===void 0||this===null)throw new TypeError;var c=Object(this),d=c.length>>>0,e=0,f;if(typeof b!="function")throw new TypeError;if(d==0&&arguments.length==1)throw new TypeError;if(arguments.length>=2)f=arguments[1];else do{if(e in c){f=c[e++];break}if(++e>=d)throw new TypeError}while(!0);while(e<d)e in c&&(f=b.call(a,f,c[e],e,c)),e++;return f})})();var Zepto=function(){function E(a){return a==null?String(a):y[z.call(a)]||"object"}function F(a){return E(a)=="function"}function G(a){return a!=null&&a==a.window}function H(a){return a!=null&&a.nodeType==a.DOCUMENT_NODE}function I(a){return E(a)=="object"}function J(a){return I(a)&&!G(a)&&a.__proto__==Object.prototype}function K(a){return a instanceof Array}function L(a){return typeof a.length=="number"}function M(a){return g.call(a,function(a){return a!=null})}function N(a){return a.length>0?c.fn.concat.apply([],a):a}function O(a){return a.replace(/::/g,"/").replace(/([A-Z]+)([A-Z][a-z])/g,"$1_$2").replace(/([a-z\d])([A-Z])/g,"$1_$2").replace(/_/g,"-").toLowerCase()}function P(a){return a in j?j[a]:j[a]=new RegExp("(^|\\s)"+a+"(\\s|$)")}function Q(a,b){return typeof b=="number"&&!l[O(a)]?b+"px":b}function R(a){var b,c;return i[a]||(b=h.createElement(a),h.body.appendChild(b),c=k(b,"").getPropertyValue("display"),b.parentNode.removeChild(b),c=="none"&&(c="block"),i[a]=c),i[a]}function S(a){return"children"in a?f.call(a.children):c.map(a.childNodes,function(a){if(a.nodeType==1)return a})}function T(c,d,e){for(b in d)e&&(J(d[b])||K(d[b]))?(J(d[b])&&!J(c[b])&&(c[b]={}),K(d[b])&&!K(c[b])&&(c[b]=[]),T(c[b],d[b],e)):d[b]!==a&&(c[b]=d[b])}function U(b,d){return d===a?c(b):c(b).filter(d)}function V(a,b,c,d){return F(b)?b.call(a,c,d):b}function W(a,b,c){c==null?a.removeAttribute(b):a.setAttribute(b,c)}function X(b,c){var d=b.className,e=d&&d.baseVal!==a;if(c===a)return e?d.baseVal:d;e?d.baseVal=c:b.className=c}function Y(a){var b;try{return a?a=="true"||(a=="false"?!1:a=="null"?null:isNaN(b=Number(a))?/^[\[\{]/.test(a)?c.parseJSON(a):a:b):a}catch(d){return a}}function Z(a,b){b(a);for(var c in a.childNodes)Z(a.childNodes[c],b)}var a,b,c,d,e=[],f=e.slice,g=e.filter,h=window.document,i={},j={},k=h.defaultView.getComputedStyle,l={"column-count":1,columns:1,"font-weight":1,"line-height":1,opacity:1,"z-index":1,zoom:1},m=/^\s*<(\w+|!)[^>]*>/,n=/<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\w:]+)[^>]*)\/>/ig,o=/^(?:body|html)$/i,p=["val","css","html","text","data","width","height","offset"],q=["after","prepend","before","append"],r=h.createElement("table"),s=h.createElement("tr"),t={tr:h.createElement("tbody"),tbody:r,thead:r,tfoot:r,td:s,th:s,"*":h.createElement("div")},u=/complete|loaded|interactive/,v=/^\.([\w-]+)$/,w=/^#([\w-]*)$/,x=/^[\w-]+$/,y={},z=y.toString,A={},B,C,D=h.createElement("div");return A.matches=function(a,b){if(!a||a.nodeType!==1)return!1;var c=a.webkitMatchesSelector||a.mozMatchesSelector||a.oMatchesSelector||a.matchesSelector;if(c)return c.call(a,b);var d,e=a.parentNode,f=!e;return f&&(e=D).appendChild(a),d=~A.qsa(e,b).indexOf(a),f&&D.removeChild(a),d},B=function(a){return a.replace(/-+(.)?/g,function(a,b){return b?b.toUpperCase():""})},C=function(a){return g.call(a,function(b,c){return a.indexOf(b)==c})},A.fragment=function(b,d,e){b.replace&&(b=b.replace(n,"<$1></$2>")),d===a&&(d=m.test(b)&&RegExp.$1),d in t||(d="*");var g,h,i=t[d];return i.innerHTML=""+b,h=c.each(f.call(i.childNodes),function(){i.removeChild(this)}),J(e)&&(g=c(h),c.each(e,function(a,b){p.indexOf(a)>-1?g[a](b):g.attr(a,b)})),h},A.Z=function(a,b){return a=a||[],a.__proto__=c.fn,a.selector=b||"",a},A.isZ=function(a){return a instanceof A.Z},A.init=function(b,d){if(!b)return A.Z();if(F(b))return c(h).ready(b);if(A.isZ(b))return b;var e;if(K(b))e=M(b);else if(I(b))e=[J(b)?c.extend({},b):b],b=null;else if(m.test(b))e=A.fragment(b.trim(),RegExp.$1,d),b=null;else{if(d!==a)return c(d).find(b);e=A.qsa(h,b)}return A.Z(e,b)},c=function(a,b){return A.init(a,b)},c.extend=function(a){var b,c=f.call(arguments,1);return typeof a=="boolean"&&(b=a,a=c.shift()),c.forEach(function(c){T(a,c,b)}),a},A.qsa=function(a,b){var c;return H(a)&&w.test(b)?(c=a.getElementById(RegExp.$1))?[c]:[]:a.nodeType!==1&&a.nodeType!==9?[]:f.call(v.test(b)?a.getElementsByClassName(RegExp.$1):x.test(b)?a.getElementsByTagName(b):a.querySelectorAll(b))},c.contains=function(a,b){return a!==b&&a.contains(b)},c.type=E,c.isFunction=F,c.isWindow=G,c.isArray=K,c.isPlainObject=J,c.isEmptyObject=function(a){var b;for(b in a)return!1;return!0},c.inArray=function(a,b,c){return e.indexOf.call(b,a,c)},c.camelCase=B,c.trim=function(a){return a.trim()},c.uuid=0,c.support={},c.expr={},c.map=function(a,b){var c,d=[],e,f;if(L(a))for(e=0;e<a.length;e++)c=b(a[e],e),c!=null&&d.push(c);else for(f in a)c=b(a[f],f),c!=null&&d.push(c);return N(d)},c.each=function(a,b){var c,d;if(L(a)){for(c=0;c<a.length;c++)if(b.call(a[c],c,a[c])===!1)return a}else for(d in a)if(b.call(a[d],d,a[d])===!1)return a;return a},c.grep=function(a,b){return g.call(a,b)},window.JSON&&(c.parseJSON=JSON.parse),c.each("Boolean Number String Function Array Date RegExp Object Error".split(" "),function(a,b){y["[object "+b+"]"]=b.toLowerCase()}),c.fn={forEach:e.forEach,reduce:e.reduce,push:e.push,sort:e.sort,indexOf:e.indexOf,concat:e.concat,map:function(a){return c(c.map(this,function(b,c){return a.call(b,c,b)}))},slice:function(){return c(f.apply(this,arguments))},ready:function(a){return u.test(h.readyState)?a(c):h.addEventListener("DOMContentLoaded",function(){a(c)},!1),this},get:function(b){return b===a?f.call(this):this[b>=0?b:b+this.length]},toArray:function(){return this.get()},size:function(){return this.length},remove:function(){return this.each(function(){this.parentNode!=null&&this.parentNode.removeChild(this)})},each:function(a){return e.every.call(this,function(b,c){return a.call(b,c,b)!==!1}),this},filter:function(a){return F(a)?this.not(this.not(a)):c(g.call(this,function(b){return A.matches(b,a)}))},add:function(a,b){return c(C(this.concat(c(a,b))))},is:function(a){return this.length>0&&A.matches(this[0],a)},not:function(b){var d=[];if(F(b)&&b.call!==a)this.each(function(a){b.call(this,a)||d.push(this)});else{var e=typeof b=="string"?this.filter(b):L(b)&&F(b.item)?f.call(b):c(b);this.forEach(function(a){e.indexOf(a)<0&&d.push(a)})}return c(d)},has:function(a){return this.filter(function(){return I(a)?c.contains(this,a):c(this).find(a).size()})},eq:function(a){return a===-1?this.slice(a):this.slice(a,+a+1)},first:function(){var a=this[0];return a&&!I(a)?a:c(a)},last:function(){var a=this[this.length-1];return a&&!I(a)?a:c(a)},find:function(a){var b,d=this;return typeof a=="object"?b=c(a).filter(function(){var a=this;return e.some.call(d,function(b){return c.contains(b,a)})}):this.length==1?b=c(A.qsa(this[0],a)):b=this.map(function(){return A.qsa(this,a)}),b},closest:function(a,b){var d=this[0],e=!1;typeof a=="object"&&(e=c(a));while(d&&!(e?e.indexOf(d)>=0:A.matches(d,a)))d=d!==b&&!H(d)&&d.parentNode;return c(d)},parents:function(a){var b=[],d=this;while(d.length>0)d=c.map(d,function(a){if((a=a.parentNode)&&!H(a)&&b.indexOf(a)<0)return b.push(a),a});return U(b,a)},parent:function(a){return U(C(this.pluck("parentNode")),a)},children:function(a){return U(this.map(function(){return S(this)}),a)},contents:function(){return this.map(function(){return f.call(this.childNodes)})},siblings:function(a){return U(this.map(function(a,b){return g.call(S(b.parentNode),function(a){return a!==b})}),a)},empty:function(){return this.each(function(){this.innerHTML=""})},pluck:function(a){return c.map(this,function(b){return b[a]})},show:function(){return this.each(function(){this.style.display=="none"&&(this.style.display=null),k(this,"").getPropertyValue("display")=="none"&&(this.style.display=R(this.nodeName))})},replaceWith:function(a){return this.before(a).remove()},wrap:function(a){var b=F(a);if(this[0]&&!b)var d=c(a).get(0),e=d.parentNode||this.length>1;return this.each(function(f){c(this).wrapAll(b?a.call(this,f):e?d.cloneNode(!0):d)})},wrapAll:function(a){if(this[0]){c(this[0]).before(a=c(a));var b;while((b=a.children()).length)a=b.first();c(a).append(this)}return this},wrapInner:function(a){var b=F(a);return this.each(function(d){var e=c(this),f=e.contents(),g=b?a.call(this,d):a;f.length?f.wrapAll(g):e.append(g)})},unwrap:function(){return this.parent().each(function(){c(this).replaceWith(c(this).children())}),this},clone:function(){return this.map(function(){return this.cloneNode(!0)})},hide:function(){return this.css("display","none")},toggle:function(b){return this.each(function(){var d=c(this);(b===a?d.css("display")=="none":b)?d.show():d.hide()})},prev:function(a){return c(this.pluck("previousElementSibling")).filter(a||"*")},next:function(a){return c(this.pluck("nextElementSibling")).filter(a||"*")},html:function(b){return b===a?this.length>0?this[0].innerHTML:null:this.each(function(a){var d=this.innerHTML;c(this).empty().append(V(this,b,a,d))})},text:function(b){return b===a?this.length>0?this[0].textContent:null:this.each(function(){this.textContent=b})},attr:function(c,d){var e;return typeof c=="string"&&d===a?this.length==0||this[0].nodeType!==1?a:c=="value"&&this[0].nodeName=="INPUT"?this.val():!(e=this[0].getAttribute(c))&&c in this[0]?this[0][c]:e:this.each(function(a){if(this.nodeType!==1)return;if(I(c))for(b in c)W(this,b,c[b]);else W(this,c,V(this,d,a,this.getAttribute(c)))})},removeAttr:function(a){return this.each(function(){this.nodeType===1&&W(this,a)})},prop:function(b,c){return c===a?this[0]&&this[0][b]:this.each(function(a){this[b]=V(this,c,a,this[b])})},data:function(b,c){var d=this.attr("data-"+O(b),c);return d!==null?Y(d):a},val:function(b){return b===a?this[0]&&(this[0].multiple?c(this[0]).find("option").filter(function(a){return this.selected}).pluck("value"):this[0].value):this.each(function(a){this.value=V(this,b,a,this.value)})},offset:function(a){if(a)return this.each(function(b){var d=c(this),e=V(this,a,b,d.offset()),f=d.offsetParent().offset(),g={top:e.top-f.top,left:e.left-f.left};d.css("position")=="static"&&(g.position="relative"),d.css(g)});if(this.length==0)return null;var b=this[0].getBoundingClientRect();return{left:b.left+window.pageXOffset,top:b.top+window.pageYOffset,width:Math.round(b.width),height:Math.round(b.height)}},css:function(a,c){if(arguments.length<2&&typeof a=="string")return this[0]&&(this[0].style[B(a)]||k(this[0],"").getPropertyValue(a));var d="";if(E(a)=="string")!c&&c!==0?this.each(function(){this.style.removeProperty(O(a))}):d=O(a)+":"+Q(a,c);else for(b in a)!a[b]&&a[b]!==0?this.each(function(){this.style.removeProperty(O(b))}):d+=O(b)+":"+Q(b,a[b])+";";return this.each(function(){this.style.cssText+=";"+d})},index:function(a){return a?this.indexOf(c(a)[0]):this.parent().children().indexOf(this[0])},hasClass:function(a){return e.some.call(this,function(a){return this.test(X(a))},P(a))},addClass:function(a){return this.each(function(b){d=[];var e=X(this),f=V(this,a,b,e);f.split(/\s+/g).forEach(function(a){c(this).hasClass(a)||d.push(a)},this),d.length&&X(this,e+(e?" ":"")+d.join(" "))})},removeClass:function(b){return this.each(function(c){if(b===a)return X(this,"");d=X(this),V(this,b,c,d).split(/\s+/g).forEach(function(a){d=d.replace(P(a)," ")}),X(this,d.trim())})},toggleClass:function(b,d){return this.each(function(e){var f=c(this),g=V(this,b,e,X(this));g.split(/\s+/g).forEach(function(b){(d===a?!f.hasClass(b):d)?f.addClass(b):f.removeClass(b)})})},scrollTop:function(){if(!this.length)return;return"scrollTop"in this[0]?this[0].scrollTop:this[0].scrollY},position:function(){if(!this.length)return;var a=this[0],b=this.offsetParent(),d=this.offset(),e=o.test(b[0].nodeName)?{top:0,left:0}:b.offset();return d.top-=parseFloat(c(a).css("margin-top"))||0,d.left-=parseFloat(c(a).css("margin-left"))||0,e.top+=parseFloat(c(b[0]).css("border-top-width"))||0,e.left+=parseFloat(c(b[0]).css("border-left-width"))||0,{top:d.top-e.top,left:d.left-e.left}},offsetParent:function(){return this.map(function(){var a=this.offsetParent||h.body;while(a&&!o.test(a.nodeName)&&c(a).css("position")=="static")a=a.offsetParent;return a})}},c.fn.detach=c.fn.remove,["width","height"].forEach(function(b){c.fn[b]=function(d){var e,f=this[0],g=b.replace(/./,function(a){return a[0].toUpperCase()});return d===a?G(f)?f["inner"+g]:H(f)?f.documentElement["offset"+g]:(e=this.offset())&&e[b]:this.each(function(a){f=c(this),f.css(b,V(this,d,a,f[b]()))})}}),q.forEach(function(a,b){var d=b%2;c.fn[a]=function(){var a,e=c.map(arguments,function(b){return a=E(b),a=="object"||a=="array"||b==null?b:A.fragment(b)}),f,g=this.length>1;return e.length<1?this:this.each(function(a,h){f=d?h:h.parentNode,h=b==0?h.nextSibling:b==1?h.firstChild:b==2?h:null,e.forEach(function(a){if(g)a=a.cloneNode(!0);else if(!f)return c(a).remove();Z(f.insertBefore(a,h),function(a){a.nodeName!=null&&a.nodeName.toUpperCase()==="SCRIPT"&&(!a.type||a.type==="text/javascript")&&!a.src&&window.eval.call(window,a.innerHTML)})})})},c.fn[d?a+"To":"insert"+(b?"Before":"After")]=function(b){return c(b)[a](this),this}}),A.Z.prototype=c.fn,A.uniq=C,A.deserializeValue=Y,c.zepto=A,c}();window.Zepto=Zepto,"$"in window||(window.$=Zepto),function(a){function b(a){var b=this.os={},c=this.browser={},d=a.match(/WebKit\/([\d.]+)/),e=a.match(/(Android)\s+([\d.]+)/),f=a.match(/(iPad).*OS\s([\d_]+)/),g=!f&&a.match(/(iPhone\sOS)\s([\d_]+)/),h=a.match(/(webOS|hpwOS)[\s\/]([\d.]+)/),i=h&&a.match(/TouchPad/),j=a.match(/Kindle\/([\d.]+)/),k=a.match(/Silk\/([\d._]+)/),l=a.match(/(BlackBerry).*Version\/([\d.]+)/),m=a.match(/(BB10).*Version\/([\d.]+)/),n=a.match(/(RIM\sTablet\sOS)\s([\d.]+)/),o=a.match(/PlayBook/),p=a.match(/Chrome\/([\d.]+)/)||a.match(/CriOS\/([\d.]+)/),q=a.match(/Firefox\/([\d.]+)/);if(c.webkit=!!d)c.version=d[1];e&&(b.android=!0,b.version=e[2]),g&&(b.ios=b.iphone=!0,b.version=g[2].replace(/_/g,".")),f&&(b.ios=b.ipad=!0,b.version=f[2].replace(/_/g,".")),h&&(b.webos=!0,b.version=h[2]),i&&(b.touchpad=!0),l&&(b.blackberry=!0,b.version=l[2]),m&&(b.bb10=!0,b.version=m[2]),n&&(b.rimtabletos=!0,b.version=n[2]),o&&(c.playbook=!0),j&&(b.kindle=!0,b.version=j[1]),k&&(c.silk=!0,c.version=k[1]),!k&&b.android&&a.match(/Kindle Fire/)&&(c.silk=!0),p&&(c.chrome=!0,c.version=p[1]),q&&(c.firefox=!0,c.version=q[1]),b.tablet=!!(f||o||e&&!a.match(/Mobile/)||q&&a.match(/Tablet/)),b.phone=!b.tablet&&!!(e||g||h||l||m||p&&a.match(/Android/)||p&&a.match(/CriOS\/([\d.]+)/)||q&&a.match(/Mobile/))}b.call(a,navigator.userAgent),a.__detect=b}(Zepto),function(a){function g(a){return a._zid||(a._zid=d++)}function h(a,b,d,e){b=i(b);if(b.ns)var f=j(b.ns);return(c[g(a)]||[]).filter(function(a){return a&&(!b.e||a.e==b.e)&&(!b.ns||f.test(a.ns))&&(!d||g(a.fn)===g(d))&&(!e||a.sel==e)})}function i(a){var b=(""+a).split(".");return{e:b[0],ns:b.slice(1).sort().join(" ")}}function j(a){return new RegExp("(?:^| )"+a.replace(" "," .* ?")+"(?: |$)")}function k(b,c,d){a.type(b)!="string"?a.each(b,d):b.split(/\s/).forEach(function(a){d(a,c)})}function l(a,b){return a.del&&(a.e=="focus"||a.e=="blur")||!!b}function m(a){return f[a]||a}function n(b,d,e,h,j,n){var o=g(b),p=c[o]||(c[o]=[]);k(d,e,function(c,d){var e=i(c);e.fn=d,e.sel=h,e.e in f&&(d=function(b){var c=b.relatedTarget;if(!c||c!==this&&!a.contains(this,c))return e.fn.apply(this,arguments)}),e.del=j&&j(d,c);var g=e.del||d;e.proxy=function(a){var c=g.apply(b,[a].concat(a.data));return c===!1&&(a.preventDefault(),a.stopPropagation()),c},e.i=p.length,p.push(e),b.addEventListener(m(e.e),e.proxy,l(e,n))})}function o(a,b,d,e,f){var i=g(a);k(b||"",d,function(b,d){h(a,b,d,e).forEach(function(b){delete c[i][b.i],a.removeEventListener(m(b.e),b.proxy,l(b,f))})})}function t(b){var c,d={originalEvent:b};for(c in b)!r.test(c)&&b[c]!==undefined&&(d[c]=b[c]);return a.each(s,function(a,c){d[a]=function(){return this[c]=p,b[a].apply(b,arguments)},d[c]=q}),d}function u(a){if(!("defaultPrevented"in a)){a.defaultPrevented=!1;var b=a.preventDefault;a.preventDefault=function(){this.defaultPrevented=!0,b.call(this)}}}var b=a.zepto.qsa,c={},d=1,e={},f={mouseenter:"mouseover",mouseleave:"mouseout"};e.click=e.mousedown=e.mouseup=e.mousemove="MouseEvents",a.event={add:n,remove:o},a.proxy=function(b,c){if(a.isFunction(b)){var d=function(){return b.apply(c,arguments)};return d._zid=g(b),d}if(typeof c=="string")return a.proxy(b[c],b);throw new TypeError("expected function")},a.fn.bind=function(a,b){return this.each(function(){n(this,a,b)})},a.fn.unbind=function(a,b){return this.each(function(){o(this,a,b)})},a.fn.one=function(a,b){return this.each(function(c,d){n(this,a,b,null,function(a,b){return function(){var c=a.apply(d,arguments);return o(d,b,a),c}})})};var p=function(){return!0},q=function(){return!1},r=/^([A-Z]|layer[XY]$)/,s={preventDefault:"isDefaultPrevented",stopImmediatePropagation:"isImmediatePropagationStopped",stopPropagation:"isPropagationStopped"};a.fn.delegate=function(b,c,d){return this.each(function(e,f){n(f,c,d,b,function(c){return function(d){var e,g=a(d.target).closest(b,f).get(0);if(g)return e=a.extend(t(d),{currentTarget:g,liveFired:f}),c.apply(g,[e].concat([].slice.call(arguments,1)))}})})},a.fn.undelegate=function(a,b,c){return this.each(function(){o(this,b,c,a)})},a.fn.live=function(b,c){return a(document.body).delegate(this.selector,b,c),this},a.fn.die=function(b,c){return a(document.body).undelegate(this.selector,b,c),this},a.fn.on=function(b,c,d){return!c||a.isFunction(c)?this.bind(b,c||d):this.delegate(c,b,d)},a.fn.off=function(b,c,d){return!c||a.isFunction(c)?this.unbind(b,c||d):this.undelegate(c,b,d)},a.fn.trigger=function(b,c){if(typeof b=="string"||a.isPlainObject(b))b=a.Event(b);return u(b),b.data=c,this.each(function(){"dispatchEvent"in this&&this.dispatchEvent(b)})},a.fn.triggerHandler=function(b,c){var d,e;return this.each(function(f,g){d=t(typeof b=="string"?a.Event(b):b),d.data=c,d.target=g,a.each(h(g,b.type||b),function(a,b){e=b.proxy(d);if(d.isImmediatePropagationStopped())return!1})}),e},"focusin focusout load resize scroll unload click dblclick mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave change select keydown keypress keyup error".split(" ").forEach(function(b){a.fn[b]=function(a){return a?this.bind(b,a):this.trigger(b)}}),["focus","blur"].forEach(function(b){a.fn[b]=function(a){return a?this.bind(b,a):this.each(function(){try{this[b]()}catch(a){}}),this}}),a.Event=function(a,b){typeof a!="string"&&(b=a,a=b.type);var c=document.createEvent(e[a]||"Events"),d=!0;if(b)for(var f in b)f=="bubbles"?d=!!b[f]:c[f]=b[f];return c.initEvent(a,d,!0,null,null,null,null,null,null,null,null,null,null,null,null),c.isDefaultPrevented=function(){return this.defaultPrevented},c}}(Zepto),function($){function triggerAndReturn(a,b,c){var d=$.Event(b);return $(a).trigger(d,c),!d.defaultPrevented}function triggerGlobal(a,b,c,d){if(a.global)return triggerAndReturn(b||document,c,d)}function ajaxStart(a){a.global&&$.active++===0&&triggerGlobal(a,null,"ajaxStart")}function ajaxStop(a){a.global&&!--$.active&&triggerGlobal(a,null,"ajaxStop")}function ajaxBeforeSend(a,b){var c=b.context;if(b.beforeSend.call(c,a,b)===!1||triggerGlobal(b,c,"ajaxBeforeSend",[a,b])===!1)return!1;triggerGlobal(b,c,"ajaxSend",[a,b])}function ajaxSuccess(a,b,c){var d=c.context,e="success";c.success.call(d,a,e,b),triggerGlobal(c,d,"ajaxSuccess",[b,c,a]),ajaxComplete(e,b,c)}function ajaxError(a,b,c,d){var e=d.context;d.error.call(e,c,b,a),triggerGlobal(d,e,"ajaxError",[c,d,a]),ajaxComplete(b,c,d)}function ajaxComplete(a,b,c){var d=c.context;c.complete.call(d,b,a),triggerGlobal(c,d,"ajaxComplete",[b,c]),ajaxStop(c)}function empty(){}function mimeToDataType(a){return a&&(a=a.split(";",2)[0]),a&&(a==htmlType?"html":a==jsonType?"json":scriptTypeRE.test(a)?"script":xmlTypeRE.test(a)&&"xml")||"text"}function appendQuery(a,b){return(a+"&"+b).replace(/[&?]{1,2}/,"?")}function serializeData(a){a.processData&&a.data&&$.type(a.data)!="string"&&(a.data=$.param(a.data,a.traditional)),a.data&&(!a.type||a.type.toUpperCase()=="GET")&&(a.url=appendQuery(a.url,a.data))}function parseArguments(a,b,c,d){var e=!$.isFunction(b);return{url:a,data:e?b:undefined,success:e?$.isFunction(c)?c:undefined:b,dataType:e?d||c:c}}function serialize(a,b,c,d){var e,f=$.isArray(b);$.each(b,function(b,g){e=$.type(g),d&&(b=c?d:d+"["+(f?"":b)+"]"),!d&&f?a.add(g.name,g.value):e=="array"||!c&&e=="object"?serialize(a,g,c,b):a.add(b,g)})}var jsonpID=0,document=window.document,key,name,rscript=/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,scriptTypeRE=/^(?:text|application)\/javascript/i,xmlTypeRE=/^(?:text|application)\/xml/i,jsonType="application/json",htmlType="text/html",blankRE=/^\s*$/;$.active=0,$.ajaxJSONP=function(a){if("type"in a){var b="jsonp"+ ++jsonpID,c=document.createElement("script"),d=function(){clearTimeout(g),$(c).remove(),delete window[b]},e=function(c){d();if(!c||c=="timeout")window[b]=empty;ajaxError(null,c||"abort",f,a)},f={abort:e},g;return ajaxBeforeSend(f,a)===!1?(e("abort"),!1):(window[b]=function(b){d(),ajaxSuccess(b,f,a)},c.onerror=function(){e("error")},c.src=a.url.replace(/=\?/,"="+b),$("head").append(c),a.timeout>0&&(g=setTimeout(function(){e("timeout")},a.timeout)),f)}return $.ajax(a)},$.ajaxSettings={type:"GET",beforeSend:empty,success:empty,error:empty,complete:empty,context:null,global:!0,xhr:function(){return new window.XMLHttpRequest},accepts:{script:"text/javascript, application/javascript",json:jsonType,xml:"application/xml, text/xml",html:htmlType,text:"text/plain"},crossDomain:!1,timeout:0,processData:!0,cache:!0},$.ajax=function(options){var settings=$.extend({},options||{});for(key in $.ajaxSettings)settings[key]===undefined&&(settings[key]=$.ajaxSettings[key]);ajaxStart(settings),settings.crossDomain||(settings.crossDomain=/^([\w-]+:)?\/\/([^\/]+)/.test(settings.url)&&RegExp.$2!=window.location.host),settings.url||(settings.url=window.location.toString()),serializeData(settings),settings.cache===!1&&(settings.url=appendQuery(settings.url,"_="+Date.now()));var dataType=settings.dataType,hasPlaceholder=/=\?/.test(settings.url);if(dataType=="jsonp"||hasPlaceholder)return hasPlaceholder||(settings.url=appendQuery(settings.url,"callback=?")),$.ajaxJSONP(settings);var mime=settings.accepts[dataType],baseHeaders={},protocol=/^([\w-]+:)\/\//.test(settings.url)?RegExp.$1:window.location.protocol,xhr=settings.xhr(),abortTimeout;settings.crossDomain||(baseHeaders["X-Requested-With"]="XMLHttpRequest"),mime&&(baseHeaders.Accept=mime,mime.indexOf(",")>-1&&(mime=mime.split(",",2)[0]),xhr.overrideMimeType&&xhr.overrideMimeType(mime));if(settings.contentType||settings.contentType!==!1&&settings.data&&settings.type.toUpperCase()!="GET")baseHeaders["Content-Type"]=settings.contentType||"application/x-www-form-urlencoded";settings.headers=$.extend(baseHeaders,settings.headers||{}),xhr.onreadystatechange=function(){if(xhr.readyState==4){xhr.onreadystatechange=empty,clearTimeout(abortTimeout);var result,error=!1;if(xhr.status>=200&&xhr.status<300||xhr.status==304||xhr.status==0&&protocol=="file:"){dataType=dataType||mimeToDataType(xhr.getResponseHeader("content-type")),result=xhr.responseText;try{dataType=="script"?(1,eval)(result):dataType=="xml"?result=xhr.responseXML:dataType=="json"&&(result=blankRE.test(result)?null:$.parseJSON(result))}catch(e){error=e}error?ajaxError(error,"parsererror",xhr,settings):ajaxSuccess(result,xhr,settings)}else ajaxError(null,xhr.status?"error":"abort",xhr,settings)}};var async="async"in settings?settings.async:!0;xhr.open(settings.type,settings.url,async);for(name in settings.headers)xhr.setRequestHeader(name,settings.headers[name]);return ajaxBeforeSend(xhr,settings)===!1?(xhr.abort(),!1):(settings.timeout>0&&(abortTimeout=setTimeout(function(){xhr.onreadystatechange=empty,xhr.abort(),ajaxError(null,"timeout",xhr,settings)},settings.timeout)),xhr.send(settings.data?settings.data:null),xhr)},$.get=function(a,b,c,d){return $.ajax(parseArguments.apply(null,arguments))},$.post=function(a,b,c,d){var e=parseArguments.apply(null,arguments);return e.type="POST",$.ajax(e)},$.getJSON=function(a,b,c){var d=parseArguments.apply(null,arguments);return d.dataType="json",$.ajax(d)},$.fn.load=function(a,b,c){if(!this.length)return this;var d=this,e=a.split(/\s/),f,g=parseArguments(a,b,c),h=g.success;return e.length>1&&(g.url=e[0],f=e[1]),g.success=function(a){d.html(f?$("<div>").html(a.replace(rscript,"")).find(f):a),h&&h.apply(d,arguments)},$.ajax(g),this};var escape=encodeURIComponent;$.param=function(a,b){var c=[];return c.add=function(a,b){this.push(escape(a)+"="+escape(b))},serialize(c,a,b),c.join("&").replace(/%20/g,"+")}}(Zepto),function(a){a.fn.serializeArray=function(){var b=[],c;return a(Array.prototype.slice.call(this.get(0).elements)).each(function(){c=a(this);var d=c.attr("type");this.nodeName.toLowerCase()!="fieldset"&&!this.disabled&&d!="submit"&&d!="reset"&&d!="button"&&(d!="radio"&&d!="checkbox"||this.checked)&&b.push({name:c.attr("name"),value:c.val()})}),b},a.fn.serialize=function(){var a=[];return this.serializeArray().forEach(function(b){a.push(encodeURIComponent(b.name)+"="+encodeURIComponent(b.value))}),a.join("&")},a.fn.submit=function(b){if(b)this.bind("submit",b);else if(this.length){var c=a.Event("submit");this.eq(0).trigger(c),c.defaultPrevented||this.get(0).submit()}return this}}(Zepto),function(a,b){function s(a){return t(a.replace(/([a-z])([A-Z])/,"$1-$2"))}function t(a){return a.toLowerCase()}function u(a){return d?d+a:t(a)}var c="",d,e,f,g={Webkit:"webkit",Moz:"",O:"o",ms:"MS"},h=window.document,i=h.createElement("div"),j=/^((translate|rotate|scale)(X|Y|Z|3d)?|matrix(3d)?|perspective|skew(X|Y)?)$/i,k,l,m,n,o,p,q,r={};a.each(g,function(a,e){if(i.style[a+"TransitionProperty"]!==b)return c="-"+t(a)+"-",d=e,!1}),k=c+"transform",r[l=c+"transition-property"]=r[m=c+"transition-duration"]=r[n=c+"transition-timing-function"]=r[o=c+"animation-name"]=r[p=c+"animation-duration"]=r[q=c+"animation-timing-function"]="",a.fx={off:d===b&&i.style.transitionProperty===b,speeds:{_default:400,fast:200,slow:600},cssPrefix:c,transitionEnd:u("TransitionEnd"),animationEnd:u("AnimationEnd")},a.fn.animate=function(b,c,d,e){return a.isPlainObject(c)&&(d=c.easing,e=c.complete,c=c.duration),c&&(c=(typeof c=="number"?c:a.fx.speeds[c]||a.fx.speeds._default)/1e3),this.anim(b,c,d,e)},a.fn.anim=function(c,d,e,f){var g,h={},i,t="",u=this,v,w=a.fx.transitionEnd;d===b&&(d=.4),a.fx.off&&(d=0);if(typeof c=="string")h[o]=c,h[p]=d+"s",h[q]=e||"linear",w=a.fx.animationEnd;else{i=[];for(g in c)j.test(g)?t+=g+"("+c[g]+") ":(h[g]=c[g],i.push(s(g)));t&&(h[k]=t,i.push(k)),d>0&&typeof c=="object"&&(h[l]=i.join(", "),h[m]=d+"s",h[n]=e||"linear")}return v=function(b){if(typeof b!="undefined"){if(b.target!==b.currentTarget)return;a(b.target).unbind(w,v)}a(this).css(r),f&&f.call(this)},d>0&&this.bind(w,v),this.size()&&this.get(0).clientLeft,this.css(h),d<=0&&setTimeout(function(){u.each(function(){v.call(this)})},0),this},i=null}(Zepto)

/***/ },
/* 6 */
/***/ function(module, exports) {

	'use strict';
	
	Object.defineProperty(exports, '__esModule', {
	    value: true
	});
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
	    this.defer = function () {
	        var deferred = {};
	        var promise = new Promise(function (resolve, reject) {
	            deferred.resolve = resolve;
	            deferred.reject = reject;
	        });
	        deferred.promise = promise;
	        return deferred;
	    };
	
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
	                var args = [deferred.resolve, deferred.reject].concat(Array.prototype.slice.call(arguments));
	
	                var result = any.apply(this, args);
	                if (that.isPromise(result)) {
	                    return result;
	                } else {
	                    return deferred.promise;
	                }
	            } else {
	                return any;
	            }
	        };
	    };
	
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
	        ['then', 'catch'].forEach(function (method) {
	            context[method] = function () {
	                return promise[method].apply(promise, arguments);
	            };
	        });
	        return context;
	    };
	
	    /**
	     * if is a thenable object
	     * @method isThenable
	     * @memberOf PromiseFeatures
	     * @instance
	     * @param  {Object} any
	     * @return {Boolean} true or false
	     */
	    this.isThenable = function (any) {
	        return !!any && !!any.then && typeof any.then === 'function';
	    };
	
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
	    };
	
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
	    this.record = function (promise) {
	        var recorder = Object.create(promise);
	
	        if (Object.defineProperties) {
	            var state = 'pending';
	            var result;
	
	            Object.defineProperties(recorder, {
	                PromiseState: {
	                    get: function get() {
	                        return state;
	                    },
	                    enmurable: false
	                },
	
	                PromiseResult: {
	                    get: function get() {
	                        return result;
	                    },
	                    enmurable: false
	                }
	            });
	
	            promise.then(function (ret) {
	                state = 'fullfilled';
	                result = ret;
	            }, function (reason) {
	                state = 'rejected';
	                result = reason;
	            });
	        } else {
	            recorder.PromiseState = 'pending';
	            recorder.PromiseResult = undefined;
	
	            promise.then(function (ret) {
	                recorder.PromiseState = 'fullfilled';
	                recorder.PromiseResult = ret;
	            }, function (reason) {
	                recorder.PromiseState = 'rejected';
	                recorder.PromiseResult = reason;
	            });
	        }
	
	        return recorder;
	    };
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
	    var domReadyPrmoise = new Promise(function (resolve, reject) {
	        if (document.readyState === 'complete') {
	            resolve();
	        } else {
	            if (document.addEventListener) {
	                document.addEventListener('DOMContentLoaded', resolve);
	            } else {
	                window.attachEvent('onload', resolve);
	            }
	        }
	    });
	    this.domReady = function () {
	        return domReadyPrmoise;
	    };
	
	    /**
	     * a load Event promise
	     * @method pageLoad
	     * @memberOf PromiseUtilities
	     * @instance
	     * @return {Promise} a Promise object
	     */
	    var pageLoadPromise = new Promise(function (resolve, reject) {
	        if (window.addEventListener) {
	            window.addEventListener('load', resolve);
	        } else {
	            window.attachEvent('onload', resolve);
	        }
	    });
	    this.pageLoad = function () {
	        return pageLoadPromise;
	    };
	
	    /**
	     * a delay promise
	     * @method delay
	     * @memberOf PromiseUtilities
	     * @param {Number} duration the delayed time(ms)
	     * @instance
	     * @return {Promise} a Promise object
	     */
	    this.delay = function (duration) {
	        return new Promise(function (resolve, reject) {
	            setTimeout(resolve, duration);
	        });
	    };
	
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
	    this.waitForEvent = function (element, eventName, useCapture) {
	        return new Promise(function (resolve, reject) {
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
	    };
	
	    /**
	     * a parallel promise
	     * @method parallel
	     * @memberOf PromiseUtilities
	     * @param {Promise[]} promises a list of promises
	     * @instance
	     * @return {Promise} a Promise object
	     */
	    this.parallel = function (promises) {
	        return Promise.all(promises.map(function (any) {
	            if (lib.promise.isThenable(any)) {
	                return Promise.resolve(any);
	            } else if (typeof any === 'function') {
	                return any();
	            } else {
	                return any;
	            }
	        }));
	    };
	
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
	
	        promises.forEach(function (any) {
	            if (lib.promise.isThenable(any)) {
	                promise = promise.then(function () {
	                    return Promise.resolve(any);
	                });
	            } else if (typeof any === 'function') {
	                promise = promise.then(any);
	            } else {
	                promise = promise.then(function () {
	                    return any;
	                });
	            }
	        });
	
	        return promise;
	    };
	}
	
	var context = Object.create({
	    Promise: Promise
	});
	
	PromiseFeatures.call(context);
	PromiseUtilities.call(context);
	
	exports['default'] = context;
	module.exports = exports['default'];

/***/ }
/******/ ]);//# sourceMappingURL=pafc-mobile.js.map