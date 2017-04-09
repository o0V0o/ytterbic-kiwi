//'use strict';
//
// var isChannelReady = false;
// var isInitiator = false; //are we the first one in the room?
// var isStarted = false;
// var localStream;
// var pc;
// var remoteStream;
// var turnReady;
//
// // Set up audio and video regardless of what devices are present.
// var sdpConstraints = {
//   'mandatory': {
//     'OfferToReceiveAudio': false,
//     'OfferToReceiveVideo': true
//   }
// };

var pc;

/////////////////////////////////////////////

var call = document.getElementById("callButton")
call.onclick = function () {
	pc = sendOffer(null, {audio:true, video:false})
}

var tnst = document.getElementById("testButton")
tnst.onclick = function () {
	if (pc) {
		console.log("click")
		pc.dataChannel.send("hello!")
	}
}

var start = document.getElementById("startButton")
start.onclick = function() {
	socket.emit("espset", {test:64})
}

var reload = document.getElementById("reloadBtn")
reload.onclick = function() {
	socket.emit("message", {type:'reload'})
}

/////////////////////////////////////////////

var room = 'foo';
// Could prompt for room name:
// room = prompt('Enter room name:');

// create a websocket to the node server
var socket = io.connect();

if (room !== '') {
  socket.emit('create or join', room);
  console.log('Attempted to create or  join room', room);
}
socket.on('log', function(array) {
  console.log.apply(console, array);
});


// This client receives a message
socket.on('message', function(message) {
  console.log('Client received message:', message);
	if (message.type === 'reload') {
		console.log("reloading")
		window.location.reload()
	}
	if (message.type === 'offer') {
		pc = handleOffer(message)
  } else if (message.type === 'answer' && pc) {
		handleAnswer(message, pc)
		//pc.setRemoteDescription(new RTCSessionDescription(message));
  } else if (message.type === 'candidate' && pc) {
    //var candidate = new RTCIceCandidate({
      //sdpMLineIndex: message.label,
    //  candidate: message.candidate
    //});
    pc.addIceCandidate(new RTCIceCandidate(message.candidate)).catch(debugHandler("woops."));
  } else if (message === 'bye' && isStarted) {
  }
});

////////////////////////////////////////////////////

//var localVideo = document.querySelector('#localVideo');
//var remoteVideo = document.querySelector('#remoteVideo');
