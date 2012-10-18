
var Put = require('put');
var util = require('util');

var log = function (msg) { util.log(msg); }

exports.setLogger = function (logger) {
  log = logger;
};

exports.ExceptionMessage = {

  0x01 : 'ILLEGAL FUNCTION',
  0x02 : 'ILLEGAL DATA ADDRESS',
  0x03 : 'ILLEGAL DATA VALE',
  0x04 : 'SLAVE DEVICE FAILURE',
  0x05 : 'ACKNOWLEDGE',
  0x06 : 'SLAVE DEVICE BUSY',
  0x08 : 'MEMORY PARITY ERROR',
  0x0A : 'GATEWAY PATH UNAVAILABLE',
  0x0B : 'GATEWAY TARGET DEVICE FAILED TO RESPOND'

};

exports.ResponseHandler = {
    // ReadCoils
    1:	function (pdu, cb) {

	  log("handing read coils response.");	  

	  var fc = pdu.readUInt8(0),
	      byteCount = pdu.readUInt8(1),
	      bitCount = byteCount * 8;

	  var resp = {
	    fc: fc,
	    byteCount: byteCount,
	    coils: [] 
	  };

          var cntr = 0;
          for (var i = 0; i < byteCount; i+=1) {
            var h = 1, cur = pdu.readUInt8(2 + i);
	    for (var j = 0; j < 8; j+=1) {
	      resp.coils[cntr] = (cur & h) > 0 ;
	      h = h << 1;
              cntr += 1;
	    }	    

  	  }

	  cb(resp);

	},

    // ReadInputRegister
    4:  function (pdu, cb) {
          log("handling read input register response.");

	  var fc = pdu.readUInt8(0),
   	      byteCount = pdu.readUInt8(1);

          var resp = {
            fc: fc,
            byteCount: byteCount,
            register: []
          };

          var registerCount = byteCount / 2;

          for (var i = 0; i < registerCount; i += 1) {
            resp.register.push(pdu.readUInt16BE(2 + (i * 2)));
          }

          cb(resp);
        },
    5:  function (pdu, cb) {
          log("handling write single coil response.");

	  var fc = pdu.readUInt8(0),
	      byteCount = pdu.readUInt8(1),
	      outputAddress = pdu.readUInt16BE(2),
	      outputValue = pdu.readUInt16BE(4);

	  var resp = {
	    fc: fc,
	    byteCount: byteCount,
	    outputAddress: outputAddress,
	    outputValue: outputValue === 0x0000?false:outputValue===0xFF00?true:undefined
 	  };

  	  cb(resp);
    }
        
};


