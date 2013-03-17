var path = require('path');
var assert = require('assert');
var crypto = require('crypto');
var exec = require('child_process').exec;
var fs = require('fs');
var get = require('..');


function md5(obj) {
    if (!Array.isArray(obj)) obj = [ obj ];
    var hash = crypto.createHash('md5');
    obj.forEach(hash.update.bind(hash));
    return hash.digest('hex');
}

var files = [
    {
        url: 'https://docs.google.com/a/dbsgeo.com/spreadsheet/pub?hl=en_US&hl=en_US&key=0AqV4OJpywingdFNYLXpKMmxqMG1lWTJzNE45ZUVnNlE&single=true&gid=0&output=csv',
        bin: false,
        redirects: 1,
        md5: 'a4d019d2bfedc55e84447f833ed71dff'
    },
    {
        url: 'http://tilemill-data.s3.amazonaws.com/images/paperfolds_256.png',
        bin: true,
        md5: 'a99502016d4e2124cf2dc4775aafc256'
    },
    {
        url: 'http://tilemill-data.s3.amazonaws.com/test_data/ipsum.json',
        bin: true,
        md5: '651ea0ff31786e9be9012112b21573be'
    },
    {
        url: 'http://tilemill-data.s3.amazonaws.com/test_data/README.txt',
        bin: false,
        md5: '46d883d71e795d7c8a65c9b1a6673dd2'
    },
    {
        url: 'http://tilemill-data.s3.amazonaws.com/test_data/shape_demo.zip',
        bin: true,
        md5: 'b5ff3545922cc9e0c750fb7263a7a3d3'
    },
    {
        url: 'http://tilemill-data.s3.amazonaws.com/nasa_raster/lasvegas_tm5_12jan09_crop_geo_merc_small.tif',
        bin: true,
        md5: '3b97134839042fcab0d0ee8ea76f73c4'
    },
    {
        url: 'http://dcatlas.dcgis.dc.gov/catalog/download.asp?downloadID=2315&downloadTYPE=ESRI',
        bin: true,
        md5: 'bb9ab6b15dab9615717f2fc76bd73c1b'
    }
];



// Ensure that we start over with a clean test_data directory.
before(function(done) {
    exec('rm -rf ./test_data && mkdir ./test_data', done);
});

describe('get().perform', function() {
    files.forEach(function(reference) {
        it('should return request object for ' + reference.url, function(done) {
            this.timeout(0);
            new get({
                uri: reference.url,
                headers: { 'User-Agent': 'tombot' }
            }).perform(function(err, result) {
                var body = [];
                if (reference.error) {
                    assert.ok(err);
                    assert.eql(err.message, reference.error);
                    done();
                } else if (err) {
                    done(err);
                } else {
                    result.on('error', done);
                    result.on('data', function(chunk) {
                        body.push(chunk);
                    });
                    result.on('close', function(err) {
                        assert.equal(md5(body), reference.md5);
                        done();
                    });
                    result.on('end', function() {
                        assert.equal(md5(body), reference.md5);
                        done();
                    });
                }
            });
        });
    });
});

describe('get().toDisk', function() {
    files.forEach(function(reference) {
        it('should save to disk for ' + reference.url, function(done) {
            this.timeout(0);
            new get({
                uri: reference.url,
                headers: { 'User-Agent': 'tombot' }
            }).toDisk('test_data/file_' + reference.md5, function(err, result) {
                if (reference.error) {
                    assert.ok(err);
                    assert.equal(err.message, reference.error);
                    done();
                } else if (err) {
                    done(err);
                } else {
                    assert.equal(md5(fs.readFileSync(result)), reference.md5);
                    done();
                }
            });
        });
    });
});

describe('get().asString', function() {
    files.forEach(function(reference) {
        it('should return as string for ' + reference.url, function(done) {
            this.timeout(0);
            new get({
                uri: reference.url,
                headers: { 'User-Agent': 'tombot' }
            }).asString(function(err, result) {
                if (reference.bin && err) {
                    assert.equal(err.message, "Can't download binary file as string");
                    done();
                } else if (reference.bin) {
                    done(new Error('Should not return binary files as string'));
                } else if (reference.error) {
                    assert.equal(err.message, reference.error);
                    done();
                } else if (err) {
                    done(err);
                } else {
                    assert.equal(md5(result), reference.md5);
                    done();
                }
            });
        });
    });
});

describe('get().asBuffer', function() {
    files.forEach(function(reference) {
        it('should return as buffer for ' + reference.url, function(done) {
            this.timeout(0);
            new get({
                uri: reference.url,
                headers: { 'User-Agent': 'tombot' }
            }).asBuffer(function(err, result) {
                if (reference.error) {
                    assert.equal(err.message, reference.error);
                    done();
                } else if (err) {
                    done(err);
                } else {
                    assert.equal(md5(result), reference.md5);
                    done();
                }
            });
        });
    });
});

describe('max_length', function() {
    it('should abort .asBuffer() if the max_length is exceeded', function(done) {
        this.timeout(0);
        new get({
            uri: 'http://tilemill-data.s3.amazonaws.com/images/paperfolds_256.png',
            headers: { 'User-Agent': 'tombot' },
            max_length: 10000
        }).asBuffer(function(err) {
            assert.ok(err);
            assert.equal(err.message, 'File exceeds maximum allowed length of 10000 bytes');
            done();
        });
    });

    it('should abort .asString() if the max_length is exceeded', function(done) {
        this.timeout(0);
        new get({
            uri: 'http://tilemill-data.s3.amazonaws.com/test_data/README.txt',
            headers: { 'User-Agent': 'tombot' },
            max_length: 10
        }).asString(function(err) {
            assert.ok(err);
            assert.equal(err.message, 'File exceeds maximum allowed length of 10 bytes');
            done();
        });
    });
});
