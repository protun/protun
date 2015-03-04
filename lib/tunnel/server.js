/**
 * File: server
 * Created on 04-Mar-2015 at 2:17 PM.
 */


var http = require('http');
var net = require('net');
var url = require('url');

var events = require('events');
var util = require('util');

/**
 * @typedef {Object} TunnelServerOpts
 * @propertydef {string} host
 * @propertydef {number} port
 */

/**
 *
 * @param {TunnelServerOpts} opts
 * @constructor
 */
var TunnelServer = function(opts){
    this.host = opts.host;
    this.port = opts.port;
    this.server = http.createServer();
};
util.inherits(TunnelServer,events.EventEmitter);

TunnelServer.prototype.address = function(){
  return this.server.address();
};
TunnelServer.prototype.listen = function(){
    var self = this;
    this.server.listen(this.port, this.host, function(){
        var addr = self.server.address();
        console.log('listening at http://'+ addr.address + ':'+ addr.port);
        self.emit('listening');
    });
    this.server.on('error',function(err){
        console.error('error',err);
    });
    this.server.on('request', function(req, res){
        console.log('http request:', req.method, req.url, req.headers);
        req.setEncoding('utf8');
        req.on('data', function(chunk){
            console.log('BODY:', chunk);
        });
        var body = 'ok';
        res.writeHead(200, {
            'Content-Length': body.length,
            'Content-Type': 'text/plain'
        });
        res.end();
    })
};

TunnelServer.prototype.close = function(){
    this.server.close();
};

module.exports = TunnelServer;