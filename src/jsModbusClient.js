

var net = require('net');
var util = require('util');
var Put = require('put');

var Handler = require('./jsModbusHandler');

var log = function (msg) { util.log(msg); };

exports.setLogger = function (logger) {
  log = logger;
};

var dummy = function () { },
    modbusProtocolVersion = 0,
    modbusUnitIdentifier = 1;

var ModbusClient = function (socket, resHandler) {

  if (!(this instanceof ModbusClient)) {
    return new ModbusClient(socket, resHandler);
  }

  var that = this;
  this.resHandler = resHandler;

  this.isConnected = false;
  this.socket = socket;

  this.socket.on('connect', function () {
    // release pipe content if there are any yet
    log('Connection established.');
    that.isConnected = true;
    that.flush();
  });

  // setup data receiver
  this.socket.on('data', this.handleData(this));

  // package and callback queues
  this.pkgPipe = [];
  this.cbPipe = { };

  this.identifier = 0;

  /**
   *  Public functions, in general all implementations from 
   *  the function codes
   */
  var api = {

    readCoils: function (start, quantity, cb) {
      var fc  = 1,
	  pdu = that.pduWithTwoParameter(fc, start, quantity);

      that.makeRequest(fc, pdu, !cb?dummy:cb);
    },

    readInputRegister: function (start, quantity, cb) {

      var fc      = 4, 
          pdu     = that.pduWithTwoParameter(fc, start, quantity);

      that.makeRequest(fc, pdu, !cb?dummy:cb);

    },

    writeSingleCoil: function (address, value, cb) {

      var fc = 5,
	  pdu = that.pduWithTwoParameter(fc, address, value?0xff00:0x0000);

      that.makeRequest(fc, pdu, !cb?dummy:cb);

    },

    writeSingleRegister: function (address, value, cb) {
      var fc = 6,
          pdu = that.pduWithTwoParameter(fc, address, value);

      that.makeRequest(fc, pdu, !cb?dummy:cb);
    },

    flush: function () {
      that.flush();
    },

    close: function () {
      that.socket.end();
    }
  };

  return api;

};

var proto = ModbusClient.prototype;

/**
 * Pack up the pdu and the handler function
 * and pipes both. Calls flush in the end.
 */
proto.makeRequest = function (fc, pdu, cb) {

  var pkgObj = this.buildPackage(pdu),
      cbObj = { id: pkgObj.id, fc: fc, cb: cb };

  this.pkgPipe.push(pkgObj);
  this.cbPipe[pkgObj.id] = cbObj;

  this.flush();

}

/**
 *  Iterates through the package pipe and 
 *  sends the requests
 */
proto.flush = function () {

  if (!this.isConnected) {
    return;
  }

  while (this.pkgPipe.length > 0) {
    var pkgObj = this.pkgPipe.shift();
    var mbap = pkgObj.pkg;

    log('sending data');
    this.socket.write(mbap);
  }
}

/**
 *  Builds an MBAP Package with respect to the
 *  pdu. Very straightforward.
 */
proto.buildPackage = function (pdu) {
  
  var newId = this.identifier++ % 0xFFFF;

  var pkgObj = {
	id : newId,
	pkg : Put()
    	.word16be(newId)
    	.word16be(this.modbusProtocolVersion)
    	.word16be(pdu.length + 1)
    	.word8(modbusUnitIdentifier)
    	.put(pdu)
    	.buffer()
  };

  return pkgObj;

}

/**
 *  Returns the main response handler
 */
proto.handleData = function (that) {

  /**
   *  This is the main response handler. It simply
   *  reads the mbap first and dispatches the 
   *  pdu to the next callback in the pipe (I am not sure
   *  if the requests are handled in sequence but this is 
   *  definitivly a place where errors can occure due to wrong
   *  assigned callbacks, keep that in mind.)
   */
  return function (data) {

    log('received data');

    var buf = new Buffer(data);
    var cnt = 0;

    while (cnt < buf.length) {

      // 1. extract mbap

      var header = data.slice(cnt, cnt + 7);
      cnt += header.length;

      var mbap = { 
        transId  : header.readUInt16BE(0),
        protoId  : header.readUInt16BE(2),
        length   : header.readUInt16BE(4),
        unitId   : header.readUInt8(6) };

      log("MBAP extracted");

      // 2. extract pdu

      var pdu = buf.slice(cnt, cnt + mbap.length - 1);
      cnt += pdu.length;
      log("PDU extracted");

      // 3. dequeue callback and make the call with the pdu

      var cbObj = that.cbPipe[mbap.transId];

      that.cbPipe[mbap.transId] = null;
      log("Fetched Callback Object from pipe with id " + cbObj.id);

      // 4. check pdu for errors

      log("Checking pdu for errors");
      if (that.handleErrorPDU(pdu, cbObj.cb)) {
        continue;
      }      

      // 5. handle pdu

      log("Calling Callback with pdu.");
      var handler = that.resHandler[cbObj.fc];
      if (!handler) { 
	throw "No handler implemented.";
      }
      handler(pdu, cbObj.cb);
    }
  }

}

/**
 *  Check if the given pdu contains fc > 0x84 (error code)
 *  and return false if not, otherwise handle the error,
 *  call cb(null, err) and return true
 */
proto.handleErrorPDU = function (pdu, cb) {
  
  var errorCode = pdu.readUInt8(0);

  // if error code is smaller than 0x80
  // the pdu describes no error
  if (errorCode < 0x80) {
    return false;
  }

  log("PDU describes an error.");
  var exceptionCode = pdu.readUInt8(1);
  var message = Handler.ExceptionMessage[exceptionCode];

  var err = { 
	errorCode: errorCode, 
	exceptionCode: exceptionCode, 
	message: message
  };
  
  // call the desired callback with
  // err parameter set
  cb(null, err);

  return true; 
};

/**
 *  Many requests look like this so I made
 *  this an extra function.
 */
proto.pduWithTwoParameter = function (fc, start, quantity) {
  return Put()
	.word8(fc)
	.word16be(start)
	.word16be(quantity)
	.buffer();
}

exports.create = ModbusClient;


