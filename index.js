'use strict';

var os = require('os');
var nodeStatic = require('node-static');
var fs = require('fs')
var http = require('http');
var https = require('https');
var socketIO = require('socket.io');
var request = require('request')
var serial = require('serialport')
var pispi = require('pi-spi')
var spi = pispi.initialize('/dev/spidev0.0')

var fileServer = new(nodeStatic.Server)();
var options = {
	key: fs.readFileSync('ssl/mockserver.key'),
	cert: fs.readFileSync('ssl/mockserver.cert')
}
var app = https.createServer(options, function(req, res) {
	fileServer.serve(req, res);
}).listen(8000);

// debug handler generator function
function debugHandler(msg) {
	return function(err) {
		console.log(msg, err)
	}
}
function clearMSB(a) {
	return a & 0x7F
}
// open the serial port
var port = new serial("/dev/ttyACM0", {baudRate: 9600, parser: serial.parsers.raw})
var servo = {
	cmd : {
		baud: 0xAA,
		set: 0x84,
		setmultitarget: 0x9F
	},
	device: 12,
	set: function(idx, target) {
		var lower = target & 0x7F
		var upper = (target >> 7) & 0x7F
		//return [ servo.cmd.baud, servo.cmd.set, idx, lower, upper ]
		//return [ servo.cmd.baud, servo.device, clearMSB(servo.cmd.set), idx, lower, upper ]
		return [ servo.cmd.set, idx, lower, upper ]
	},
	setMulti: function(servos) {
		var bytes = [ servo.cmd.baud, servo.device, clearMSB(servo.cmd.setmultitarget), servos.length, servos[0].idx ]
		servos.forEach( function(s) { 
			bytes.push( s.pos & 0x7F )
			bytes.push( (s.pos >> 7) & 0x7F )
		})
		console.log(bytes)
		return bytes
	},
	stringify: function(bytes) {
		var str = ""
		for (var i=0; i<bytes.length; i++){
			str = str + String.fromCharCode(bytes[i])
		}
		return str
	}
}
port.on("open", function(){
	console.log("Serial port open")
})
port.on("error", debugHandler("serial port error:"))
port.on("data", debugHandler("serial data:"))

// LED Code
//
function color(r,g,b) {
	return {r:r, g:g, b:b}
}

function leds(colors) {
	if (colors.r != undefined) {
		var c = colors
		colors = []
		for (var i=0; i<10; i++) {
			colors.push(c)
		}
	}

	var buffer = []
	//START FRAME
	buffer.push(0)
	buffer.push(0)
	buffer.push(0)
	buffer.push(0)
	//LED FRAMES
	colors.forEach(function(color) {
		buffer.push(0xFF) //111_____   global color (just make it 100%...)
		buffer.push(color.b)
		buffer.push(color.g)
		buffer.push(color.r)
	})
	//END FRAME
	buffer.push(0xFF)
	buffer.push(0xFF)

	buffer.push(0xFF)
	buffer.push(0xFF)

	spi.write( new Buffer(buffer), function(err){})
}


//var espAddr = "192.168.1.103"
var espAddr = "192.168.1.61"

var io = socketIO.listen(app);
io.sockets.on('connection', function(socket) {

	// convenience function to log server messages on the client
	function log() {
		var array = ['Message from server:'];
		array.push.apply(array, arguments);
		socket.emit('log', array);
	}

	socket.on('message', function(message) {
		//log('Client said: ', message);
		// for a real app, would be room-only (not broadcast)
		socket.broadcast.emit('message', message);
	});

	socket.on('create or join', function(room) {
		log('Received request to create or join room ' + room);

		var numClients = io.sockets.sockets.length;
		log('Room ' + room + ' now has ' + numClients + ' client(s)');

		if (numClients === 1) {
			socket.join(room);
			log('Client ID ' + socket.id + ' created room ' + room);
			socket.emit('created', room, socket.id);

		} else if (numClients === 2) {
			log('Client ID ' + socket.id + ' joined room ' + room);
			io.sockets.in(room).emit('join', room);
			socket.join(room);
			socket.emit('joined', room, socket.id);
			io.sockets.in(room).emit('ready');
		} else { // max two clients
			socket.emit('full', room);
		}
	});

	socket.on('ipaddr', function() {
		var ifaces = os.networkInterfaces();
		for (var dev in ifaces) {
			ifaces[dev].forEach(function(details) {
				if (details.family === 'IPv4' && details.address !== '127.0.0.1') {
					socket.emit('ipaddr', details.address);
				}
			});
		}
	});

	socket.on('espaddr', function(msg) {
		espAddr = msg
	})

	socket.on('espcall', function(msg) {
		console.log("call a thing", msg)
		var filename = msg.filename
		msg.filename = null
		request({
			uri: "http://" + espAddr + "/" + filename,
			method: "GET",
			qs: msg
		}, function(err, resp, body) {
			console.log("GotResponse", err, body)
		})
	})
	socket.on('espset', function(msg) {
		console.log("do a thing", msg, msg.test)
		request({
			uri: "http://" + espAddr + "/set.lua",
			method: "GET",
			qs: msg
		}, function(err, resp, body) {
			console.log("GotResponse", err, body)
		})
	})


	var LOStimeout = 1000
	var heartbeatTimer = setTimeout(function(){}, 1000) //lulz
	var offline = true
	function heartbeat() {
		if (heartbeatTimer != undefined) { clearTimeout(heartbeatTimer) }
		offline = false
		leds(color(50,50,100))
		heartbeatTimer = setTimeout(function() {
			// do LOS..
			console.log("heartbeat timeout!!")
			leds( color(255,0,0) )
			console.log("boop")
			offline = true
		}, LOStimeout)
	}

	socket.on('servo', function(msg) {
		//console.log("servo", msg)
		heartbeat()
		msg.servos.forEach( function(s) {
			port.write( servo.set( s.idx, s.pos ) ) 
		})
	})

	socket.on("led", function(msg) {
		heartbeat()
		led(msg.leds)
	})

	socket.on('bye', function(){
		console.log('received bye');
	});

});



leds([color(100,150,255), color(255,150,50), color(255,0,0)])




