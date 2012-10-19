
var assert = require('assert'),
    Put = require('put');

describe('ModbusServer setup', function () {

  var modbusServer, modbusHandler;

  beforeEach(function (done) {
    var dummy = function () { };

    modbusServer = require('../src/jsModbusServer');
    modbusServer.setLogger(dummy);

    modbusHandler = require('../src/jsModbusHandler');
    modbusHandler.setLogger(dummy);

    done();
  });

  afterEach(function (done) {

    var sName = require.resolve('../src/jsModbusServer'),
        hName = require.resolve('../src/jsModbusHandler');

    delete require.cache[sName];
    delete require.cache[hName];
    
    done();
  });

  it('should initiate well', function (done) {
   
    var counter = 0;
    var ok = function () {
      counter += 1;
      if (counter === 2) done();
    };

    var netMock = {
      createServer: function () { 
	ok();
        return { 
          on: function () { } ,
          listen: function (port, host) { 
	    assert.equal(port, 502); 
	    assert.equal(host, '127.0.0.1');
	    ok();

          }
        }
      }
    };

    var server = modbusServer.create(502, '127.0.0.1', netMock);

    assert.ok(server);

  });

  describe('handle requests', function () {

    var server, onData, write;

    beforeEach(function (done) {
      var onConnect;
      var eMock = { on: function (evnt, cb) {
                          if (evnt === 'connection') { onConnect = cb; }
			  if (evnt === 'data') { onData = cb; }
      		        },
		    listen: function () { },
		    write: function () { },
		    pipe: function () { } };

      var netMock = {
	createServer: function (cb) {
          cb(eMock);
          return eMock;
        }
      }

      server = modbusServer.create(502, '127.0.0.1', netMock);
      done(); 
    });

    it('should call handler for readCoils', function (done) {
    
      var handler = function (startAddress, quantity, response) {

        assert.ok(startAddress);
	assert.ok(quantity);
	assert.equal(13, startAddress);
	assert.equal(1, quantity);

        done();
      };

      server.addHandler(modbusHandler.FC.readCoils, handler);

      var req = Put()
		.word16be(0)   // transaction id   // MBA Header
		.word16be(0)   // protocol version
   		.word16be(7)   // byte count
		.word8(1)      // unit id
  	        .word8(1)      // function code    // PDU
		.word8(4)      // byte count
	        .word16be(13)  // start address
		.word16be(1)   // quantity
		.buffer();

      onData(req);
  
    });


  });

});
