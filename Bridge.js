import EventEmitter from "events";
import debug from "debug";

import DeferredCall from "./DeferredCall"

const DEFAULT_SIZE = 10;
const DEFAULT_TIMEOUT = 10000;
const log = debug("bridge");

export default class Bridge extends EventEmitter {
  constructor (initializer, options = {}) {
    super();
    
    this.connected = false;
    this._targetP = Promise.resolve(initializer(this));
    
    // a little optimization to avoid unnecessary extra promise/then after resolution
    this._targetP.then(target => {
      log("set_target");
      this._target = target
    });

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
    log("disconnect")
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
    this._close = () => Promise.resolve(closer());
  }

  call (method, args) {
    if (this._target) {
      return this._target[method](...args);
    }

    return this._targetP.then(target => target[method](...args));
  }

  invoke (deferred) {
    if (this._target) {
      deferred.invoke(this._target);
      return;
    }

    this._targetP.then(target => deferred.invoke(target));
  }
}