import Mock from "./Mock";
import Reconnector from "../"

let current;

process.on("unhandledRejection", err => { throw err; });

const r = new Reconnector(function (bridge) {
  const m = current = new Mock({
    connectDelay: 1000,
    callDelay: 100,
  });

  m.connect();

  // ... if we have an API where you call methods on bridge
  // in the initializer, we can check for errors immediately
  // in the Bridge constructor. However, it's not as flexible
  // as providing the API where there are connect/close notifiers
  // on bridge that are called asynchronously in the future
  // i.e. triggered by an event

  // bridge.connectedEvent(m, "connect");
  // bridge.disconnectedEvent(m, "close");

  // alert the bridge object that we're up
  m.on("connect", () => bridge.hasConnected());

  // alert the bridge object that we're down
  m.on("close", () => bridge.hasDisconnected());
  
  // do something...
  m.on("error", err => {});

  // specifies how to disconnect gracefully when asked
  bridge.onClose(() => m.close());

  // this is crucial, we need to proxy methods to this thing
  return m;
});

const p = r.createProxy();

setTimeout(() => { 
  throw new Error("Process should have exited by now!")
}, 10000).unref();

Promise.resolve()
  .then(() => p.set(1, "one"))
  .then(() => p.set(2, "two"))
  .then(() => p.get(1))
  .then(val => console.log("key:", 1, "val:", val))
  .then(() => p.get(2))
  .then(val => console.log("key:", 2, "val:", val))
  .then(() => {
    // close the underlying client directly -- simulates
    // unexpected close scenario
    current.close();
  })
  .then(() => p.get(1))
  // here we see that key 1 returns null -- the old value
  // vanished b/c the underlying bridge and client have changed
  .then(val => console.log("key:", 1, "val:", val))
  // close the reconnector, letting the program exit
  .then(() => r.close());



// setTimeout(() => {
//   console.log('closing');
//   r.close();
// }, 1000)
