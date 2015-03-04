/**
 * File: client.js
 * Created on 04-Mar-2015 at 2:17 PM.
 */

var http = require('http');
var url = require('url');

/**
 * @typedef {Object} TunnelClientOpts
 *
 * @propertydef {string} relayURI
 * @propertydef {string} proxyHost
 * @propertydef {string|number} proxyPort
 */
/**
 * @param {TunnelClientOpts} opts
 * @constructor
 */
var TunnelClient = function(opts) {
    this.opts = {
        method : 'GET'
    };

    var relay = url.parse(opts.relayURI);

    if (this.opts.proxyHost) {
        this.opts.hostname = opts.proxyHost;
        this.opts.port = opts.proxyPort | 8080;
    } else {
        this.opts.hostname = relay.hostname;
        if(relay.port) {
            this.opts.port = relay.port;
        }
    }
    this.opts.path = opts.relayURI;
    console.log('created TunnelClient():', this.opts);
};

TunnelClient.prototype.open = function(callback){
    this.req = http.get(this.opts, function(resp){
        callback(resp);
    });
};

module.exports = TunnelClient;