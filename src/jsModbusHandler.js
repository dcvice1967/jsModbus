
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

exports.FC = {
  readCoils: 1,
  readInputRegister: 4
}

exports.Server = { };

// for the server, response handler
exports.Server.ResponseHandler = {
  1:  function (register) {

	var len = register.len % 8 > 0 ? Math.floor(register.length / 8) + 1 : Math.floor(register.length / 8);

	var res = Put().word8(1).word8(len);

        // TODO: complete this

        return Put().word8(1).word8(1).word8(1).buffer();
      },
  4:  function (register) {

        var res = Put().word8(4).word8(register.length * 2);

	for (var i = 0; i < register.length; i += 1) {
	  res.word16be(register[i]);
	}

	return res.buffer();
  }

};

// for the server
exports.Server.RequestHandler = {

  // ReadCoils
  1:  function (pdu) {
	var startAddress = pdu.readUInt16BE(2),
	    quantity = pdu.readUInt16BE(4),
            param = [ startAddress, quantity ];
	return param;	
      },

  // ReadInputRegister
  4:  function (pdu) {
        var startAddress = pdu.readUInt16BE(2),
	    quantity = pdu.readUInt16BE(4),
	    param = [ startAddress, quantity ];
        return param;
      }
  }


exports.Client = { };

// for the client
exports.Client.ResponseHandler = {
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
    },
    6:    function (pdu, cb) {
            log("handling write single register response.");

            var fc = pdu.readUInt8(0),
                byteCount = pdu.readUInt8(1),
		registerAddress = pdu.readUInt16BE(2),
		registerValue = pdu.readUInt16BE(4);

 	    var resp = {
	      fc: fc,
	      byteCount: byteCount,
	      registerAddress: registerAddress,
              registerValue: registerValue
	    };

 	    cb(resp);
    }
        
};


