/**
 * File: sserver.specs.js
 * Created on 23-Feb-2015 at 12:44 PM.
 */

'use strict';

var chai = require('chai');
var expect = chai.expect;

var SocksServer = require('../lib/sserver');
var SocksClient = require('../lib/sclient');

describe('SocksServer', function(){
    var bindPort = 1080;
    var bindHost = '127.0.0.1';
    var server = null;

    before(function(){
        server = new SocksServer({port:bindPort.toString(), host:bindHost});
    });

    describe('#listen', function(){
        it('could listen',function(done){
            server.listen();
            server.on('listening',function(){
                expect(server.address().address).to.equal(bindHost);
                expect(server.address().family).to.equal('IPv4');
                expect(server.address().port).to.equal(bindPort);
                done();
            });
        });
    });
    describe('accepts', function(){
        it('accepts connections',function(done){
            server.listen();
            var client = new SocksClient({port:bindPort.toString(),host:bindHost});
            client.connect();
            client.on('connect', function(){
                done();
            });
        });
    });
});