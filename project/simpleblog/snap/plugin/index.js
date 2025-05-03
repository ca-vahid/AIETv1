exports.plugin = 
{
	title: "My plugin",
	description: "My awesome plugin on Adrien's SDK",
	handler: async(req, res) =>
	{
		fs.createReadStream(path.join(__dirname, "views", "index.html")).pipe(res);
	}
}

exports.setup =
{
	description: "A simple plugin",
}