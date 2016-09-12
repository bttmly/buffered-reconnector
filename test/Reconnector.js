import expect from "expect";

import Reconnector from "../src/Reconnector"
import Bridge from "../src/Bridge"
import { spy } from "./util"

const noop = () => {};
const noopInitializer = b => b.onClose(noop);

const testInitializer = b => {

}

const makeNCalls = (rc, n) => {
  while (n) {
    rc.call();
    n -= 1;
  }
}

describe("Reconnector", () => {

  describe("constructor", () => {

    it("requires an initializer function", () => {
      expect(() => new Reconnector()).toThrow(TypeError);
    });
 
    it("initializer must satisfy bridge", () => {
      // didn't call bridge.onClose
      expect(() => new Reconnector(noop)).toThrow(Error);
    });

    it("initializer is invoked on instantiation w/ a bridge", () => {
      const f = spy(noopInitializer);
      new Reconnector(f);
      expect(f.count).toEqual(1);
      expect(f.args[0][0]).toBeA(Bridge);
    });

  });

  describe("#call / buffer / size", () => {

    it("options.size sets _size", () => {
      const rc = new Reconnector(noopInitializer, {size: 1});
      expect(rc._size).toEqual(1);
    });

    it("before connect, call buffers", () => {
      const rc = new Reconnector(noopInitializer, {size: 1});
      rc.call("x", [1])
    });

  });

});
