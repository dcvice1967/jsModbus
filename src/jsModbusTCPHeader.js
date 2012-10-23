
var Util	 = require('util'),
    Put 	 = require('put'),
    EventEmitter = require('events').EventEmitter;

var log = function (msg) { Util.log(msg); }

exports.setLogger = function (logger) {
  log = logger;
};

var PROTOCOL_VERSION = 0,
    UNIT_ID = 1;

var ModbusTCPClient = function (socket) {

  if (!(this instanceof ModbusTCPClient)) {
    return new ModbusTCPClient(socket);
  }

  EventEmitter.call(this);

  this._socket = socket;
  this._socket.on('data', this._handleData(this));
  this._socket.on('connect', this._handleConnection(this));

  this.mbapFifo = [];
  this.reqFifo = [];
  this.reqId = 0; 

  this.write = function (pdu) {

    var mbap = this.mbapFifo.shift();

    var pkt = Put()
	.word16be(this.reqId++)
	.word16be(PROTOCOL_VERSION)
	.word16be(pdu.length + 1)
	.word8(UNIT_ID)
	.put(pdu)
	.buffer();

    this.reqFifo.push(pkt);
    this._flush();
  };

  this.flush = function () {
    this._flush();
  };

  this.end = function () {
    this._socket.end();
  };

};

Util.inherits(ModbusTCPClient, EventEmitter);

var proto = ModbusTCPClient.prototype;

proto._handleConnection = function (that) {
  
  return function () {
    that.isConnected = true;
    that.emit('connect');
    that._flush();
  }
};

proto._flush = function () {
  if (!this.isConnected) {
    return;
  }

  while (this.reqFifo.length > 0) {
    var pkt = this.reqFifo.shift();
    this._socket.write(pkt);
  }
}

proto._handleData = function (that) {

  return function (data) {
   
    log('received data');

    var cnt = 0;

    while (cnt < data.length) {
 
      // 1. extract mbap

      var mbap = data.slice(cnt, cnt + 7),
          len = mbap.readUInt16BE(4);

      that.mbapFifo.push(mbap);

      cnt += 7;

      log('MBAP extracted');

      // 2. extract pdu

      var pdu =data.slice(cnt, cnt + len - 1);
    
      cnt += pdu.length;

      log('PDU extracted');

      // emit data event and let the 
      // listener handle the pdu

      that.emit('data', pdu); 
  
    }

  };

};

exports.create = ModbusTCPClient;
