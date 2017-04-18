pdo = function(module, ...)
	local ok, result
	if file.list()[module..'.lua'] then
		ok, result = pcall(dofile, module..'.lua')
	elseif file.list()[module..'.lc'] then
		ok, result = pcall(dofile, module..'.lc')
	end
	return (ok and result)
end

local connect, config = pdo('autoconnect'), pdo('wificonfigs')
if connect and config then connect(config, nil, 2) end

local modes = {
	"http",
	"put",
	"telnet"
}

-- do this safely..
pcall(function()
	pdo('tinyserver')()
	for _,mode in ipairs(modes) do
		local ok, modeTable = pcall(require, mode)
		if ok then table.insert(serverconf.modes, modeTable) end
	end
end)
pdo('heartbeat')
--local Servo = pdo('servo')
--if Servo then 
	--s1=Servo(5)
	--if s1 then s1:init() end
--end
