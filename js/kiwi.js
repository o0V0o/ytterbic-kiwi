'use strict';

var isChannelReady = false;
var isInitiator = false; //are we the first one in the room?
var isStarted = false;
var localStream;
var pc;
var remoteStream;
var turnReady;

// Set up audio and video regardless of what devices are present.
var sdpConstraints = {
  'mandatory': {
    'OfferToReceiveAudio': false,
    'OfferToReceiveVideo': false
  }
};

/////////////////////////////////////////////

var room = 'foo';
// Could prompt for room name:
// room = prompt('Enter room name:');

// create a websocket to the localhost node server
var socket = io.connect();

if (room !== '') {
  socket.emit('create or join', room);
  console.log('Attempted to create or  join room', room);
}

socket.on('log', function(array) {
  console.log.apply(console, array);
});

var pc;
// This client receives a message
socket.on('message', function(message) {
  console.log('Client received message:', message);
  if (message.type === 'offer') {
		pc = handleOffer()
  } else if (message.type === 'answer') {
		console.log("UhOd!")
   } else if (message.type === 'candidate') {
    var candidate = new RTCIceCandidate({
      sdpMLineIndex: message.label,
      candidate: message.candidate
    });
    pc.addIceCandidate(candidate);
  } else if (message === 'bye') {
    handleRemoteHangup();
  }
});

////////////////////////////////////////////////////

//var localVideo = document.querySelector('#localVideo');
//var remoteVideo = document.querySelector('#remoteVideo');
//
// navigator.mediaDevices.getUserMedia({
//   audio: false,
//   video: true
// })
// .then(gotStream)
// .catch(function(e) {
//   alert('getUserMedia() error: ' + e.name);
// });
//
// function gotStream(stream) {
//   console.log('Adding local stream.');
//   localVideo.src = window.URL.createObjectURL(stream);
//   localStream = stream;
//   sendMessage('got user media');
// }
