var servers = {
	'iceServers': [{url:'stun:stun.l.google.com:19302'}]
}

var data;
var showLocal=false;

function sendMessage(msg) {
	console.log("Client sending message:", msg)
	socket.emit('message', msg)
}

function createPeerConnection() {
	var pc = new RTCPeerConnection(servers)
	pc.onicecandidate = handleIceCandidate(pc)
	pc.onaddstream = handleAddStream(pc)
	pc.onremovestream = debugHandler("remove stream")
	//pc.onnegotiationneeded = handleNegotiation(pc)
	pc.ondatachannel = handleDataChannel(pc)
	pc.oniceconnectionstatechange = function(err){
		console.log('ICE stuff:', err)
	       console.log('ICE state: ',pc.iceConnectionState);
	}
	console.log("> created peer connection", pc)
	return pc
}

function debugHandler(msg) {
	return function(event){
		console.log(msg, event);
	}
}

var defaultMediaConstraints = {
	audio:true,
	video:true
}
var offerConstraints = {
	offerToReceiveAudio: 0,
	offerToReceiveVideo: 1
}

function sendOffer(pc, mediaConstraints){
	mediaConstraints = mediaConstraints || defaultMediaConstraints
	pc = pc || createPeerConnection()
	data = pc.createDataChannel("omfgData", {ordered: false})

	data.onopen = debugHandler("data open")
	data.onmessage = debugHandler("data got")
	data.onclose = debugHandler("data close")
	data.onerror = debugHandler("data error")

	pc.dataChannel = data // export as part of the connection

	console.log("constraints", mediaConstraints)
	navigator.mediaDevices.getUserMedia(mediaConstraints).then(function(stream){
		pc.addStream(stream);
	}).catch(debugHandler("whoops. no media."))
	console.log("> set up initial peer connection", pc)
	makeOffer(pc)
	// leave it to the 'negotiationneeded' handler to send the *actual* offer
	return pc;
}

function handleOffer(msg, pc, mediaConstraints) {
	mediaConstraints = mediaConstraints || defaultMediaConstraints
	pc = pc || createPeerConnection()
	pc.setRemoteDescription(new RTCSessionDescription(msg.sdp)).then(function () {
		return navigator.mediaDevices.getUserMedia(mediaConstraints)
	}).then(function(stream) {
		if(showLocal){document.getElementById('localVideo').srcObject = stream;}
		return pc.addStream(stream)
	}).then(function(){
		return pc.createAnswer()
	}).then(function(answer){
		return pc.setLocalDescription(answer)
	}).then(function() {
		sendMessage({
			type: "answer",
			sdp: pc.localDescription
		})
	}).catch(debugHandler("uh oh #2"))
	console.log("> got offer", pc)
	return pc;
}

function handleAnswer(msg, pc) {
	if (!pc) { console.log("can't respond to an answer without a peerconnection`")}
	else {
		pc.setRemoteDescription(msg.sdp)
		console.log("> dealt with answer", pc)
		return pc
	}
}

function handleIceCandidate(pc) {
	return function(event) {
		if (event.candidate) {
			sendMessage({
				type:"candidate",
				candidate: event.candidate
			})
		}
	}
}

function handleAddStream(pc) {
	return function(event) {
		console.log("got stream!!!!&!", event.stream)
		document.getElementById('remoteVideo').srcObject = event.stream;

	}
}

function handleDataChannel(pc) {
	return function(event) {
		var data = event.channel
		console.log("new data channel", data)
		data.onopen = debugHandler("data open")
		data.onmessage = debugHandler("data got")
		data.onclose = debugHandler("data close")
		data.onerror = debugHandler("data error")

		pc.dataChannel = data
	}
}

function notValidDescription(desc) {
	return desc.sdp === "";
}
function makeOffer(pc){
	console.log("making offer")
	if (notValidDescription(pc.remoteDescription) && !pc.sentAlready) {
		console.log("no remote - will send offer")
		pc.sentAlready = true
		pc.createOffer(offerConstraints).then(function(offer){
			return pc.setLocalDescription(offer)
		}).then(function () {
			sendMessage({
				type: 'offer',
				sdp: pc.localDescription
			})
		}).catch(debugHandler("uh oh"))
	}
}
function handleNegotiation(pc){
	return function() {
		console.log("need to negotiate!", pc.remoteDescription)
		if (notValidDescription(pc.remoteDescription) && !pc.sentAlready) {
			console.log("no remote - will send offer")
			pc.sentAlready = true
			pc.createOffer(offerConstraints).then(function(offer){
				return pc.setLocalDescription(offer)
			}).then(function () {
				sendMessage({
					type: 'offer',
					sdp: pc.localDescription
				})
			}).catch(debugHandler("uh oh"))
		}
	}
}
