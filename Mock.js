import EventEmitter from "events";
import Bluebird from "bluebird";

// in-memory mock of remote k/v store e.g. Redis
export default class Mock extends EventEmitter {
  constructor (options = {}) {
    super();
    this._callDelay = options.callDelay || 0;
    this._connectDelay = options.connectDelay || 0;
    this._db = {};
  }

  connect () {
    Bluebird.delay(this._connectDelay)
      .then(() => this.emit("connect"));

    // holds the process open
    this._interval = setInterval(() => {}, 1000);
  }

  close () {
    // console.log("client closing...");
    clearInterval(this._interval);
    this.emit("close");
  }

  get (key) {
    return Bluebird.delay(this._callDelay)
      .then(() => this._db.hasOwnProperty(key) ? this._db[key] : null);
  }

  set (key, value) {
    return Bluebird.delay(this._callDelay)
      .then(() => this._db[key] = value, null)
  }
}