/**
 * File: sserver.js
 * Created on 23-Feb-2015 at 12:27 PM.
 */

'use strict';

var events = require('events');
var util = require('util');


var SocksServerImpl = require('./socks/server');

/**
 * @typedef {Object} SockServerOpts
 * @propertydef {string} host
 * @propertydef {number} port
 */
/**
 * @param {SocksServerOpts} opts
 * @constructor
 */
var SocksServer = function(opts){
    var impl = new SocksServerImpl(opts, this);
    this.listen = function(){
        impl.listen();
    };
    this.address = function(){
        return impl.server.address();
    };
};
util.inherits(SocksServer,events.EventEmitter);


module.exports = SocksServer;