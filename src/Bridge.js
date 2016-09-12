import EventEmitter from "events";
import assert from "assert";
import debug from "debug";

import DeferredCall from "./DeferredCall"

const DEFAULT_SIZE = 10;
const DEFAULT_TIMEOUT = 10000;
const log = debug("bridge");

export default class Bridge extends EventEmitter {
  constructor (initializer, options = {}) {
    super();

    assert.equal(typeof initializer, "function");

    this.connected = false;
    this._targetP = Promise.resolve(initializer(this));

    // forces initializer to call bridge.onClose
    if (!this._close) {
      throw new Error("Initializer needs to provide a disconnect handler");
    }
  }

  // when underlying client has connected
  hasConnected () {
    log("connect");
    this.connected = true;
    this.emit("connect");
  }

  // called when client has disconnected
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
    assert.equal(typeof closer, "function");
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
}