
var assert = require('assert'),
    util = require('util'),
    Put = require('put'),
    sinon = require('sinon'),
    eventEmitter = require('events').EventEmitter,
    modbusHandler = require('../src/jsModbusHandler');

describe('ModbusServer setup', function () {

  var modbusServer, serverApiDummy, socketApiDummy;
   
  beforeEach(function (done) {

    socketApiDummy = {
      on     : function () { },
      write  : function () { },
      pipe   : function () { }
    };

    var dummy = function () { };

    modbusServer = require('../src/jsModbusServer');
    modbusServer.setLogger(dummy);

    done();
  });

  afterEach(function (done) {

    var sName = require.resolve('../src/jsModbusServer');

    delete require.cache[sName];
    
    done();
  });

  it('should initiate well', function () {

    var	socketMock = sinon.mock(socketApiDummy);

    socketMock.expects('on').once()
	.withArgs(sinon.match('data'), sinon.match.func);

    socketMock.expects('on').once()
	.withArgs(sinon.match('end'), sinon.match.func);

    var server = modbusServer.create(socketApiDummy);

    socketMock.verify();

  });

  describe('handle requests', function () {

    var server;

    var SocketApi = function () {
      eventEmitter.call(this);

      this.write = function () { };
      this.pipe = function () { };
    };

   util.inherits(SocketApi, eventEmitter);

   var socket;

    beforeEach(function (done) {

      socket = new SocketApi();

      server = modbusServer.create(
	socket,
	modbusHandler.Server.RequestHandler,
	modbusHandler.Server.ResponseHandler);

      done();
 
    });

    it('should call handler for readCoils', function () {

      var ret = [ true ],
	  handler = sinon.stub().returns(ret);

      server.addHandler(1, handler);

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

      var res = Put()
		.word16be(0)
		.word16be(0)
		.word16be(4)
		.word8(1)
		.word8(1)
		.word8(1)
		.word8(1)
		.buffer();

      var spy = sinon.spy(socket, "write");

      socket.emit('data', req);

      assert.deepEqual(res, spy.getCall(0).args[0]);

    });

    it('should respond properly', function () {
      
      var ret = [13],
          stub = sinon.stub().returns(ret);

      server.addHandler(4, stub);

      var req = Put()
		.word16be(0)   // transaction id   // MBA Header
		.word16be(0)   // protocol version
   		.word16be(7)   // byte count
		.word8(1)      // unit id
  	        .word8(4)      // function code    // PDU
		.word8(4)      // byte count
	        .word16be(13)  // start address
		.word16be(1)   // quantity
		.buffer();

       var res = Put()
		.word16be(0)
		.word16be(0)
		.word16be(5)
		.word8(1)
		.word8(4)
		.word8(2)
		.word16be(13)
		.buffer();

       var spy = sinon.spy(socket, 'write');

       socket.emit('data', req);
   
       assert.deepEqual(res, spy.getCall(0).args[0]);
    });


  });

});
