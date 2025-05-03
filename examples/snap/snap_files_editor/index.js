var INDEX = path.join(__dirname, "html", "index.html");

exports.setup =
{
    title: "Files Editor",
    description: "Edit all the files",
    version: "0.0.1",
}

async function fileStat(_path)
{
	return new Promise(async function(resolve)
	{
		fs.stat(_path, function(err, data)
		{
			var _result = {};
			_result.isDir = data.isDirectory();
			_result.isFile = data.isFile();
			
			resolve(_result);
		});
	});
}

function testPath(_path)
{
	if(path.resolve(_path).indexOf(path.resolve(CONF.project)) != 0)
	{
		return false;
	}
	return true;
}

async function PluginHandler(req, res)
{
	try
	{
		if(req.method == "POST")
		{
			if(!req.post.path || !req.post.content)
			{
				res.end();
				return;
			}
			var _dir = path.join(CONF.project, Buffer.from(req.post.path, "base64").toString());
			if(!testPath(_dir))
			{
				res.end();
				return;
			}

			fs.writeFile(_dir, Buffer.from(req.post.content, "base64"), function(err)
			{
				res.end();
			});
		}
		else
		{
			if(req.get.dir)
			{
				var _dir = path.join(CONF.project, Buffer.from(req.get.dir, "base64").toString());
				if(!testPath(_dir))
				{
					res.end(JSON.stringify({}));
					return;
				}
				
				fs.readdir(_dir, async function(err, list)
				{
					var _result = {};
					if(list)
					{
						for(var i = 0; i < list.length; i++)
						{
							_result[list[i]] = await fileStat(path.join(_dir, list[i]));
						}
					}
					if(err)
					{
						res.end(JSON.stringify({}));
					}
					else
					{
						res.end(JSON.stringify(_result));
					}
				});
			}
			else if(req.get.file)
			{
				var _dir = path.join(CONF.project, Buffer.from(req.get.file, "base64").toString());
				if(!testPath(_dir))
				{
					res.end();
					return;
				}

				fs.readFile(_dir, async function(err, content)
				{
					res.end(content);
				});
			}
			else if(req.get.create)
			{
				var _received = Buffer.from(req.get.create, "base64").toString();
				var _dir = path.join(CONF.project, _received);
				if(!testPath(_dir))
				{
					res.end();
					return;
				}
				if(_received[_received.length - 1] == "/")
				{
					fs.mkdir(_dir, { recursive: true }, function()
					{
						res.end();
						return;
					});
				}
				else
				{
					var _time = new Date();
					fs.utimes(_dir, _time, _time, function(err)
					{
						if(err)
						{
							fs.open(_dir, 'w', function(_err, _handle)
							{
								fs.close(_handle, function()
								{
									res.end();
									return
								});
							});
						}
						else
						{
							res.end();
							return
						}
					});
				}
			}
			else if(req.get.delete)
			{
				var _dir = path.join(CONF.project, Buffer.from(req.get.delete, "base64").toString());

				if(!testPath(_dir))
				{
					res.end();
					return;
				}
				var _fstat = await fileStat(_dir);
				if(_fstat.isDir)
				{
					UTILS.fileUtil.rmdir(_dir, function()
					{
						res.end();
					});
				}
				else if(_fstat.isFile)
				{
					fs.unlink(_dir, function()
					{
						res.end();
					});
				}
			}
			else 
			{
				fs.createReadStream(INDEX).pipe(res);
			}
		}
	}
	catch(e)
	{
		try
		{
			res.end();
		}
		catch(e){}
	}
}

exports.plugin =
{
    title: "Files Editor",
    description: "Edit all the files",
    handler: PluginHandler,
    category: "Editors",
}