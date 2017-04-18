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

var calibration = {
	left: { min: 500*4, max: 2300*4 },
	right: { min: 500*4, max: 2300*4 },
}

var elements = {
	gamepad: document.getElementById("gamepad")
}
var call = document.getElementById("callBtn")
call.onclick = function () {
	pc = sendOffer(null, {audio:true, video:false})
}
var reload = document.getElementById("reloadBtn")
reload.onclick = function() {
	socket.emit("message", {type:'reload'})
}

//var espAddr = document.getElementById("espAddr")
//espAddr.addEventListener("input", function() {
	//socket.emit("espaddr", espAddr.value)
//})

/////////////////////////////////////////////


function zeroOneRange(value){
	return (value+1.0)/2
}

/*
function toEspCode(state) {
	return {
		filename: "state",
		escTimeout: (zeroOneRange(state.speed) * 1000) + 1000
	}
}
*/

function lerp(a,b,t) {
	return a + (b-a)*t
	//return a*(1-t) + b*t
}

function steeringAngle(angle) {
	return {left: lerp(calibration.left.min, calibration.left.max, zeroOneRange(angle)),
		right: lerp(calibration.right.min, calibration.right.max, zeroOneRange(angle))}
}
function toServo(state) {
	var steering = steeringAngle(state.turn)
	var msg = { servos: [] }
	msg.servos.push( {idx: 0, pos: lerp( 4*500, 4*2300, zeroOneRange(state.speed))})
	msg.servos.push( {idx: 1, pos: steering.left} )
	msg.servos.push( {idx: 2, pos: steering.right} )

	return msg
}

var updateInterval = 50
var checkForGamepad = window.setInterval( function(){
	if(navigator.getGamepads()[0]){
		console.log("gamepad connected")
		elements.gamepad.style.background = "green"
		window.setInterval(function() {
			var gamepad = navigator.getGamepads()[0]
			if(gamepad != undefined){
				var state = {
					speed: -gamepad.axes[3],
					turn: gamepad.axes[0],
					goBtn: gamepad.buttons[5].pressed,
					fastBtn: gamepad.buttons[3].pressed
				}
				if (pc!=undefined && dataChannel in pc) {
					pc.dataChannel.send(JSON.stringify(toServo(state)))
				} else {
					socket.emit("servo", toServo(state))
					console.log(toServo(state).servos[0])
				}
			}
		}, updateInterval)
		window.clearInterval(checkForGamepad)
	}
}, 1000)
navigator.getGamepads()[0]

/////////////////////////////////////////////
/*
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
*/

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
