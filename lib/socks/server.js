/**
 * File: sserver.js
 * Created on 23-Feb-2015 at 12:27 PM.
 */

'use strict';

var net = require('net');

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
    MSELECTED: 1,
    CONNECT_RECIEVED: 2
};
ClientSocket.prototype.onDataRead = function(data){
    console.log('S>>', data);
    switch (this.state) {
        case ClientSocket.STATE.CREATED:
            this.onDataMSelect(data);
            break;
        case ClientSocket.STATE.MSELECTED:
            this.onDataRequest(data);
            break;
        default:
            console.log('ERROR: illegal state', this.state);
            break;
    }
};
ClientSocket.prototype.onDataMSelect = function(data){
    if(data.length != 3) {
        throw new Error('Illegal Method Select');
    }
    if(data[0] != 0x05) {
        throw new Error('Illegal SOCKS Version');
    }
    if(data[1] != 0x01 || data[2] != 0x00) {
        throw new Error('Unsupported SOCKS Method');
    }
    var data = new Buffer([0x05,0x00]);
    this.socket.write(data);
};
ClientSocket.prototype.onDataRequest = function(data){
    if(data.length < 10) {
        throw new Error('Illegal Method Select');
    }
    if(data[0] != 0x05) {
        throw new Error('Illegal SOCKS Version');
    }
    if(data[1] != 0x01 || data[2] != 0x00) {
        throw new Error('Unsupported SOCKS Command');
    }
    if(data[3] != 0x03) {
        throw new Error('Only FQDNs supported');
    }
    var dnameLength = data[4];
    if(data.length != 7 + dnameLength) {
        throw new Error('Illegal CONNECT Request');
    }
    var fqdn = data.toString('UTF-8',5,5+dnameLength);
    var port = data.readUint16BE(5+dnameLengt);

    console.log("S> CONNECT "+ fqdn +':'+port);

    this.state = ClientSocket.CONNECT_RECIEVED;
    this.connect(fqdn,port, function(rep){
        var isIPv4 = true;
        var bndAddr = rep.dest.addr;
        var bndPort = rep.dest.port;

        var data = new Buffer(6+(isIPv4?4:16));
        data.writeUInt8(0x05,0);
        data.writeUInt8(0x00,1);
        data.writeUInt8(0x00,2);
        data.writeUInt8(isIPv4?0x01:0x03,3);

        var baddr = bndAddr.split('.').map(Number);

        data.writeUInt8(baddr[3],4);
        data.writeUInt8(baddr[2],5);
        data.writeUInt8(baddr[1],6);
        data.writeUInt8(baddr[0],7);

        data.writeUInt16BE(bndPort,8);

        this.socket.write(data);
    },function(err){
        console.log('failed:socks CONNECT',err);
        var err_code = 0x01;
        var data = new Buffer([0x05,err_code,0x00,0x01, 0,0,0,0, 0,0]);
        this.socket.write(data);
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