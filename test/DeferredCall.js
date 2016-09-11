import expect from "expect";

import DeferredCall from "../src/DeferredCall"
import { spy } from "./util";

const noop = () => {};

process.on("unhandledRejection", err => { throw err; });

describe("DeferredCall", () => {

  it("accepts a function as first argument", () => {
    const call = new DeferredCall(noop);
  });

  it("accepts a string as first argument", () => {
    const call = new DeferredCall("get");
  });

  it("errors if first argument is not string or function", () => {
    expect(() => new DeferredCall({})).toThrow(TypeError);
  });

  it("errors if second argument is provided but not an array", () => {
    expect(() => new DeferredCall(noop, {})).toThrow(TypeError);
  });

  describe("#invoke", () => {

    it("works with a function reference and no target argument", () => {
      const f = spy();
      const arg = {};
      const call = new DeferredCall(f, [arg]);
      call.invoke();
      expect(f.count).toEqual(1);
      expect(f.args[0][0]).toEqual(arg);
      expect(f.selfs[0]).toEqual(undefined);
    });

    it("works with a function reference and a target argument", () => {
      const f = spy();
      const arg = {};
      const self = {};
      const call = new DeferredCall(f, [arg]);
      call.invoke(self);
      expect(f.count).toEqual(1);
      expect(f.args[0][0]).toEqual(arg);
      expect(f.selfs[0]).toEqual(self);
    });

    it("works with a string name and a target argument", () => {
      const f = spy();
      const arg = {};
      const self = { f };
      const call = new DeferredCall("f", [arg]);
      call.invoke(self);
      expect(f.count).toEqual(1);
      expect(f.args[0][0]).toEqual(arg);
      expect(f.selfs[0]).toEqual(self);
    });

    it("only calls inner function once even if called multiple times", () => {
      const f = spy();
      const call = new DeferredCall(f);
      call.invoke();
      call.invoke();
      expect(f.count).toEqual(1);
    });

  });

  describe("#promise", () => {

    it("it resolves correctly", done => {
      const f = x => x;
      const arg = {};
      const call = new DeferredCall(f, [arg]);
      call.promise().then(result => {
        expect(result).toEqual(arg);
        done();
      });
      call.invoke();
    });

    it("it rejects correctly", done => {
      const f = () => { throw new Error("Kaboom!") }
      const call = new DeferredCall(f);
      call.promise().catch(err => {
        expect(err).toBeA(Error);
        expect(err.message).toEqual("Kaboom!");
        done();
      });
      call.invoke();
    });

    it("times out correctly", done => {
      const call = new DeferredCall(noop, [], 10);
      call.promise().catch(err => {
        expect(err).toBeA(Error);
        expect(err.message).toEqual("Timeout");
        done();
      });
      // never invoked
    });

    it("timeout is cancelled on invoke(), not resolution", done => {
      const arg = {};
      const slow = arg => new Promise(resolve => setTimeout(resolve, 100, arg));
      const call = new DeferredCall(slow, [arg], 10);
      call.promise().then(value => {
        expect(value).toEqual(arg);
        done();
      });
      call.invoke();
    });

  });

});