/**
 * File: sclient.js
 * Created on 23-Feb-2015 at 12:27 PM.
 */

'use strict';

var net = require('net');
var socks = require('./socks');

/**
 * @param {SocksClientOpts} opts
 * @param {SocksClient} wrapper
 * @constructor
 */
var SocksClientImpl = function(opts,wrapper){
    this.port = opts.port;
    this.host = opts.host;
    this.wrapper = wrapper;
    this.state = SocksClientImpl.STATE.CREATED;
};

SocksClientImpl.STATE = {
    CREATED: 0,
    MSELECT_SENT: 1,
    MSELECTED: 2
};

SocksClientImpl.prototype.onConnect = function() {
    var self = this;

    console.log('client connected: ',
            this.sock.localAddress+':'+this.sock.localPort +
            ' -> ' +
            this.sock.remoteAddress+':'+this.sock.remotePort);

    // send method selection
    this.sock.write(socks.req_SelectMethod(socks.Methods.NO_AUTHENTICATION_REQUIRED), function(){
        self.state = SocksClientImpl.STATE.MSELECT_SENT;
    });
};
SocksClientImpl.prototype.onData = function(data) {
    console.log('C>>',data);
    switch(this.state){
        case SocksClientImpl.STATE.MSELECT_SENT:
            if(data.length != 2) {
                throw new Error('Illegal MSELECT reply');
            }
            if(data[0] != 0x05 || data[1] != 0x00) {
                throw new Error('Illegal MSELECT reply');
            }
            this.state = SocksClientImpl.STATE.METHOD_SELECTED;
            this.wrapper.emit('connect');
            break;
        default:
            throw new Error('Illegal state');
            break;
    }
};

SocksClientImpl.prototype.connect = function(){
    this.sock = net.createConnection(this.port,this.host);
    this.sock.on('connect', this.onConnect.bind(this));
    this.sock.on('error', function(err){
        console.log('failed to connect client',err);
    });
    this.sock.on('data', this.onData.bind(this));
};


module.exports = SocksClientImpl;