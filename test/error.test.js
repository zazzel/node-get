var assert = require('assert');
var http = require('http');
var get = require('..');

var server;
var port = 50000 + (Math.random() * 10000 | 0);
before(function(done) {
    server = http.createServer(function(req, res) {
        // Do not respond to requests.
    });
    server.listen(port, done);
});

describe('error handling', function() {
    it('should return an error for an invalid URL', function(done) {
        new get({
            uri: 'http://\\/',
            headers: { 'User-Agent': 'tombot' }
        }).toDisk('test_data/file_tmp', function(err, result) {
            assert.equal(err.message, 'Invalid URL');
            done();
        });
    });

    it('should report a timeout error', function(done) {
        new get({
            uri: 'http://localhost:' + port,
            headers: { 'User-Agent': 'tombot' },
            timeout: 500
        }).asString(function(err, result) {
            assert.ok(err);
            assert.equal(err.message, 'Timed out after 500ms');
            done();
        });
    });
});

after(function() {
    server.close();
});
