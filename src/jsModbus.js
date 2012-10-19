
var modbusHandler = require('./jsModbusHandler'),
    serverModule = require('./jsModbusServer'),
    clientModule = require('./jsModbusClient');

exports.setLogger = function (logger) {
  modbusHandler.setLogger(logger);
  clientModule.setLogger(logger);  
};

exports.createClient = clientModule.create;
exports.createServer = serverModule.create;
