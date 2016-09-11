# buffered-reconnector

Attempts to solve a common problem: transparently reconnecting to a remote resource when it unexpectedly disconnects, and buffering calls while attempting to reconnect.

Example reconnecting to RabbitMQ automatically with [amqplib](http://www.squaremobius.net/amqp.node/channel_api.html#model_close)

```js
import Reconnector from "buffered-reconnector";
import amqp from "amqplib";

const rc = new Reconnector(function (bridge) {
  const connP = amqp.connect();
  const chanP = connP.then(conn => conn.createChannel());

  chanP.then(chan => {
    chan.on("error", () => bridge.hasDisconnected());
    bridge.hasConnected();
  });

  bridge.onClose(() => connP.then(conn => conn.close()));

  return chanP;
});

const prox = rc.createProxy();
prox.sendToQueue("my_queue", new Buffer("hello!"))
  .then(() => rc.close());
```