const DEFAULT_TIMEOUT = 5000;

// TODO -- for debuggability we might want to save the stack trace at creation?
// Error.captureStackTrace(this, DeferredCall);

export default class DeferredCall {
  // method argument can either be a string name or a function reference
  constructor (method, args, timeout = DEFAULT_TIMEOUT) {
    this._method = method;
    this._args = args;
    
    this._promise = new Promise((resolve, reject) => {
      this._resolve = resolve;
      this._reject = reject;
    });

    this._timer = setTimeout(() => 
      this.reject(new Error("Timeout")), timeout
    ).unref();
  }

  // invoke doesn't return anything, but it the original caller's promise gets resolved
  invoke (obj) {
    const {_method, _args, _resolve, _reject, _timer} = this;
    // clear the timeout before we start the method. the timeout refers to only the 
    // time spent waiting to START the method call, not the duration of the call itself
    clearTimeout(_timer);

    if (typeof _method !== "function" && obj == null) {
      reject("Must pass a invoke target if using a string reference")
      return;
    }

    if (typeof _method === "function") {
      _method.apply(obj, _args).then(_resolve).catch(_reject);
      return;
    }

    obj[_method](..._args).then(_resolve).catch(_reject);
  }

  promise () { return this._promise }

  // if we capture stack trace at instantiation, we probably want to wrap errors in some way
  // to show the caller the original call stack
  // wrapError (err) {}
}