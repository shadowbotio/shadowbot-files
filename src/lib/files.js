"use strict"

const fs = require('fs-extra');
const EventEmitter = require('events');
const queueHandler = require('./queueHandler.js');
const worker = require('./worker.js');

class fileManager extends EventEmitter {
  constructor(LOC_RAW_AUDIO,LOC_AUDIO_RECORDINGS,LOC_WORKERS,LIMIT_NUM_WORKERS) {
    super();

    this.LOC_RAW_AUDIO = LOC_RAW_AUDIO;
    this.LOC_AUDIO_RECORDINGS = LOC_AUDIO_RECORDINGS;
    this.LOC_WORKERS = LOC_WORKERS;
    this.LIMIT_NUM_WORKERS = LIMIT_NUM_WORKERS;

    fs.ensureDirSync(this.LOC_RAW_AUDIO);
    fs.ensureDirSync(this.LOC_AUDIO_RECORDINGS);

    this.jobQueue = new queueHandler();
    this.workers = {};

    this.jobQueue.on('push',(serverID,data) => {
      this.delegateWork(serverID);
    });
  }

  spawnWorker(serverID) {
    if (!serverID) { return; }
    if (this.workers.length >= this.LIMIT_NUM_WORKERS) { console.log('Warning: worker limit exceeded'); }
    if (serverID in this.workers) { return; }
    const _worker = new worker(this.LOC_WORKERS,this.LOC_RAW_AUDIO,this.LOC_AUDIO_RECORDINGS);
    _worker.on('finished',() => { delete this.workers[serverID]; });
    _worker.on('ready',() => { this.delegateWork(serverID); });
    _worker.on('put-audio-recording',(data) => {
      const serverID = data['serverID'];
      const filepath = data['filepath'];
      if (!serverID || !filepath) { return; }
      this.emit('put-audio-recording',serverID,filepath);
    });
    this.workers[serverID] = _worker;
  }

  delegateWork(serverID) {
    if (!serverID) { return; }
    if (this.jobQueue.isEmpty(serverID)) { return; }
    if (!(serverID in this.workers)) { this.spawnWorker(serverID); }
    const _worker = this.workers[serverID];
    if (!worker) { return; }
    const data = this.jobQueue.pop(serverID);
    if (!data) { return; }
    _worker.giveWork(data);
  }

  postWork(serverID,data) {
    return new Promise((resolve,reject) => {
      if (!serverID || !data) { reject(); return; }
      this.jobQueue.push(serverID,data);
      resolve();
    });
  }

  deleteRawAudio(serverID) {
    return new Promise((resolve,reject) => {
      if (!serverID) {
        this.jobQueue.empty();
        fs.emptyDir(this.LOC_RAW_AUDIO)
          .then(() => { resolve(); return; })
          .catch((err) => { reject(); return; });
      }

      this.jobQueue.empty(serverID);
      fs.remove(`${this.LOC_RAW_AUDIO}/${serverID}`)
        .then(() => { resolve(); return; })
        .catch((err) => { reject(); return; });
    });
  }
}

module.exports = fileManager;
