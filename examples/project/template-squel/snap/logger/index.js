var CLIENTS = [];
var TOKEN = UTILS.Crypto.createSHA512(Date.now().toString().substring(0,6));

var INTERVAL;

var ws;
var wss;

exports.pool = 
{
	send: sendLog
}

exports.onLoad = async () =>
{
    ws = require("ws");
    wss =  new ws.WebSocketServer({ noServer: true });
    
    INTERVAL = setInterval(function()
    {
		TOKEN = UTILS.Crypto.createSHA512(Date.now().toString().substring(0,6));
        for(var i = 0; i < CLIENTS.length; i++)
        {
            if(CLIENTS[i] == null ||CLIENTS[i] == undefined)
            {
                CLIENTS.slice(i, 1);
                i--;
            }
        }
    }, 1000 * 60)
}

exports.onUpgrade = function(request, socket, head)
{
	var token = request.url.split("/")[1];
	if(token != TOKEN)
	{
		console.error("BAD TOKEN: " + token);
		socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
		socket.destroy();
		return;
	}
	else
	{
		wss.handleUpgrade(request, socket, head, function done(ws)
		{
			wss.emit('connection', ws, request);
			CLIENTS.push(ws);
		});
	}
}

async function sendLog(_event)
{
	try
	{
		for(var i = 0; i < CLIENTS.length; i++)
		{
			CLIENTS[i].send(JSON.stringify(_event));
		}
	}catch(e){}
}

exports.onExit = async () =>
{
    clearInterval(INTERVAL);
    wss.close();
}

exports.event =
{
    "instance.console.log": async(_event) =>
	{
		this.pool.send(_event);
	}
}

exports.setup = 
{
	title: "Realtime logging",
	description: "See the logs in realtime",
	version: "1.0.0",
	
}

exports.plugin =
{
    title: "Realtime logging",
    description: "See the logs in realtime",
    category: "administration",
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