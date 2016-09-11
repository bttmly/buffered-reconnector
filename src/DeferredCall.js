const DEFAULT_TIMEOUT = 5000;

// TODO -- for debuggability we might want to save the stack trace at creation?
// Error.captureStackTrace(this, DeferredCall);

export default class DeferredCall {
  // method argument can either be a string name or a function reference
  constructor (method, args = [], timeout = DEFAULT_TIMEOUT) {
    if (typeof method !== "string" && typeof method !== "function") {
      throw new TypeError("method argument must be string or function");
    }

    if (!Array.isArray(args)) {
      throw new TypeError("args argument must be an array");
    }

    this._method = method;
    this._args = args;
    
    this._promise = new Promise((resolve, reject) => {
      this._resolve = resolve; this._reject = reject;
    });

    this._timer = setTimeout(() => 
      this._reject(new Error("Timeout")), timeout
    ).unref();

    this._invoked = false;
  }

  // invoke doesn't return anything, but it the original caller's promise gets resolved
  invoke (obj) {
    const {_method, _args, _resolve, _reject, _timer, _invoked} = this;

    // not sure what to do here... ignore it, or throw an error?
    // almost certainly we want to prevent multiple calls, as they'll race to resolve
    if (_invoked) return;
    this._invoked = true;

    // clear the timeout before we start the method. the timeout refers to only the 
    // time spent waiting to START the method call, not the duration of the call itself
    clearTimeout(_timer);

    if (typeof _method === "string" && obj == null) {
      reject("Must pass an invoke target if using a string reference")
      return;
    }

    try {
      let result = typeof _method === "function" ?
        _method.apply(obj, _args) : obj[_method](..._args);
        
      Promise.resolve(result).then(_resolve).catch(_reject);
    } catch (e) { _reject(e); } 
  }

  promise () { return this._promise }

  // if we capture stack trace at instantiation, we probably want to wrap errors in some way
  // to show the caller the original call stack
  // wrapError (err) {}
}