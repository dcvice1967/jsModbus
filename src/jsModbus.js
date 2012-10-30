
var net 	       = require('net'),
    handler 	       = require('./handler');


var log = function () { };

exports.setLogger = function (logger) {
  log = logger;
  handler.setLogger(logger);
};

var errorHandler = function (e) {

  if (!e) {
    return;
  }

  if (e.code === 'EADDRINUSE') {
    console.log('Address already in use!');
    return;
  }

  if (e.code === 'ECONNREFUSED') {
    console.log('Connection refused!');
    return;
  }

  // otherwise

  console.log(e);

};


exports.createTCPClient = function (port, host) {

  var net 		 = require('net'),
      tcpClientModule    = require('./tcpClient'),
      serialClientModule = require('./serialClient');

  tcpClientModule.setLogger(log);
  serialClientModule.setLogger(log);

  var socket    = net.connect(port, host),
      tcpClient = tcpClientModule.create(socket);

  socket.on('error', errorHandler);

  var client = serialClientModule.create(
	tcpClient,
	handler.Client.ResponseHandler);

  return client;

};


exports.createTCPServer = function (port, host, cb) {

  var net 	         = require('net'),
      tcpServerModule    = require('./tcpServer'),
      serialServerModule = require('./serialServer');

  tcpServerModule.setLogger(log);
  serialServerModule.setLogger(log);

  var socket = net.createServer().listen(port, host);

  socket.on('error', errorHandler);
  socket.on('connection', function (s) {

    var tcpServer = tcpServerModule.create(s);

    var server = serialServerModule.create(
			tcpServer,
			handler.Server.RequestHandler,
			handler.Server.ResponseHandler);

    cb(server);

  });
 
};
