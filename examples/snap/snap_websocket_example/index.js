var ws = require("ws");
var wss =  new ws.WebSocketServer({ noServer: true });

exports.onUpgrade = function(request, socket, head)
{
	wss.handleUpgrade(request, socket, head, function done(ws)
	{
		wss.emit('connection', ws, request);

		ws.on('message', function incoming(message)
		{
			console.log("[+] Message received: " + message);
			wss.clients.forEach(function(client)
			{       
				if (client !== ws)
				{
					client.send(message);
				}
			});
		});
	});
}
