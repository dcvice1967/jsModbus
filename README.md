jsModbus
========

jsModbus is a simple Modbus TCP Client (Server implementation is coming, but feel free to start on your own) with a 
selfexplaining API.

Installation
------------

Simply 'git clone' this repository into your project. jsModbus depends on put ('npm install put');

Testing
-------

The test files are implemented using [mocha](https://github.com/visionmedia/mocha).

Simply 'npm install -g mocha' and to run the tests type from the root folder 'mocha test/*.test.js'.

Please feel free to fork and add your own tests.

Client example
--------------

	var jsModbus = require('./jsModbus');
	
	// create a modbus client
	var client = jsModbus.createClient(502, '127.0.0.1');
	
	// make some calls
	client.readInputRegister(0, 10, function (resp, err) {
	  // resp will look like { fc: 4, byteCount: 20, regs: [ values 0 - 10 ] }
	});
	
	client.readCoils(5, 3, function (resp, err) {
	  // resp will look like { fc: 1, byteCount: 1, regs: [ true, false, true ] }
	});
	
	client.writeCoil(5, true, function (resp, err) {
	  // resp will look like { fc: 5, byteCount: 4, outputAddress: 5, outputValue: true }
	});

That's it for now. Feel free to fork and implement more.

License
-------

Copyright (C) 2012 Stefan Poeter (Stefan.Poeter[at]gmail.com)

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
