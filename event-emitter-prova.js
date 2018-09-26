var events = require('events');
var eventEmitter = new events.EventEmitter();
var eventEmitter2 = new events.EventEmitter();

//Create an event handler:
var myEventHandler = function () {
  console.log('I hear a scream!');
}

//Assign the event handler to an event:
eventEmitter2.on('scream', myEventHandler);
//eventEmitter.on('scream', myEventHandler);

//Fire the 'scream' event:
eventEmitter.emit('scream');