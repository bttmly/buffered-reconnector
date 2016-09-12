# buffered-reconnector

Attempts to solve a common problem: transparently reconnecting to a remote resource when it unexpectedly disconnects, and buffering calls while attempting to reconnect. Buffer limits and timeouts are supported. 

Example reconnecting to RabbitMQ automatically with [amqplib](http://www.squaremobius.net/amqp.node/channel_api.html#model_close)

```js
import Reconnector from "buffered-reconnector";
import amqp from "amqplib";

const rc = new Reconnector(function (bridge) {
  // this function is called the "initializer"
  const connP = amqp.connect();
  const chanP = connP.then(conn => conn.createChannel());

  chanP.then(chan => {
    chan.on("error", () => bridge.hasDisconnected());
    bridge.hasConnected();
  });

  bridge.onClose(() => connP.then(conn => conn.close()));

  return chanP;
});

// needs ES6 proxy
const prox = rc.createProxy();

// you can call this method immediately (i.e. while establishing a connection)
prox.sendToQueue("my_queue", new Buffer("hello!"))
  .then(() => rc.close());

// or, without proxies, there's this sort of balky API
rc.call("sendToQueue", ["my_queue", new Buffer("hello")])
   .then(() => rc.close());

// now the process can exit cleanly
```

A couple things to note about properly implementing the initializer, for any underlying client.
- It is required to call `bridge.onClose` in the initializer function. This determines how to close the underlying connection cleanly.
- The initializer should call `bridge.hasConnected` to signal that the connection has been established.
- The initializer should call `bridge.hasDisconnected` to signal that the connection has been interrupted.
- `createProxy()` and `call()` forward method calls to the object/promise returned from the initializer.
