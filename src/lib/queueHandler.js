"use strict"

const EventEmitter = require('events');

class queueHandler extends EventEmitter {
  constructor() {
    super();

    this.queue = {};
  }

  push(key,value) {
    if (!(key in this.queue)) { this.queue[key] = []; }
    this.queue[key].push(value);
    this.emit('push',key,value);
  }

  pop(key) {
    if (!(key in this.queue)) {
      let longest_length = null;
      let longest_key = null;
      for (let [key,value] of this.queue) {
        if (!longest_length || value.length > longest_length) {
          longest_key = key;
          longest_length = value.length;
        }
      }
      key = longest_key;
    }
    let value = this.queue[key].pop();
    if (this.queue[key].length == 0) { delete this.queue[key]; this.emit('empty',key); }
    if (this.queue.length == 0) { this.emit('empty'); }
    return value;
  }

  isEmpty(key) {
    if (!key) { return; }
    if (!(key in this.queue)) { return true; }
    if (this.queue[key].length == 0) { return true; }
    return false;
  }

  empty(key) {
    if (!(key in this.queue)) {
      this.queue = {};
      this.emit('empty');
      return;
    }
    delete this.queue[key];
    this.emit('empty',key);
  }
}

module.exports = queueHandler;
