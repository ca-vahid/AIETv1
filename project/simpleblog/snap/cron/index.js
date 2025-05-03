exports.onLoad = async function()
{
	console.log("onLoad cron");
}

exports.onExit = function()
{
	console.log("onExit cron");
}

exports.handler = async(req, res) => { 
	res.end("Cron Snap handler!");
}

async function taskHandler()
{
	console.log("in cron:", new Date().toISOString());
}
 
exports.onError = async (_ev, _err) => {
	console.log("EV:", _ev);
}

exports.setup = 
{
	on: true,
	rest: false,
}

exports.task =
{
	mode: "cron", // exec, cron, mixed
	cron:
	{
		minute: "*",
		hour: "*",
		day: "*",
		date: "*",
		month: "*"
	},
	handler: taskHandler,
	description: "A simple cron task",
}
