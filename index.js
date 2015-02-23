/**
 * File: index.js
 * Created on 23-Feb-2015 at 10:52 AM.
 */

'use strict';

var cfg = require('./config');
var SocksServer = require('./lib/sserver');


var server = new SocksServer({port:cfg.bindPort, host:cfg.bindHost});
server.listen();
