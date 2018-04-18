"use strict";

// arguments parsing //
const num_args = process.argv.length - 2;
if (num_args < 6) { throw new Error(`The permissions service expects 6 arguments (got ${num_args})`); }

const LOC_RAW_AUDIO = process.argv[2];
const LOC_AUDIO_RECORDINGS = process.argv[3];
const LOC_WORKERS = process.argv[4];
const LIMIT_NUM_WORKERS = process.argv[5];
const LISTENING_PORT = process.argv[6];
const PORT_CLIENT = process.argv[7];

// dependencies //
const express = require('express');
const bodyParser = require('body-parser');
const request = require('request-promise-native');
const files = require('./lib/files.js');

// initialisation //
const fileManager = new files(LOC_RAW_AUDIO,LOC_AUDIO_RECORDINGS,LOC_WORKERS,LIMIT_NUM_WORKERS);
fileManager.on('put-audio-recording',(serverID,filepath) => { putAudioRecording(serverID,filepath); });

// express routing //
const service = express();
service.use(bodyParser.json({limit: '50mb'}));
service.listen(LISTENING_PORT, () => { console.log(`Listening on port ${LISTENING_PORT}`); });

service.get('/audio-recordings/:serverID', (req,res) => {
  const data = req.body;
  if (!data || !data['metadata']) { res.sendStatus('400').end(); return; }

  const serverID = req.params['serverID'];
  const time = data['metadata']['time'];

  if (!serverID || !time) { res.sendStatus('400').end(); return; }
  const jobdata = {
    type:'get-audio-recording',
      metadata: {
        serverID:serverID,
        time:time
      }
    };

  fileManager.postWork(serverID,jobdata)
    .then((filepath) => { res.sendStatus('202').end(); })
    .catch((err) => { res.sendStatus('500').end(); });
});

service.post('/raw-audio', (req,res) => {
  const data = req.body;
  if (!data || !data['metadata']) { res.sendStatus('400').end(); return; }

  const serverID = data['metadata']['serverID'];
  const channelID = data['metadata']['channelID'];
  const userID = data['metadata']['userID'];
  const starttime = data['metadata']['starttime'];
  const file = data['file'];

  if (!serverID || !channelID || !userID || !starttime || !file) { res.sendStatus('400').end(); return; }
  const jobdata = {
    type:'raw-audio',
    metadata: {
      file:file,
      serverID:serverID,
      channelID:channelID,
      userID:userID,
      starttime:starttime
    }
  };

  fileManager.postWork(serverID,jobdata)
    .then(() => { res.sendStatus('204').end(); })
    .catch((err) => { res.sendStatus('500').end(); });
});

service.delete('/raw-audio/:serverID', (req,res) => {
  const serverID = req.params['serverID'];
  let _serverID = serverID;
  if (serverID == '*') { _serverID = null; }

  fileManager.deleteRawAudio(_serverID)
    .then(() => { res.sendStatus('204').end(); })
    .catch((err) => { res.sendStatus('500').end(); });
});

function putAudioRecording(serverID,filepath) {
  if (!serverID || !filepath) { return; }
  let options = {
    uri:`http://localhost:${PORT_CLIENT}/audio-recordings/${serverID}`,
    method:'put',
    json:true,
    body: { serverID:serverID, filepath:filepath }
  };
  
  request(options)
    .then()
    .catch((err) => { throw err; });
}
