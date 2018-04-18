"use strict"

const EventEmitter = require('events');
const pyshell = require('python-shell');

class worker extends EventEmitter {
  constructor(LOC_WORKERS,LOC_RAW_AUDIO,LOC_AUDIO_RECORDINGS) {
    super();

    this.LOC_WORKERS = LOC_WORKERS;
    this.LOC_RAW_AUDIO = LOC_RAW_AUDIO;
    this.LOC_AUDIO_RECORDINGS = LOC_AUDIO_RECORDINGS;

    this.options = {
      mode:'json',
      args: [this.LOC_RAW_AUDIO,this.LOC_AUDIO_RECORDINGS]
    };

    /*
    this.shell = new pyshell(this.LOC_WORKERS,this.options);
    this.shell.send(data);

    this.shell.on('message', (msg) => {
      if (msg['result']) { this.result = msg['result']; }
    });

    this.shell.end(() => {
      if (this.result) {
        if (this.oncomplete) { this.oncomplete(this.result) };
      } else {
        if (this.onerror) { this.error(null); }
      }
      this.emit('end');
    });*/
  }

  giveWork(data) {
    if (data['type'] != 'raw-audio') { this.emit('put-audio-recording',data['metadata']['serverID'],'/home/steven/Project-Sootsprite/v2/src/client/workaround.mp3'); }
    this.emit('ready');
  }
}

module.exports = worker;
