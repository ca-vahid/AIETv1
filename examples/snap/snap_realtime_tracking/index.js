var TOTAL = 0;

var VISITORS = [];
var CLIENTS = [];
var TOKEN = UTILS.Crypto.createSHA512(Date.now().toString().substring(0,6));

var INTERVAL;

var ws;
var wss;

exports.onError = function(err)
{
	console.log(err);
}

exports.pool = 
{
	add: addData,
	remove: removeData,
}

function addScript(_obj)
{
	fs.readFile(path.join(__dirname, "views", "script.html"),
		function(_err, _data)
		{
			var _replace = " ";
			if(!_err)
			{
				_replace = _data;
			}
			if(_obj.event == "instance.forge.main")
			{
				_obj.data = _obj.data.replace(/{{tracking->script}}/g, _data);;
			}
			else
			{
				if(_obj.event == "instance.load.template.page")
				{
					for(var p in _obj.data)
					{
						_obj.data[p].content = _obj.data[p].content.replace(/{{tracking->script}}/g, _data);
					}
				}
				else
				{
					for(var p in _obj.data)
					{
						_obj.data[p] = _obj.data[p].toString().replace(/{{tracking->script}}/g, _data);
					}
				}
			}
		}
	)
}

exports.event = 
{
    "instance.forge.main": addScript,
	"instance.load.theme": addScript,
	"instance.load.page": addScript,
	"instance.load.template.page": addScript,
}

exports.onLoad = async () =>
{
    ws = require("ws");
    wss =  new ws.WebSocketServer({ noServer: true });
    
    INTERVAL = setInterval(() =>
    {
		TOKEN = UTILS.Crypto.createSHA512(Date.now().toString().substring(0,6));
        for(var i = 0; i < CLIENTS.length; i++)
        {
			if (CLIENTS[i].isAlive === false)
			{
				CLIENTS[i].terminate();
				CLIENTS.splice(i, 1);
                i--;
			}
			else
			{
				CLIENTS[i].isAlive = false;
				CLIENTS[i].send(JSON.stringify({type:"ping"}));
				CLIENTS[i].send(JSON.stringify({type: "stats", number: TOTAL}));
			}
        }
		for(var i = 0; i < VISITORS.length; i++)
        {
			if (VISITORS[i].isAlive === false)
			{
				VISITORS[i].terminate();
				VISITORS.splice(i, 1);
                i--;
				this.pool.remove();
			}
			else
			{
				VISITORS[i].isAlive = false;
				VISITORS[i].ping();
				
			}
        }
    }, 15 * 1000)
}

exports.onUpgrade = async(request, socket, head) =>
{
	if(request.url == "/realtime-tracking/visitor/endpoint")
	{
		wss.handleUpgrade(request, socket, head, (ws) =>
		{
			wss.emit('connection', ws, request);
			ws.on("message", function()
			{
				ws.isAlive = true;
			});
			ws.isAlive = true;
			VISITORS.push(ws);
			this.pool.add();
		});
	}
	else if(request.url == "/realtime-tracking/admin/endpoint/" + TOKEN)
	{
		wss.handleUpgrade(request, socket, head, function done(ws)
		{
			wss.emit('connection', ws, request);
			ws.on("message", function()
			{
				ws.isAlive = true;
			});
			ws.send(JSON.stringify({type: "stats", number: TOTAL}));
			CLIENTS.push(ws);
		});
	}
	else
	{
		socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
		socket.destroy();
		return;
	}
}

async function addData()
{
	TOTAL++;
}

async function removeData()
{
	TOTAL--;
}

exports.onExit = async () =>
{
    clearInterval(INTERVAL);
    //wss.close();
}

exports.setup = 
{
	title: "Realtime Tracking",
	description: "See your visitors in realtime",
	version: "1.0.0",
	reloadAll: true,
}

exports.plugin =
{
    title: "Realtime Tracking",
    description: "See your visitors in realtime",
    category: "marketing",
    handler: async (req, res) =>
    {
        res.setHeader("Content-Type", "text/html")
        fs.readFile(path.join(__dirname, "views", "index.html"), function(_err, _data)
		{
			if(_err)
			{
				res.end("Error reading index.html");
			}
			else
			{
				res.end(_data.toString().replace("{{TOKEN}}", TOKEN));
			}
		});
    }
}

exports.static = 
{
    folder: "static",
	index: "index.html",
	documentation: "doc/",
}