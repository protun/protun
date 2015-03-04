/**
 * File: socks
 * Created by on 04-Mar-2015 at 10:52 AM.
 */

'use strict';

var SocksFactory = {};


SocksFactory.Methods = {
    NO_AUTHENTICATION_REQUIRED : 0x00,
    GSSAPI : 0x01,
    USERNAME_PASSWORD: 0x02,
    IANA_ASIGNED_START: 0x03,
    IANA_ASIGNED_END: 0x7F,
    PRIVATE_START: 0x80,
    PRIVATE_END: 0xFE,
    NO_ACCEPTABLE_METHODS: 0xFF
};

/**
 * @param {Array.<SocksMethods>|number} methods
 * @returns {Buffer}
 */
SocksFactory.req_SelectMethod = function(methods){
    var req = [];
    var methodFilter = function(method){return typeof method == 'number';};
    if(methods instanceof Array) {
        req = methods.filter(methodFilter);
    } else if(arguments.length != 0){
        req = Array.prototype.filter.call(arguments, methodFilter);
    } else {
        throw new Error("No Socks Method specified");
    }

    req.unshift(req.length);
    req.unshift(0x05);
    return new Buffer(req);
};
/**
 * @param {number} method
 * @returns {Buffer}
 */
SocksFactory.rep_MethodSelected = function(method){
    if(typeof method != 'number') throw new Error("Socks Method not specifed");

    var req = [method];
    req.unshift(0x05);
    return new Buffer(req);
};

/**
 * @param {Buffer} data
 */
SocksFactory.parse_SelectMethod_req = function(data){
    if(data.length < 3) {
        throw new Error('Illegal SelectMethod Request');
    }
    if(data[0] != 0x05) {
        throw new Error('Illegal SOCKS Version');
    }
    if(data[1] != (data.length -2)) {
        throw new Error('Illegal SelectMethod Request');
    }
    return Array.prototype.slice.call(data,2);
};
/**
 * @readonly
 * @enum {number}
 */
SocksFactory.Commands = {
    CONNECT: 0x01,
    BIND: 0x02,
    UDP_ASSOCIATE: 0x03
};
/**
 * @readonly
 * @enum {number}
 */
SocksFactory.AddressType = {
    IPv4: 0x01,
    DOMAIN_NAME: 0x03,
    IPv6: 0x04
};
/**
 * @typedef {Object} SocksRequest
 * @property {SocksFactory.Commands} cmd
 * @property {SocksFactory.AddressType} atype
 * @property {string} fqdn
 * @property {number} port
 */
/**
 * @param {Buffer} data
 * @return {SocksRequest}
 */
SocksFactory.parse_SocksRequest_req = function(data) {
    var req = {};
    if(data.length < 10) {
        throw new Error('Illegal SOCKS Request');
    }
    if(data[0] != 0x05) {
        throw new Error('Illegal SOCKS Version');
    }
    if(data[2] != 0x00) { // check reserved field
        throw new Error('Illegal SOCKS Command request');
    }
    req.cmd = data[1];
    req.atype = data[3];

    if(req.atype == SocksFactory.AddressType.DOMAIN_NAME) {
        var dnameLength = data[4];
        if (data.length != 7 + dnameLength) {
            throw new Error('Illegal SOCKS Command Request');
        }
        req.fqdn = data.toString('UTF-8', 5, 5 + dnameLength);
        req.port = data.readUint16BE(5 + dnameLengt);
    } else if (req.atype == SocksFactory.AddressType.IPv4 ){
        if (data.length != 4 + 4 + 2) {
            throw new Error('Illegal SOCKS Command Request');
        }
        req.ipv4 = data.readUInt32BE(4);
        req.port = data.readUInt16BE(4+4);
    } else if (req.atype == SocksFactory.AddressType.IPv6 ){
        if (data.length != 4 + 16 + 2) {
            throw new Error('Illegal SOCKS Command Request');
        }
        var addr = "";
        for(var i = 0; i < 8; i++) {
            if(addr.length > 0) addr += ":";
            addr += data.readUInt16BE(4+2*i).toString();
        }
        req.ipv6 = addr;
        req.port = data.readUInt16BE(4+16);
    }
    return req;
};

/**
 * @readonly
 * @enum {number}
 */
SocksFactory.Replys = {
    SUCCEEDED                : 0x00,
    SERVER_FAILURE           : 0x01,
    NOT_ALLOWED              : 0x02,
    NETWORK_UNREACHABLE      : 0x03,
    HOST_UNREACHABLE         : 0x04,
    CONNECTION_REFUSED       : 0x05,
    TTL_EXPIRED              : 0x06,
    COMMAND_NOT_SUPPORTED    : 0x07,
    ADDR_TYPE_NOT_SUPPORTED  : 0x08
};


/**
 *
 * @param {SocksFactory.Replys} reply
 * @param {SocksFactory.AddressType} atype
 * @param {string|Array.<number>} addr
 * @param {number} port
 * @returns {Buffer}
 */
SocksFactory.rep_SocksReply = function(reply,atype,addr,port) {
    var rep = [];
    if(reply == SocksFactory.Replys.SUCCEEDED) {
        if(atype == SocksFactory.AddressType.IPv4) {
            var v4addr = [];
            if(typeof addr == 'string') {
                v4addr = addr.split('.').map(Number);
            } else if(addr instanceof Array) {
                if(addr.length !=4){ throw new Error("Illegal IPv4 addr:",addr);}
                v4addr = addr.slice().map(Number);
            }
            rep = v4addr;
            rep.unshift(SocksFactory.AddressType.IPv4);
        } else if(atype == SocksFactory.AddressType.IPv6) {
            var v6addr = [0,0,0,0,0,0,0,0];
            if(typeof addr == 'string') {
                addr.split(':').reverse().map(function(e,i){
                    if(e) {v6addr[7-i] = parseInt(e,16);}
                });
            } else if(addr instanceof Array) {
                if(addr.length !=4){ throw new Error("Illegal IPv4 addr:",addr);}
                v4addr = addr.slice().map(Number);
            }
            rep = v6addr;
            rep.unshift(SocksFactory.AddressType.IPv6);
        } else {
            throw new Error("Expecting IPv4/6 address in SOCKS Reply, but:",addr);
        }
        rep.push(port / 255);
        rep.push(port % 255);
    } else {
        rep = [0x01,0x00,0x00,0x00,0x00, 0x00,0x00]; // IPv4, 0.0.0.0:0
    }

    rep.unshift(0x00); //reserved
    rep.unshift(reply);
    rep.unshift(0x05);
    return new Buffer(rep);
};

module.exports = SocksFactory;