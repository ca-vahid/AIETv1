exports.setup =
{
	title: "Simple security snap",
	description: "Force https and add security headers",
	version: "0.0.1",
}

exports.hook = 
{
    connect: 
    {
        position:0,
        handler: async(req, res) =>
        {
            
            res.setHeader("X-Frame-Options", "SAMEORIGIN");
            res.setHeader("X-XSS-Protection", "1; mode=block");
            if(!req.socket.encrypted)
            {
                UTILS.Redirect(res, "https://" + req.host + req.url);
                req.continue = false;
                res.end();
                return;
            }
            res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
        },
    }
}