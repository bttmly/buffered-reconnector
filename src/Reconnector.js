import debug from "debug";

import Bridge from "./Bridge";
import DeferredCall from "./DeferredCall";

const log = debug("reconnector");

// TODO -- event emitter for lifecycle stuff?
export default class Reconnector {
  constructor (initializer, options = {}) {
    if (typeof initializer !== "function") {
      throw new Error("initializer must be a function");
    }

    this._initializer = initializer;
    this._options = options;
    this._size = options.size;
    this._timeout = options.timeout;
    this._buffer = [];
    this._closed = false;
    
    this._initialize();
  }

  _initialize () {
    log("creating_bridge");

    // referencing this as 'bridge' ensures any event handlers in here
    // can only ever refer to this instance. it is generally possible
    // that a bridge might fire an event after we've supposedly cleaned it
    const bridge = new Bridge(this._initializer, this._options);

    bridge.once("connect", () => {
      log("flushing", this._buffer.length);
      while (this._buffer.length) {
        bridge.invoke(this._buffer.shift());
      }
    });

    // need to handle disconnect events coming from below
    bridge.once("disconnect", () => {
      log("reinitialize");
      this._initialize()
    });

    this._bridge = bridge;
  };

  close () {
    log("close");
    this._closed = true;
    return this._bridge.close();
  }

  // if proxies are available, this is an elegant way of getting a persistent object
  // to call methods on, even as the underlying bridge instance may change
  createProxy () {
    return new Proxy({}, {
      get: (__, method) => {
        return (...args) => {
          log("proxy:" + method);
          return this.call(method, args)
        }
      },
    });
  }

  // without proxies, you have to deal with this ugliness directly
  call (method, args) {
    if (this._closed) {
      log("call_after_close:" + method);
      return Promise.reject(new Error("Reconnector is closed"));
    }

    if (this._bridge.connected) {
      log("direct_call:" + method);
      return this._bridge.call(method, args);
    }

    if (this._size && this._buffer.length >= this._size) {
      log("buffer_full");
      return Promise.reject(new Error("Call buffer is full"));
    }

    log("deferred_call:" + method);
    const call = new DeferredCall(method, args, this._timeout);
    this._buffer.push(call);
    return call.promise();
  }
}
