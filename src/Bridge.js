import EventEmitter from "events";
import debug from "debug";

import DeferredCall from "./DeferredCall"

const DEFAULT_SIZE = 10;
const DEFAULT_TIMEOUT = 10000;
const log = debug("bridge");

export default class Bridge extends EventEmitter {
  constructor (initializer, options = {}) {
    super();
    if (typeof initializer !== "function") {
      throw new TypeError("initializer must be a function")
    }

    this.connected = false;

    // maybe this should happen in a method call rather than using
    // the initializer's return value?
    this._targetP = Promise.resolve(initializer(this));

    // forces initializer to call bridge.onClose
    if (!this._close) {
      throw new Error("Initializer needs to provide a disconnect handler");
    }
  }

  // we're deferring to the Reconnector a bit here -- "connect" and
  // "disconnect" are both listened to with .once()

  // when underlying client has connected
  // TODO -- determine whether calling this more than once is a problem
  hasConnected () {
    log("connect");
    this.connected = true;
    this.emit("connect");
  }

  // called when client has disconnected
  // TODO -- determine whether calling this more than once is a problem
  hasDisconnected () {
    log("disconnect");
    this.connected = false;
    // this flag is set when closing (no reconnect)
    if (this._closing) return;
    this.emit("disconnect");
  }

  // disconnect gracefully. set the flag since the way
  // the initializer works, it'll probably emit an event
  // that will invoke hasDisconnected()
  close () {
    log("close");
    this._closing = true;
    return this._close();
  }

  // initializer must call this to set the closer
  onClose (closer) {
    if (typeof closer !== "function") {
      throw new TypeError("closer must be a function")
    }

    this._close = () => Promise.resolve(closer());
  }

  call (method, args = []) {
    if (typeof method !== "string" && typeof method !== "symbol") {
      return Promise.reject(new TypeError("method must be string or symbol"))
    }

    if (!Array.isArray(args)) {
      return Promise.reject(new TypeError("args must be an array"))
    }

    // assert args is array
    return this._targetP.then(target => target[method](...args));
  }

  invoke (deferred) {
    this._targetP.then(target => deferred.invoke(target));
  }

  // might be useful for debugging, setting/getting non-method properties, other weird cases
  getTarget () { return this._targetP }
}