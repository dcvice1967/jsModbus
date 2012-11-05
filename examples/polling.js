
var jsModbus = require('..'),
    util = require('util');

// override logger function
jsModbus.setLogger(function (msg) { util.log(msg); } );

var client = jsModbus.createTCPClient(2000, '192.168.0.1');


var intv = setInterval(function () {

  util.log('readInputRegister (0, 1)');
  client.readInputRegister (0, 1, 
	function (resp) { 
  	  console.log('value = ' + resp.register[0]);
	  console.log(resp);
       	});

/*  client.readInputRegister (6, 10, 
	function (resp) { 
	  console.log('inside the second user cb');
	  console.log(resp);
	});

  client.readCoils (0, 2,
	function (resp, err) { 

        console.log(arguments);
	  if (err) {
	    console.log(err);
            closeClient();
	    return;
	  }
  
	  console.log('inside the third user cb');
	  console.log(resp);
	}); */
}, 500);

util.log(intv);

setTimeout(function () {
  clearInterval(intv);
}, 10000);

setTimeout(function () {
  client.writeSingleCoil(0, false);
  client.writeSingleCoil(1, true);
}, 5000);

