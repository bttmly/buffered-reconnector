import EventEmitter from "events";
import assert from "assert";

import expect from "expect";
import Bridge from "../src/Bridge"

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
    const bridge = new Bridge(bridge => {
      bridge.onClose(() => {});
    });
    expect(bridge).toBeA(EventEmitter);
  });

});