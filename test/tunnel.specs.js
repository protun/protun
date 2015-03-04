/**
 * File: tunnel.specs.js
 * Created on 04-Mar-2015 at 2:47 PM.
 */

'use strict';

var chai = require('chai');
var expect = chai.expect;

var TunnelServer = require('../lib/tunnel/server');
var TunnelClient = require('../lib/tunnel/client');

describe('tunnel', function(){
    var bindPort = 2088;
    var bindHost = '127.0.0.1';
    var tunnel = null;
    var relayURI = 'http://'+bindHost+':'+bindPort+'/';

    before(function(){
        tunnel = new TunnelServer({port:bindPort.toString(), host:bindHost});

    });
    after(function(){
        if(tunnel != null) {
            tunnel.close();
        }
    });

    describe('#listen',function(){
        xit('can listen', function(done){
            tunnel.listen();
            tunnel.on('listening',function(){
                expect(tunnel.address().address).to.equal(bindHost);
                expect(tunnel.address().family).to.equal('IPv4');
                expect(tunnel.address().port).to.equal(bindPort);
                done();
            });
        });
        it('can receive requests', function(done) {
            tunnel.listen();
            tunnel.on('listening',function(){
                var client = new TunnelClient({relayURI: relayURI});
                client.open(function(){
                    done();
                });
            });
        });
    });
});