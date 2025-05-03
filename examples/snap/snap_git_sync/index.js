var git = require("isomorphic-git");
const gitHttp = require('isomorphic-git/http/node')


const TARGET = ["snap", "project"];
const VIEW = path.join(__dirname, "html", "view.html");

function sendPage(res)
{
	res.setHeader("content-type", "text/html;charset=UTF-8");
	fs.createReadStream(VIEW).pipe(res);
}

async function gitHandler(req, res)
{
	if(req.method == "GET")
	{
		if(req.get.target && TARGET.indexOf(req.get.target) > -1)
		{
			var _dir;
			if(req.get.target == "snap")
			{
				_dir = path.join(CONF.instance.snap);
			}
			else
			{
				_dir = path.join(CONF.project);
			}
			
			fs.readdir(_dir, function (err, files)
			{
				files = files.filter(item => !(/(^|\/)\.[^\/\.]/g).test(files));
				
				files = files.filter(function(item)
				{
					return fs.existsSync( path.join(_dir, item, ".git") );
				});
				
				res.end(JSON.stringify({code: 0, error: false, data: files}));
			});
		}
		else
		{
			sendPage(res);
		}
		return;
	}
	else if(req.method == "POST")
	{
		switch(req.post.mode)
		{
			case "clone":
				if(req.post.url && req.post.type && req.post.name)
				{
					var _type = req.post.type;
					var _target;
					if(_type == "snap")
					{
						_target = path.join(CONF.instance.snap, req.post.name);
					}
					else if(_type == "project")
					{
						_target = path.join(CONF.project, req.post.name);
					}
					else
					{
						UTILS.Redirect(res, "?error=" + encodeURI("Unknown type"));
						return;
					}

					try
					{
						var _obj = { fs: fs, http: gitHttp, dir: _target, url: req.post.url };
						
						await git.clone(_obj);
						UTILS.Redirect(res, "?success=" + encodeURI("Cloning done"));
					}
					catch(e)
					{
						UTILS.Redirect(res, "?error=" + encodeURI(e.message));
					}
				}
				else
				{
					UTILS.Redirect(res, "?error=" + encodeURI("Input missing"));
				}
			break;
			
			case "pull":
				if(req.post.type && req.post.name)
				{
					var _type = req.post.type;
					var _target;
					if(_type == "snap")
					{
						_target = path.join(CONF.instance.snap, req.post.name);
					}
					else if(_type == "project")
					{
						_target = path.join(CONF.project, req.post.name);
					}
					else
					{
						UTILS.Redirect(res, "?error=" + encodeURI("Unknown type"));
						return;
					}

					try
					{
						await git.fastForward({ fs: fs, http: gitHttp, dir: _target})
						UTILS.Redirect(res, "?success=" + encodeURI(`Pulling ${req.post.name} done`));
					}
					catch(e)
					{
						UTILS.Redirect(res, "?error=" + encodeURI(e.message));
					}
				}
			break;
			
			default:
				UTILS.Redirect(res, "?error=" + encodeURI("Unknown mode"));
			break;
		}
	}
	else
	{
		UTILS.Redirect(res, "?error=" + encodeURI("Bad method"));
	}
}

exports.plugin = 
{
	title: "Git Sync",
	description: "Sync your projects and snaps with git",
	handler: gitHandler,
	category: "administration",
}

exports.setup =
{
    title: "Git Sync",
	description: "Sync your projects and snaps with git",
	version: "0.0.1",
}