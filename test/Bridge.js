import EventEmitter from "events";
import assert from "assert";
import expect from "expect";

import Bridge from "../src/Bridge"
import { spy } from "./util";

const noop = () => {};
const noopInitializer = b => b.onClose(noop);

const sym = Symbol();

const makeTarget = (db = {}) => ({
  set (k, v) { db[k] = v; },
  get (k) {
    if (db[k]) return db[k];
    throw new Error("key not found")
  },
  reject () { return Promise.reject(new Error("rejected")); },
  [sym] (x) { return x; }
});

const bridgeWithDb = db => new Bridge(b => {
  b.onClose(noop);
  return makeTarget(db);
})

describe("Bridge", () => {

  it("requires a function as first argument", () => {
    expect(() => new Bridge()).toThrow(assert.AssertionError)
  }); 

  it("requires initializer calls bridge.onClose with a function", () => {
    expect(() => new Bridge(bridge => {
      bridge.onClose();
    })).toThrow(assert.AssertionError)
  });

  it("instantiates properly", () => {
    const bridge = new Bridge(noopInitializer);
    expect(bridge).toBeA(EventEmitter);
  });

  describe("#hasConnected", () => {
    it("sets the `connected` property and emits an event", done => {
      const bridge = new Bridge(noopInitializer);
      bridge.on("connect", () => {
        expect(bridge.connected).toEqual(true);
        done();
      });
      bridge.hasConnected();
    });
  });

  describe("#hasDisconnected", () => {
    it("sets the `connected` property and emits an event", done => {
      const bridge = new Bridge(noopInitializer);
      bridge.on("disconnect", () => {
        expect(bridge.connected).toEqual(false);
        done();
      });
      bridge.hasConnected();
      bridge.hasDisconnected();
    });
  });

  describe("#onClose / #close", () => {
    it("#onClose sets the #close handler", done => {
      const f = spy(sym);
      const bridge = new Bridge(function (bridge) {
        bridge.onClose(f);
      });
      bridge.close().then(function (result) {
        expect(result).toEqual(sym);
        expect(f.count).toEqual(1);
        done();
      });
    });
  });

  describe("#call", () => {
    it("rejects when method argument isn't a string or symbol", done => {
      bridgeWithDb().call({}).catch(err => {
        expect(err).toBeA(TypeError);
        done();
      })
    });

    it("rejects when args argument isn't an array", done => {
      bridgeWithDb().call("get", {}).catch(err => {
        expect(err).toBeA(TypeError);
        done();
      })
    });

    it("works when initializer returns the target", done => {
      bridgeWithDb({key: sym}).call("get", ["key"]).then(result => {
        expect(result).toEqual(sym);
        done();
      });
    });

    it("works when initializer returns promise of target", done => {
      new Bridge(b => {
        b.onClose(noop);
        return new Promise(resolve => {
          setTimeout(() => resolve(makeTarget({key: sym})), 100)
        });
      }).call("get", ["key"]).then(result => {
        expect(result).toEqual(sym);
        done();
      });
    });

    it("works when method throws an error", done => {
      bridgeWithDb().call("get", ["key"]).catch(err => {
        expect(err).toBeA(Error);
        expect(err.message).toEqual("key not found");
        done();
      });
    });

    it("works when method rejects", done => {
      bridgeWithDb().call("reject").catch(err => {
        expect(err).toBeA(Error);
        expect(err.message).toEqual("rejected");
        done();
      });
    });

    it("can call a method with a symbol", done => {
      bridgeWithDb().call(sym, [1]).then(result => {
        expect(result).toEqual(1);
        done();
      });
    });
  });

  describe("#invoke", () => {
    it("calls invoke method of argument, passing target as argument", done => {
      const f = spy();
      const mock = { invoke: f };
      const target = makeTarget();
      const b = new Bridge(b => {
        b.onClose(noop);
        return target;
      });
      b.invoke(mock);

      // mock.invoke may be called asynchronously
      setImmediate(() => {
        expect(f.count).toEqual(1);
        expect(f.args[0][0]).toEqual(target);
        done();
      });
    });
  });

});