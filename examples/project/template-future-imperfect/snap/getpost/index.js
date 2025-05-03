var globalPost; /// look for id in the var
var _postColl = "post";

exports.handler = async (req, res) => {
  var valueReceived = req.post.valueToSend;
  console.log(`valueReceived: ${valueReceived}`);

  // //GET TITLE
  // console.log(globalPost[0].title);

  // //GET DESCRIPTION
  // console.log(globalPost[0].description);

  // //GET CONTENT
  // console.log(globalPost[0].content);

  // //GET IMAGE
  // console.log(globalPost[0].image);


  // RESPONSE TO CLIENT
  UTILS.httpUtil.dataSuccess(
    req,
    res,
    "Value received",
    {
      valueReceivedResponse: valueReceived,
      postResponse: globalPost,
    },
    "1.0"
  );
};

// RETREVIE POSTS IN DB

function handleEvent(_obj) {
  console.log("Event: " + _obj.event);
  if (_obj.event == "view") {
    console.log(_obj.data.length);
  }
  for (var i = 0; i < _obj.data.length; i++) {
    console.log(_obj.data[i].id);
  }

  //console.log(_obj);

  globalPost = _obj.data;

  // console.log(globalPost);
}

exports.event = {
  "instance.load.sorted.post": {
    on: true,
    position: 0,
    handler: handleEvent,
  },
};

exports.setup = {
  on: true,
  title: "Post plugin",
  description: "Show post in db",
  version: "1.0.0",
  intentos: 10,
  reloadAll: true,
  //route: "/snap/test/*",
  //method: "ANY", // ANY, GET, POST, PUT, DELETE ...
};
