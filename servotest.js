var serial = require('serialport')
var device = 12
// ACM0 is the 'command' port, where ACM1 is the 'TTL' port (aka, the higher # port)
var port = new serial('/dev/ttyACM0', {baudRate: 9600, parser: serial.parsers.raw})


function clearMSB(a) {
	return (a & 0x7F)
}

function debugHandler(msg) {
	return function(err) {
		console.log(msg, err)
	}
}

var servo = {
	cmd : {
		baud: 0xAA,
		set: 0x84
	},
	set: function(idx, target) {
		var lower = target & 0x7F
		var upper = (target >> 7) & 0x7F
		return [ servo.cmd.baud, servo.cmd.set, idx, lower, upper ]
		//return [ servo.cmd.baud, device, clearMSB(servo.cmd.set), idx, lower, upper ]
	}
}

function stringify(bytes){
	var str = ""
	for (i=0; i<bytes.length; i++){
		str = str + String.fromCharCode(bytes[i])
	}
	return str
}

serial.list(function(err, ports) {
	ports.forEach(function(port) {
		console.log("Port:", port.comName, port.pnpId)
	})
})
console.log(stringify([33,32,33,35]))
port.on("open", function() {
	var cmd = stringify(servo.set(0, 5000))
	console.log("bytes", servo.set(0, 1500*4), cmd)
	port.write(stringify(servo.set(0, 1500*4)), debugHandler("write:"))
	// port.write(stringify([170, 12, 4, 0, 112, 46])) // example byte sequence in manual
	setInterval(doThing, 1000)
})
port.on("error", function(err) { console.log("serial error", err)})
port.on("data", function(data) { console.log("read:", data) } )


function doThing() {
	var cmd = stringify(servo.set(0, 5000))
	console.log("bytes", servo.set(0, 1500*4), cmd)
	port.write(stringify(servo.set(0, 1500*4)), debugHandler("write:"))
}
