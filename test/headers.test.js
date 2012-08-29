var assert = require('assert');
var http = require('http');
var get = require('..');

var server;
var port = 50000 + (Math.random() * 10000 | 0);
before(function(done) {
    server = http.createServer(function(req, res) {
        res.writeHead(200, {'Content-Type': 'text/plain'});
        res.end(JSON.stringify(req.headers));
    });
    server.listen(port, done);
});

describe('headers', function() {
    it('should use default headers', function(done) {
        new get({
            uri: 'http://localhost:' + port
        }).asString(function(err, result) {
            assert.ifError(err);

            var headers = JSON.parse(result);

            [
                ['accept-encoding', 'none'],
                ['connection', 'close'],
                ['user-agent', 'curl']
            ].forEach(function(v) {
                assert.equal(headers[v[0]], v[1]);
            });
            done();
        });
    });

    it('should override "connection: keep-alive"', function(done) {
        new get({
            uri: 'http://localhost:' + port,
            headers: { 'Connection': 'keep-alive' }
        }).asString(function(err, result) {
            assert.ifError(err);
            var headers = JSON.parse(result);
            assert.equal(headers.connection, 'keep-alive');
            done();
        });
    });


    it('should set correct headers for proxied requests', function(done) {
    var HTTP_PROXY = process.env.HTTP_PROXY;
        process.env.HTTP_PROXY = 'http://user:pass@example.com:88';
        var headers = new get({
            uri: 'http://localhost:' + port
        }).headers;
        assert.equal(headers.Host, 'localhost:' + port);
        assert.equal(headers['proxy-authorization'], 'Basic dXNlcjpwYXNz');
        process.env.HTTP_PROXY = HTTP_PROXY;
        done();
    });

});

after(function() {
    server.close();
});
