
var jsModbus = require('../');

jsModbus.setLogger(function (msg) { util.log(msg); });

var readInputRegHandler = function (start, quant) {
  
  var resp = [];
  for (var i = start; i < start+quant; i += 1) {
    resp.push(i);
  }

  return resp;

};


jsModbus.createServer(502, '127.0.0.1', function (server) {

  server.addHandler(4, readInputRegHandler);

});


