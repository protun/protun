/**
 * File: sclient.js
 * Created on 23-Feb-2015 at 12:27 PM.
 */

'use strict';

var events = require('events');
var util = require('util');

var SocksClientImpl = require('./socks/client');

/**
 * @typedef {Object} SocksClientOpts
 * @propertydef {string} host
 * @propertydef {number} port
 */
/**
 * @param {SocksClientOpts} opts
 * @constructor
 */
var SocksClient = function(opts){
    var impl = new SocksClientImpl(opts,this);
    this.connect = function(){
        impl.connect();
    };
};
util.inherits(SocksClient,events.EventEmitter);


module.exports = SocksClient;