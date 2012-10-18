
var modbusHandler = require('./jsModbusHandler'),
    clientModule = require('./jsModbusClient');

exports.setLogger = function (logger) {
  modbusHandler.setLogger(logger);
  clientModule.setLogger(logger);  
};

exports.createClient = clientModule.create;

exports.createServer = function (port, handler) {

}
