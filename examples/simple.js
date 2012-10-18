
var jsModbus = require('..');

// override logger function
jsModbus.setLogger(function () { } );

var client = jsModbus.createClient(8888, '127.0.0.1');

var cntr = 0;
var closeClient = function () {
  cntr += 1;
  if (cntr == 2) {
    client.close();
  }
}


client.readInputRegister (0, 1, 
	function (resp) { 
  	  console.log('inside the first user cb');
	  console.log(resp);
          closeClient(); 
	});
client.readInputRegister (6, 10, 
	function (resp) { 
	  console.log('inside the second user cb');
	  console.log(resp);
          closeClient(); 
	});

