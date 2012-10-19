

var Put = require('put'),
    net = require('net'),
    util = require('util'),
    modbusHandler = require('./jsModbusHandler');

var log = function (msg) { util.log(msg); };

exports.setLogger = function (logger) {
  log = logger;
};

var ModbusServer = function (port, host, mock) {

  host = !host?'localhost':host;

  if (!(this instanceof ModbusServer)) {
    return new ModbusServer(port, host, mock);
  }

  net = !mock?net:mock;

  var that = this;


  this.server = net.createServer(function (socket) {
    log('Server created.');
    that.socket = socket;
    socket.on('end', that.handleEnd);
    socket.on('data', that.handleData(that));
  });

  this.server.on('connection', function (socket) {
    log('Connection established.');
  });

  this.server.listen(port, host, function () {
    var o = that.server.address();
    log('Listening on ' + o.address + ":" + o.port + ".");
  });

  this.server.on('data', that.handleData(this));

  this.handler = { };

  var api = {
    addHandler: function (fc, handler) {
      that.handler[fc] = handler;
    }
  };

  return api;

};

var proto = ModbusServer.prototype;


proto.handleData = function (that) {

  return function (data) {

    var mbap = {
	transactionId: data.readUInt16BE(0),
	protocolVersion: data.readUInt16BE(2),
	byteCount: data.readUInt16BE(4),
	clientUnit: data.readUInt8(5)
    }

    // erase mbap from the data stream
    data = data.slice(7, data.length);

    // get fc and byteCount in advance
    var fc = data.readUInt8(0);
    var byteCount = data.readUInt8(1);

    // cut pdu out of the data stream
    var pdu = data.slice(0, byteCount + 2);

    // get the pdu handler
    var handler = modbusHandler.RequestHandler[fc];

    if (!handler) {
      // replace that with an appropriate modbus error
      throw "Not implemented"; 
    }
    handler(pdu, that.handler[fc]);

   // that.socket.write("C'est la vie.");
   // that.socket.pipe(that.socket);
  };

};

proto.handleError = function (e) {
  log('Error occured');
  console.log(e);
};

proto.handleEnd = function () { 
};

exports.create = ModbusServer;
