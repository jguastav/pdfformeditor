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
  var $Symbol = typeof Symbol === "function" ? Symbol : {};
  var iteratorSymbol = $Symbol.iterator || "@@iterator";
  var toStringTagSymbol = $Symbol.toStringTag || "@@toStringTag";

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
  GeneratorFunctionPrototype[toStringTagSymbol] = GeneratorFunction.displayName = "GeneratorFunction";

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
      if (!(toStringTagSymbol in genFun)) {
        genFun[toStringTagSymbol] = "GeneratorFunction";
      }
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
          // Setting context._sent for legacy support of Babel's
          // function.sent implementation.
          context.sent = context._sent = arg;

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

  Gp[toStringTagSymbol] = "Generator";

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
      // Resetting context._sent for legacy support of Babel's
      // function.sent implementation.
      this.sent = this._sent = undefined;
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
//---------------------------------------------------------------------------------------
// Copyright (c) 2001-2015 by PDFTron Systems Inc. All Rights Reserved.
// Consult legal.txt regarding legal and license information.
//---------------------------------------------------------------------------------------

//# sourceURL=TextExtractTest.js
(function(exports){
    "use strict";

exports.runTextExtractTest = function()
{
    var marked2$0 = [dumpAllText, rectTextSearch, readTextFromRect, printStyle, main].map(regeneratorRuntime.mark);
    // A utility method used to dump all text content in the console window.
    function dumpAllText(reader) {
        var element, bbox, arr;

        return regeneratorRuntime.wrap(function dumpAllText$(context$3$0) {
            while (1) switch (context$3$0.prev = context$3$0.next) {
            case 0:
                context$3$0.next = 2;
                return reader.next();
            case 2:
                context$3$0.t0 = element = context$3$0.sent;

                if (!(context$3$0.t0 !== null)) {
                    context$3$0.next = 29;
                    break;
                }

                context$3$0.next = 6;
                return element.getType();
            case 6:
                context$3$0.t1 = context$3$0.sent;
                context$3$0.next = (context$3$0.t1 === PDFNet.Element.Type.e_text_begin ? 9 : (context$3$0.t1 === PDFNet.Element.Type.e_text_end ? 11 : (context$3$0.t1 === PDFNet.Element.Type.e_text ? 13 : (context$3$0.t1 === PDFNet.Element.Type.e_text_new_line ? 22 : (context$3$0.t1 === PDFNet.Element.Type.e_form ? 23 : 27)))));
                break;
            case 9:
                console.log("--> Text Block Begin");
                return context$3$0.abrupt("break", 27);
            case 11:
                console.log("--> Text Block End");
                return context$3$0.abrupt("break", 27);
            case 13:
                context$3$0.next = 15;
                return element.getBBox();
            case 15:
                bbox = context$3$0.sent;
                console.log("--> BBox: " + bbox.x1 + ", " + bbox.y1 + ", " + bbox.x2 + ", " + bbox.y2 + "\n");
                context$3$0.next = 19;
                return element.getTextString();
            case 19:
                arr = context$3$0.sent;
                console.log(arr)
                return context$3$0.abrupt("break", 27);
            case 22:
                return context$3$0.abrupt("break", 27);
            case 23:
                reader.formBegin();
                return context$3$0.delegateYield(dumpAllText(reader), "t2", 25);
            case 25:
                reader.end();
                return context$3$0.abrupt("break", 27);
            case 27:
                context$3$0.next = 0;
                break;
            case 29:
            case "end":
                return context$3$0.stop();
            }
        }, marked2$0[0], this);
    }

    // helper method for ReadTextFromRect
    function rectTextSearch(reader, pos, srch_str) {
        var element, bbox, arr;

        return regeneratorRuntime.wrap(function rectTextSearch$(context$3$0) {
            while (1) switch (context$3$0.prev = context$3$0.next) {
            case 0:
                context$3$0.next = 2;
                return reader.next();
            case 2:
                context$3$0.t0 = element = context$3$0.sent;

                if (!(context$3$0.t0 !== null)) {
                    context$3$0.next = 27;
                    break;
                }

                context$3$0.next = 6;
                return element.getType();
            case 6:
                context$3$0.t1 = context$3$0.sent;
                context$3$0.next = (context$3$0.t1 === PDFNet.Element.Type.e_text ? 9 : (context$3$0.t1 === PDFNet.Element.Type.e_text_new_line ? 19 : (context$3$0.t1 === PDFNet.Element.Type.e_form ? 20 : 25)));
                break;
            case 9:
                context$3$0.next = 11;
                return element.getBBox();
            case 11:
                bbox = context$3$0.sent;
                context$3$0.next = 14;
                return bbox.intersectRect(bbox, pos);
            case 14:
                if (!context$3$0.sent) {
                    context$3$0.next = 19;
                    break;
                }

                context$3$0.next = 17;
                return element.getTextString();
            case 17:
                arr = context$3$0.sent;
                srch_str += arr + "\n";
            case 19:
                return context$3$0.abrupt("break", 25);
            case 20:
                reader.formBegin();
                return context$3$0.delegateYield(rectTextSearch(reader, pos, srch_str), "t2", 22);
            case 22:
                srch_Str += context$3$0.t2;
                reader.end();
                return context$3$0.abrupt("break", 25);
            case 25:
                context$3$0.next = 0;
                break;
            case 27:
                return context$3$0.abrupt("return", srch_str);
            case 28:
            case "end":
                return context$3$0.stop();
            }
        }, marked2$0[1], this);
    }

    function readTextFromRect(page, pos, reader) {
        var srch_str;

        return regeneratorRuntime.wrap(function readTextFromRect$(context$3$0) {
            while (1) switch (context$3$0.prev = context$3$0.next) {
            case 0:
                srch_str = "";
                // uses default parameters.
                reader.beginOnPage(page);
                return context$3$0.delegateYield(rectTextSearch(reader, pos, srch_str), "t0", 3);
            case 3:
                srch_str += context$3$0.t0;
                reader.end();
                return context$3$0.abrupt("return", srch_str);
            case 6:
            case "end":
                return context$3$0.stop();
            }
        }, marked2$0[2], this);
    }

    function printStyle(s) {
        var rgb, rColorVal, gColorVal, bColorVal, fontName, fontSize, serifOutput, returnString;

        return regeneratorRuntime.wrap(function printStyle$(context$3$0) {
            while (1) switch (context$3$0.prev = context$3$0.next) {
            case 0:
                context$3$0.next = 2;
                return s.getColor();
            case 2:
                rgb = context$3$0.sent;
                context$3$0.next = 5;
                return rgb.get(0);
            case 5:
                rColorVal = context$3$0.sent;
                context$3$0.next = 8;
                return rgb.get(1);
            case 8:
                gColorVal = context$3$0.sent;
                context$3$0.next = 11;
                return rgb.get(2);
            case 11:
                bColorVal = context$3$0.sent;
                context$3$0.next = 14;
                return s.getFontName();
            case 14:
                fontName = context$3$0.sent;
                context$3$0.next = 17;
                return s.getFontSize();
            case 17:
                fontSize = context$3$0.sent;
                context$3$0.next = 20;
                return s.isSerif();
            case 20:
                if (!context$3$0.sent) {
                    context$3$0.next = 24;
                    break;
                }

                context$3$0.t0 = " sans-serif; ";
                context$3$0.next = 25;
                break;
            case 24:
                context$3$0.t0 = " ";
            case 25:
                serifOutput = context$3$0.t0;
                returnString = "style=\"font-family:" + fontName + ";" + "font-size:" + fontSize + ";" + serifOutput + "color: #" +rColorVal.toString(16)+", "+gColorVal.toString(16)+", "+bColorVal.toString(16)+ ")\"";
                return context$3$0.abrupt("return", returnString);
            case 28:
            case "end":
                return context$3$0.stop();
            }
        }, marked2$0[3], this);
    }

    function main() {
        var ret, input_url, input_filename, output_path, example1_basic, example2_xml, example3_wordlist, example4_advanced, example5_low_level, doc, page, txt, rect, cnt, wordCount, text, line, word, b, q, cur_flow_id, cur_para_id, uni_str, builder, writer, line_style, outputStringLineBox, currentLineNum, outputStringWord, currentNum, sz, sty, reader, itr, first_page, s1;

        return regeneratorRuntime.wrap(function main$(context$3$0) {
            while (1) switch (context$3$0.prev = context$3$0.next) {
            case 0:
                console.log("Beginning Test");

                ret = 0;
                context$3$0.next = 4;
                return PDFNet.initialize();
            case 4:
                input_url = "../TestFiles/";
                input_filename = "newsletter.pdf";
                output_path = "../../TestFiles/Output/";
                example1_basic = false;
                example2_xml = false;
                example3_wordlist = false;
                example4_advanced = true;
                example5_low_level = false;
                context$3$0.prev = 12;
                context$3$0.next = 15;
                return PDFNet.startDeallocateStack();
            case 15:
                context$3$0.next = 17;
                return PDFNet.PDFDoc.createFromURL(input_url + input_filename);
            case 17:
                doc = context$3$0.sent;
                doc.initSecurityHandler();
                doc.lock();

                context$3$0.next = 22;
                return doc.getPage(1);
            case 22:
                page = context$3$0.sent;

                if (!(page.id == "0")) {
                    context$3$0.next = 26;
                    break;
                }

                console.log("Page not found.");
                return context$3$0.abrupt("return", 1);
            case 26:
                context$3$0.next = 28;
                return PDFNet.TextExtractor.create();
            case 28:
                txt = context$3$0.sent;
                rect = new PDFNet.Rect(0, 0, 612, 794);
                txt.begin(page, rect);
                context$3$0.next = 33;
                return txt.getNumLines();
            case 33:
                cnt = context$3$0.sent;

                if (!example1_basic) {
                    context$3$0.next = 45;
                    break;
                }

                context$3$0.next = 37;
                return txt.getWordCount();
            case 37:
                wordCount = context$3$0.sent;
                console.log("Word Count: " + wordCount);
                context$3$0.next = 41;
                return txt.getAsText();
            case 41:
                text = context$3$0.sent;
                console.log("- GetAsText  -------------------------------");
                console.log(text);
                console.log("-----------------------------------------");
            case 45:
                if (!example2_xml) {
                    context$3$0.next = 51;
                    break;
                }

                context$3$0.next = 48;
                return txt.getAsXML(PDFNet.TextExtractor.XMLOutputFlags.e_words_as_elements | PDFNet.TextExtractor.XMLOutputFlags.e_output_bbox | PDFNet.TextExtractor.XMLOutputFlags.e_output_style_info);
            case 48:
                text = context$3$0.sent;
                console.log("- GetAsXML  --------------------------" + text);
                console.log("-----------------------------------------------------------");
            case 51:
                if (!example3_wordlist) {
                    context$3$0.next = 79;
                    break;
                }

                context$3$0.next = 54;
                return txt.getFirstLine();
            case 54:
                line = context$3$0.sent;
            case 55:
                context$3$0.next = 57;
                return line.isValid();
            case 57:
                if (!context$3$0.sent) {
                    context$3$0.next = 78;
                    break;
                }

                context$3$0.next = 60;
                return line.getFirstWord();
            case 60:
                word = context$3$0.sent;
            case 61:
                context$3$0.next = 63;
                return word.isValid();
            case 63:
                if (!context$3$0.sent) {
                    context$3$0.next = 73;
                    break;
                }

                context$3$0.next = 66;
                return word.getString();
            case 66:
                text = context$3$0.sent;
                console.log(text);
            case 68:
                context$3$0.next = 70;
                return word.getNextWord();
            case 70:
                word = context$3$0.sent;
                context$3$0.next = 61;
                break;
            case 73:
                context$3$0.next = 75;
                return line.getNextLine();
            case 75:
                line = context$3$0.sent;
                context$3$0.next = 55;
                break;
            case 78:
                console.log("-----------------------------------------------------------");
            case 79:
                if (!example4_advanced) {
                    context$3$0.next = 180;
                    break;
                }

                cur_flow_id = -1;
                cur_para_id = -1;
                context$3$0.next = 84;
                return PDFNet.ElementBuilder.create();
            case 84:
                builder = context$3$0.sent;
                context$3$0.next = 87;
                return PDFNet.ElementWriter.create();
            case 87:
                writer = context$3$0.sent;
                context$3$0.next = 90;
                return txt.getFirstLine();
            case 90:
                line = context$3$0.sent;
            case 91:
                context$3$0.next = 93;
                return line.isValid();
            case 93:
                if (!context$3$0.sent) {
                    context$3$0.next = 179;
                    break;
                }

                context$3$0.next = 96;
                return line.getNumWords();
            case 96:
                context$3$0.t0 = context$3$0.sent;

                if (!(context$3$0.t0 == 0)) {
                    context$3$0.next = 99;
                    break;
                }

                return context$3$0.abrupt("continue", 174);
            case 99:
                context$3$0.next = 101;
                return line.getFlowID();
            case 101:
                context$3$0.t1 = context$3$0.sent;
                context$3$0.t2 = cur_flow_id;

                if (!(context$3$0.t1 != context$3$0.t2)) {
                    context$3$0.next = 109;
                    break;
                }

                if(cur_flow_id != -1) {
                    if(cur_para_id != -1){
                        cur_para_id = -1;
                        console.log("</Para>");
                    }
                    console.log("</Flow>");
                }
                context$3$0.next = 107;
                return line.getFlowID();
            case 107:
                cur_flow_id = context$3$0.sent;
                console.log("<Flow id=\"" + cur_flow_id + "\">");
            case 109:
                context$3$0.next = 111;
                return line.getParagraphID();
            case 111:
                context$3$0.t3 = context$3$0.sent;
                context$3$0.t4 = cur_para_id;

                if (!(context$3$0.t3 != context$3$0.t4)) {
                    context$3$0.next = 119;
                    break;
                }

                if(cur_para_id != -1){
                    console.log("</Para>");
                }
                context$3$0.next = 117;
                return line.getParagraphID();
            case 117:
                cur_para_id = context$3$0.sent;
                console.log("<Para id=\"" + cur_para_id + "\">");
            case 119:
                context$3$0.next = 121;
                return line.getBBox();
            case 121:
                b = context$3$0.sent;
                context$3$0.next = 124;
                return line.getStyle();
            case 124:
                line_style = context$3$0.sent;
                outputStringLineBox = "<Line box=\"" + b.x1 + ", " + b.y1 + ", " + b.x2 + ", " + b.y1 + "\">";
                return context$3$0.delegateYield(printStyle(line_style), "t5", 127);
            case 127:
                outputStringLineBox += context$3$0.t5;
                context$3$0.next = 130;
                return line.getCurrentNum();
            case 130:
                currentLineNum = context$3$0.sent;
                outputStringLineBox += " cur_num=\"" + currentLineNum + "\">";
                console.log(outputStringLineBox);

                outputStringWord = "";
                context$3$0.next = 136;
                return line.getFirstWord();
            case 136:
                word = context$3$0.sent;
            case 137:
                context$3$0.next = 139;
                return word.isValid();
            case 139:
                if (!context$3$0.sent) {
                    context$3$0.next = 173;
                    break;
                }

                context$3$0.next = 142;
                return word.getBBox();
            case 142:
                q = context$3$0.sent;
                context$3$0.next = 145;
                return word.getCurrentNum();
            case 145:
                currentNum = context$3$0.sent;
                outputStringWord += "<Word box=\"" + q.x1 + ", " + q.y1 + ", " + q.x2 + ", " + q.y2 + "\"" + " cur_num=\"" + currentNum + '"';
                context$3$0.next = 149;
                return word.getStringLen();
            case 149:
                sz = context$3$0.sent;

                if (!(sz == 0)) {
                    context$3$0.next = 152;
                    break;
                }

                return context$3$0.abrupt("continue", 168);
            case 152:
                context$3$0.next = 154;
                return word.getStyle();
            case 154:
                sty = context$3$0.sent;
                context$3$0.next = 157;
                return sty.compare(line_style);
            case 157:
                if (context$3$0.sent) {
                    context$3$0.next = 162;
                    break;
                }

                context$3$0.t6 = console;
                return context$3$0.delegateYield(printStyle(sty), "t7", 160);
            case 160:
                context$3$0.t8 = context$3$0.t7;
                context$3$0.t6.log.call(context$3$0.t6, context$3$0.t8);
            case 162:
                context$3$0.next = 164;
                return word.getString();
            case 164:
                context$3$0.t9 = context$3$0.sent;
                context$3$0.t10 = ">" + context$3$0.t9;
                outputStringWord += context$3$0.t10 + "</Word>";
                console.log(outputStringWord);
            case 168:
                context$3$0.next = 170;
                return word.getNextWord();
            case 170:
                word = context$3$0.sent;
                context$3$0.next = 137;
                break;
            case 173:
                console.log("</Line>");
            case 174:
                context$3$0.next = 176;
                return line.getNextLine();
            case 176:
                line = context$3$0.sent;
                context$3$0.next = 91;
                break;
            case 179:
                if(cur_flow_id != -1){
                    if(cur_para_id != -1){
                        cur_para_id = -1;
                        console.log("</Para>");
                    }
                    console.log("</Flow>\n");
                }
            case 180:
                console.log("done");
                context$3$0.next = 183;
                return PDFNet.endDeallocateStack();
            case 183:
                context$3$0.next = 190;
                break;
            case 185:
                context$3$0.prev = 185;
                context$3$0.t11 = context$3$0["catch"](12);
                console.log(context$3$0.t11);
                console.log(context$3$0.t11.stack)
                ret = 1;
            case 190:
                if (!example5_low_level) {
                    context$3$0.next = 260;
                    break;
                }

                ret = 0;
                context$3$0.prev = 192;
                context$3$0.next = 195;
                return PDFNet.startDeallocateStack();
            case 195:
                context$3$0.next = 197;
                return PDFNet.PDFDoc.createFromURL(input_url + input_filename);
            case 197:
                doc = context$3$0.sent;
                doc.initSecurityHandler();
                doc.lock();

                context$3$0.next = 202;
                return PDFNet.ElementReader.create();
            case 202:
                reader = context$3$0.sent;
                context$3$0.next = 205;
                return doc.getPageIterator(1);
            case 205:
                itr = context$3$0.sent;
                itr;
            case 207:
                context$3$0.next = 209;
                return itr.hasNext();
            case 209:
                if (!context$3$0.sent) {
                    context$3$0.next = 219;
                    break;
                }

                context$3$0.next = 212;
                return itr.current();
            case 212:
                page = context$3$0.sent;
                reader.beginOnPage(page);
                return context$3$0.delegateYield(dumpAllText(reader), "t12", 215);
            case 215:
                reader.end();
            case 216:
                itr.next();
                context$3$0.next = 207;
                break;
            case 219:
                // Example 2. Extract text content based on the 
                // selection rectangle.
                console.log("----------------------------------------------------");
                console.log("Extract text based on the selection rectangle.");
                console.log("----------------------------------------------------");


                context$3$0.next = 224;
                return doc.getPageIterator();
            case 224:
                context$3$0.next = 226;
                return context$3$0.sent.current();
            case 226:
                first_page = context$3$0.sent;
                context$3$0.t13 = first_page;
                context$3$0.next = 230;
                return PDFNet.Rect.init(27, 392, 563, 534);
            case 230:
                context$3$0.t14 = context$3$0.sent;
                context$3$0.t15 = reader;

                return context$3$0.delegateYield(
                    readTextFromRect(context$3$0.t13, context$3$0.t14, context$3$0.t15),
                    "t16",
                    233
                );
            case 233:
                s1 = context$3$0.t16;
                console.log("Field 1: " + s1);

                context$3$0.t17 = first_page;
                context$3$0.next = 238;
                return PDFNet.Rect.init(28, 551, 106, 623);
            case 238:
                context$3$0.t18 = context$3$0.sent;
                context$3$0.t19 = reader;

                return context$3$0.delegateYield(
                    readTextFromRect(context$3$0.t17, context$3$0.t18, context$3$0.t19),
                    "t20",
                    241
                );
            case 241:
                s1 = context$3$0.t20;
                console.log("Field 2: " + s1);

                context$3$0.t21 = first_page;
                context$3$0.next = 246;
                return PDFNet.Rect.init(208, 550, 387, 621);
            case 246:
                context$3$0.t22 = context$3$0.sent;
                context$3$0.t23 = reader;

                return context$3$0.delegateYield(
                    readTextFromRect(context$3$0.t21, context$3$0.t22, context$3$0.t23),
                    "t24",
                    249
                );
            case 249:
                s1 = context$3$0.t24;
                console.log("Field 3: " + s1);

                // ... 
                console.log("Done");
                context$3$0.next = 254;
                return PDFNet.endDeallocateStack();
            case 254:
                context$3$0.next = 260;
                break;
            case 256:
                context$3$0.prev = 256;
                context$3$0.t25 = context$3$0["catch"](192);
                console.log(context$3$0.t25.stack)
                ret = 1;
            case 260:
            case "end":
                return context$3$0.stop();
            }
        }, marked2$0[4], this, [[12, 185], [192, 256]]);
    }
    // start the generator
    PDFNet.runGeneratorWithCleanup(main());
}
})(window);