

var Put = require('put'),
    util = require('util');

var log = function (msg) { util.log(msg); };

exports.setLogger = function (logger) {
  log = logger;
};

var ModbusServer = function (
	socket, 
	reqHandler, 
	resHandler) {

  if (!(this instanceof ModbusServer)) {
    return new ModbusServer(
		socket, 
		reqHandler, 
		resHandler);
  }

  var that = this;

  this.reqHandler = reqHandler;
  this.resHandler = resHandler;

  // request handler
  this.handler = { };

  // initiate server
  that.socket = socket;
  socket.on('end', that.handleEnd(that));
  socket.on('data', that.handleData(that));

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

    var mbap = data.slice(0, 7);
    var pduLength = mbap.readUInt16BE(4) - 1;
    var pdu = data.slice(7, 7 + pduLength);

    // erase mbap from the data stream
    // data = data.slice(7, data.length);

    // get fc and byteCount in advance
    var fc = pdu.readUInt8(0);
    var byteCount = pdu.readUInt8(1);

    // get the pdu handler
    var reqHandler = that.reqHandler[fc];
    var callback = that.handler[fc];
    var resHandler = that.resHandler[fc];
  
    if (!reqHandler || !callback || !resHandler) {
      // replace that with an appropriate modbus error
      throw "Not implemented"; 
    }
   
    var params = reqHandler(pdu);
    var resObj = callback.apply(null, params);
    var resPdu = resHandler(resObj);

    // add mbdaHeader to resPdu and send it
    // with write

    var pkt = Put()
	.word16be(mbap.readUInt16BE(0))
	.word16be(mbap.readUInt16BE(2))
	.word16be(resPdu.length + 1)
	.word8(mbap.readUInt8(6))
	.put(resPdu)
	.buffer();

    that.socket.write(pkt);
    that.socket.pipe(that.socket);
   // that.socket.write("C'est la vie.");
   // that.socket.pipe(that.socket);
  };

};

proto.listen = function (that) {

  return function () {
    var o = that.server.address();
    log('Listening on ' + o.address + ":" + o.port + ".");
  };

};

proto.handleConnection = function (that) {

  return function () {
    log("Connection established.");
  }

};

proto.handleError = function (e) {
  log('Error occured');
  console.log(e);
};

proto.handleEnd = function (that) {
  return function () {}; 
};

exports.create = ModbusServer;
