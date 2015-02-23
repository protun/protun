/**
 * File: config.js
 * Created on 23-Feb-2015 at 11:02 AM.
 */
var config = {
    bindPort: process.env.OPENSHIFT_NODEJS_PORT || '8080',
    bindHost: process.env.OPENSHIFT_NODEJS_IP || 'localhost'
};

module.exports = config;
