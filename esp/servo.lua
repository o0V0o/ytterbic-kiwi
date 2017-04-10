local io = require'gpios'

--local on, off
--ontime, offtime = 1000, 10
--period = 20
--pin = 5

local servos = {}

function blip(period)
	tmr.alarm(5, period, tmr.ALARM_AUTO, function()
		for _,servo in pairs(servos) do
			io[servo.pin] = 1
		end
		local elapsed = 0
		for _,servo in ipairs(servos) do
			tmr.delay(servo.timeout-elapsed)
			elapsed = servo.timeout
			io[servo.pin] = 0
		end
	end)
end

local Servo = {}
function Servo.new(pin)
	local servo = {pin=pin, timeout=1000}
	table.insert(servos, servo)
	Servo.set(servo, 1000)
	return servo
end
function Servo.set(servo, timeout)
	servo.timeout = timeout
	table.sort(servos, function( s1, s2) return s1.timeout < s2.timeout end)
end
function Servo.init(period)
	period = period or 20
	blip(period)
end
