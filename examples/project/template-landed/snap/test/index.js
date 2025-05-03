// Test snap

exports.onLoad = async() => { 
	// do something
}

exports.onExit = async() => { 
	// do something
}

exports.onError = async(_ev, _err) => { 
	// do something
	console.log(_ev);
}

exports.handler = async(req, res) => {
	res.setHeader("Content-Type", "text/txt");
	STORE.test.fn();
	res.end('Hello Snap v' + this.setup.version + '! My test key: ' + OPTIONS["test-key"] + " - " + STORE.test.variable);
	// Use next(req, res); to jump to the next hop, if any
  }

 function hookHandler(req, res, obj)
 {
	 console.log("Hello: " + req.hook );
	 console.log(req.url);
 }
 
 function errorHandler(req, res, err)
 {
	 console.log("Error catched:", err.message);
	 //next(req, res);
 }
 
 exports.store = 
 {
	 fn: function(){console.log("In Stored function")},
	 variable: "My stored var",
 }
 
exports.hook = {
	connect: 
	{
		on: false,
		position: 0,
		handler: hookHandler,
	},
	data: 
	{
		on: false,
		position: 0,
		handler: hookHandler,
	},
	get:
	{
		on: false,
		position: 0,
		handler: hookHandler,
	},
	cookie:
	{
		on: false,
		position: 0,
		handler: hookHandler,
	},
	url:
	{
		on: false,
		position: 0,
		handler: hookHandler,
	},
	"404":
	{
		on: false,
		position: 0,
		handler: hookHandler,
	},
	error:
	{
		on: true,
		position: 0,
		handler: errorHandler,
	},
	end: 
	{
		on: false,
		position:0,
		handler: hookHandler,
	}
}

function handleEvent(_obj)
{
	console.log("Event: " + _obj.event );
	if(_obj.event == "view")
	{
		console.log(_obj.data.length);
	}
	for(var i = 0; i < _obj.data.length; i++)
	{
		console.log(_obj.data[i].id);
	}
}

exports.event = {
	/*
	"instance.load.db.post":
	{
		on: true,
		position: 0,
		handler: handleEvent,
	},
	"instance.load.db.social": handleEvent,
	"instance.load.db.user": handleEvent,
	"instance.load.db.code": handleEvent,
	"instance.load.template.view": handleEvent,
	"instance.load.template.page": handleEvent,
	"instance.load.template.menu": handleEvent,
	"instance.load.template.sitemap": handleEvent,
	"instance.load.template.uri": handleEvent,
	"instance.load.template.option": handleEvent,
	"instance.load.sorted.post": handleEvent,
	*/
}

exports.setup = 
{
	on: true,
	title: "Test plugin",
	description: "A description",
	version: "1.0.0",
	intentos: 10,
	//reloadAll: true,
	//route: "/snap/test/*",
	//method: "ANY", // ANY, GET, POST, PUT, DELETE ...
}

exports.plugin =
{
    title: "Test plugin",
    description: "A description of the plugin",
    category: "administration",
    handler: (req, res)=> { res.end("OK")},
}

exports.static = 
{
    folder: "static",
	index: "index.html",
	documentation: "doc/",
}

exports.router = 
[
	{
		on: true,
		route: "/route/one",
		method: "ANY",
		handler: function(req, res){res.end("Hello One")}
	},
	{
		on: true,
		route: "/route/two",
		method: "ANY",
		handler: function(req, res){res.end("Hello Two")}
	}
];