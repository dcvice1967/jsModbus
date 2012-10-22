
var net = require('net'),
    modbusHandler = require('./jsModbusHandler'),
    serverModule = require('./jsModbusServer'),
    clientModule = require('./jsModbusClient');

exports.setLogger = function (logger) {
  modbusHandler.setLogger(logger);
  clientModule.setLogger(logger);  
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


exports.createClient = function (port, host) {

  var socket = net.connect(port, host);

  socket.on('error', errorHandler);

  var client = clientModule.create(
			socket,
			modbusHandler.Client.ResponseHandler);

  return client;

};


exports.createServer = function (port, host, cb) {

  var socket = net.createServer().listen(port, host);

  socket.on('error', errorHandler);
  socket.on('connection', function (s) {

    var server = serverModule.create(
			s,
			modbusHandler.Server.RequestHandler,
			modbusHandler.Server.ResponseHandler);

    cb(server);

  });
 
};
