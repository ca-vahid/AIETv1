
var _videoHandler = async (req, res) =>
{
    var _video = path.resolve(path.join(CONF.instance.library, req.param.name));
    var _ext = path.extname(req.param.name).substring(1);
    
    fs.stat(_video, function(err, data)
    {
        if(err == null)
        {
            try
            {
                  var total = data.size;
                  if (req.headers['range']) 
                  {
                    var range = req.headers.range;
                    var parts = range.replace(/bytes=/, "").split("-");
                    var partialstart = parts[0];
                    var partialend = parts[1];

                    var start = parseInt(partialstart, 10);
                    var end = partialend ? parseInt(partialend, 10) : total-1;
                    var chunksize = (end-start)+1;
                      
                    var send = fs.createReadStream(_video, {start: start, end: end});
                    res.writeHead(206, 
                    { 
                     'Content-Range': 'bytes ' + start + '-' + end + '/' + total, 
                     'Accept-Ranges': 'bytes', 'Content-Length': chunksize, 
                     'Content-Type': UTILS.mimeUtil.lookup(req.param.name, "video/" + _ext),
                    });
                    send.pipe(res);
                  } 
                  else 
                  {
                    res.writeHead(200, 
                    { 
                        'Content-Length': data.size, 
                        'Content-Type': UTILS.mimeUtil.lookup(req.param.name, "video/" + _ext),
                    });
                    fs.createReadStream(_video).pipe(res);
                  }
            }
            catch(e)
            {
                res.end(e.message);
            }
        }
        else
        {
            res.end();
        }
    })
}


exports.setup = 
{
    title: "Video Streaming",
    description: "Stream videos from your library",
    version: "1.0.0",
}

exports.router =
[
    {
        route: "/video/:name",
        handler: _videoHandler,
        method: "GET",
        
    }
]

exports.static = 
{
    folder: "static",
	index: "index.html",
	documentation: "doc/",
}