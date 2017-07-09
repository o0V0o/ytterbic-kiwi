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
	left: { min: 500*4, center:3800, max: 2300*4, sharp: 7500, extra:6000, scale: 1000 },
	right: { min: 500*4, center:6800, max: 2300*4, sharp: 3500, extra:4600 },
	brakes: { left: {brake: 4000, neutral: 6000}, right: {brake: 7000, neutral: 5000} },
	speed: {fullReverse: 3000, neutral: (500*4+2300*4)/2, fullSpeed: 4*2300, minSpeed: 5800, fastSpeed: 5900}
}

var elements = {
	motorEnable: document.getElementById("motorEnable"),
	gamepadEnable: document.getElementById("gamepadEnable"),
	gamepad: document.getElementById("gamepad"),
	servos: [
		document.getElementById("esc"),
		document.getElementById("left"),
		document.getElementById("right"),
		document.getElementById("leftbrake"),
		document.getElementById("rightbrake"),
		document.getElementById("servo6")
	],
	calibrate: {
		active: document.getElementById("calibrateActive"),
		id: document.getElementById("servoId"),
		pos: document.getElementById("servoPos")
	}
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

function bilerp(a,b,c,t) {
	if (t>=0) {
		return lerp(b,c,t)
	} else {
		return lerp(a,b,t+1)
	}
}


function calibrate(msg) {
	if (elements.calibrate.active.checked) {
		var id = parseInt(elements.calibrate.id.value, 10)
		var pos = parseInt(elements.calibrate.pos.value, 10)
		var isSet = false
		var servos = msg.servos
		for (var i=0; i<servos.length; i++) {
			if (servos[i].idx == id) {
				servos[i].pos = pos
				isSet = true
			}
		}
		if (!isSet) {

			servos.push({id: id, pos:pos})
		}
	}
	return msg
}

function steeringAngle(angle) {
	var amount = angle * calibration.left.scale
	return {left: calibration.left.center + amount,
		right: calibration.right.center + amount}
	//return {left: lerp(calibration.left.min, calibration.left.max, zeroOneRange(angle)),
		//right: lerp(calibration.right.min, calibration.right.max, zeroOneRange(angle))}
}
function toServo(state) {
	var steering = steeringAngle(state.turn)
	var msg = { servos: [] }
	if (elements.motorEnable.checked){
		msg.servos.push( {idx: 0, pos: bilerp( calibration.speed.fullReverse, calibration.speed.neutral, calibration.speed.fullSpeed, (state.speed))})
	}

	if (state.brakeLeft) {
		msg.servos.push( {idx: 3, pos: calibration.brakes.left.brake} )
		steering.left = calibration.left.sharp
		steering.right = calibration.right.extra

	} else { 
		msg.servos.push( {idx: 3, pos: calibration.brakes.left.neutral} )
	}

	if (state.brakeRight) {
		msg.servos.push( {idx: 4, pos: calibration.brakes.right.brake} )
		steering.left = calibration.left.extra
		steering.right = calibration.right.sharp
	} else { 
		msg.servos.push( {idx: 4, pos: calibration.brakes.right.neutral} )
	}
	msg.servos.push( {idx: 1, pos: steering.left} )
	msg.servos.push( {idx: 2, pos: steering.right} )


	return msg
}

function updateState(state) {
	//if (state.fastBtn) { state.speed = calibration.speed.fastSpeed || calibration.speed.minSpeed }
	console.log(state.speed, calibration.speed.minSpeed)

	var servos = toServo(state)
	servos = calibrate(servos)
	for (var i=0;i<5;i++){
		if (servos.servos[i]) {
			if ( servos.servos[i].idx == 0 && state.goBtn) { servos.servos[i].pos = calibration.speed.minSpeed }
			if ( servos.servos[i].idx == 0 && state.fastBtn) { servos.servos[i].pos = calibration.speed.fastSpeed || calibration.speed.minSpeed }
			elements.servos[servos.servos[i].idx].textContent = servos.servos[i].pos
		}
	}
	if (pc!=undefined && "dataChannel" in pc) {
		//pc.dataChannel.send(JSON.stringify(servos))
		socket.emit("servo", servos)
	} else {
		socket.emit("servo", servos)
	}
}
var updateInterval = 50
var checkForGamepad = window.setInterval( function(){
	if(navigator.getGamepads()[0]){
		console.log("gamepad connected")
		elements.gamepad.style.background = "green"
		window.setInterval(function() {
			var gamepad = navigator.getGamepads()[0]
			if(elements.gamepadEnable.checked && gamepad != undefined){
				var state = {
					speed: Math.pow(-gamepad.axes[1], 3),
					turn: Math.pow(gamepad.axes[0], 3),
					goBtn: gamepad.buttons[1].pressed,
					fastBtn: gamepad.buttons[2].pressed,
					brakeLeft: gamepad.buttons[4].pressed,
					brakeRight: gamepad.buttons[5].pressed,
				}
				updateState(state)
			}
		}, updateInterval)
		window.clearInterval(checkForGamepad)
	} else if (elements.calibrate.active.checked) {
		state = {
			speed: 0,
			turn: 0,
			goBtn: 0,
			fastBtn: 0,
			brakeLeft: 0,
			brakeRight: 0,
		}
		updateState(state)
	}
}, 500)
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
