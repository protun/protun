/**
 * File: sserver.js
 * Created on 23-Feb-2015 at 12:27 PM.
 */

'use strict';

var net = require('net');
var socks = require('./socks');

/**
 * @param {SocksServerOpts} opts
 * @param {SocksServer} wrapper
 * @constructor
 */
var SocksServerImpl = function(opts, wrapper){
    this.host = opts.host;
    this.port = parseInt(opts.port);
    this.wrapper = wrapper;
    this.server = null;
};

SocksServerImpl.prototype.listen = function(){
    if(this.server) return;

    this.server = net.createServer();
    this.server.on('listening', this.onListening.bind(this));
    this.server.on('error', this.onError.bind(this));
    this.server.on('close', this.onClose.bind(this));
    this.server.on('connection', this.onConnection.bind(this));

    this.server.listen(this.port, this.host);
};

SocksServerImpl.prototype.onConnection = function(sock) {
    var client = new ClientSocket(sock,this);
    console.log('new connection: '+ sock.localAddress + ':'+sock.localPort + ' <- '+ sock.remoteAddress+':'+ sock.remotePort );
};
SocksServerImpl.prototype.onListening = function(){
    var addr = this.server.address();
    console.log("Listening at:", addr.address +':'+addr.port+'\n');
    this.wrapper.emit('listening');
};
SocksServerImpl.prototype.onError = function(err){
    console.log('Server Error:',arguments);
    this.wrapper.emit('error',err);
};
SocksServerImpl.prototype.onClose = function(){
    console.log('Server closed!',arguments);
    this.wrapper.emit('close');
};

SocksServerImpl.prototype.close = function(){
    console.log('Shutting down server ... ');
    this.server.close(function(err){
        console.log('Shutting down server ... DONE',err);
    });
};


/**
 * @param socket
 * @param {SocksServer} server
 * @constructor
 */
var ClientSocket = function(socket, server){
    this.server = server;
    this.socket = socket;
    this.state = ClientSocket.STATE.CREATED;

    this.socket.on('data', this.onDataRead.bind(this));
};

ClientSocket.STATE = {
    CREATED: 0,
    METHOD_SELECTED: 1,
    CONNECT_RECIEVED: 2
};
ClientSocket.prototype.onDataRead = function(data){
    console.log('S>>', data);
    switch (this.state) {
        case ClientSocket.STATE.CREATED:
            this.onReq_SelectMethod(data);
            break;
        case ClientSocket.STATE.METHOD_SELECTED:
            this.onReq_SocksRequest(data);
            break;
        default:
            console.log('ERROR: illegal state', this.state);
            break;
    }
};
ClientSocket.prototype.onReq_SelectMethod = function(data){
    var methods = socks.parse_SelectMethod_req(data);
    var repMethod = socks.Methods.NO_AUTHENTICATION_REQUIRED;
    if(-1 == methods.indexOf(socks.Methods.NO_AUTHENTICATION_REQUIRED)) {
        console.log('No supported SOCKS Method in req:', data);
        repMethod = socks.Methods.NO_ACCEPTABLE_METHODS;
    }
    this.socket.write(socks.rep_MethodSelected(repMethod));
};
ClientSocket.prototype.onReq_SocksRequest = function(data){
    var req = socks.parse_SocksRequest_req(data);
    if(req.cmd != socks.Commands.CONNECT) {
        var rep = socs.rep_SocksReply(socks.Replys.COMMAND_NOT_SUPPORTED);
        console.log('S> CONNECT: ERROR - COMMAND_NOT_SUPPORTED');
        this.socket.write(rep);
        return;
    }
    if(req.atype != socks.AddressType.DOMAIN_NAME) {
        var rep = socs.rep_SocksReply(socks.Replys.ADDR_TYPE_NOT_SUPPORTED);
        console.log('S> CONNECT: ERROR - ADDR_TYPE_NOT_SUPPORTED');
        this.socket.write(rep);
        return;
    }

    console.log("S> CONNECT "+ req.fqdn +':'+req.port);

    this.state = ClientSocket.CONNECT_RECIEVED;
    this.connect(req.fqdn,req.port, function(rep){
        var atype = socks.AddressType.DOMAIN_NAME;
        switch (net.isIP(rep.addr)){
            case 4: atype = socks.AddressType.IPv4; break;
            case 6: atype = socks.AddressType.IPv6; break;
        }
        var socksRep = socks.rep_SocksReply(socks.Replys.SUCCEEDED, atype,rep.addr, rep.port);
        this.socket.write(socksRep);
    }, function(err){
        console.log('failed:socks CONNECT',err);
        var socksRep = socks.rep_SocksReply(socks.Replys.SERVER_FAILURE);
        this.socket.write(socksRep);
    });
};
ClientSocket.prototype.connect = function(fqdn,port,success,error){
    net.connect(port,fqdn,function(conn){
        console.log('target connected', conn);
        success({
            dest:{
                addr: conn.localAddress,
                port: conn.localPort
            }
        });
    });
};

module.exports = SocksServerImpl;