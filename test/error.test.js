var assert = require('assert');
var http = require('http');
var get = require('..');

var serverTimeout;
var serverBadLength;
var portBadLength = 50000 + (Math.random() * 10000 | 0);
var portTimeout = 50000 + (Math.random() * 10000 | 0);

before(function(done) {
    serverTimeout = http.createServer(function(req, res) {
        // Do not respond to requests.
    });
    serverTimeout.listen(portTimeout, done);
});

before(function(done) {
    var connections = [];
    serverBadLength = http.createServer(function(req, res) {
        res.writeHead(200, {'content-length':'20'});
        res.write(new Buffer(10));
        connections.forEach(function(c) { c.destroy(); });
    });
    serverBadLength.on('connection', function(c) {
        connections.push(c);
    });
    serverBadLength.listen(portBadLength, done);
});


describe('error handling', function() {
    it('should return an error for an invalid URL', function(done) {
        new get({
            uri: 'http://\\/',
            headers: { 'User-Agent': 'tombot' }
        }).toDisk('test_data/file_tmp', function(err, result) {
            assert.ok(/Invalid URL: http/.test(err.message));
            done();
        });
    });

    var methods = ['asString', 'asBuffer'];
    methods.forEach(function(method) {
        it(method + ': should error on bad content length', function(done) {
            new get({
                uri: 'http://localhost:' + portBadLength,
                headers: { 'User-Agent': 'tombot' }
            })[method](function(err, result) {
                assert.equal(err.toString(), 'Error: Body (10 bytes) does not match content-length (20 bytes)');
                done();
            });
        });

        // Request timeout feature only exists on node v0.6.x.
        // Test that this can pass before running the test.
        if (!http.ClientRequest.prototype.setTimeout) return;
        it(method + ': should report a timeout error', function(done) {
            new get({
                uri: 'http://localhost:' + portTimeout,
                headers: { 'User-Agent': 'tombot' },
                timeout: 500
            })[method](function(err, result) {
                assert.ok(err);
                assert.equal(err.status, 504);
                assert.equal(err.message, 'Timed out after 500ms');
                done();
            });
        });
    });
});

after(function() {
    serverTimeout.close();
    serverBadLength.close();
});
