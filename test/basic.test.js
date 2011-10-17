var path = require('path'),
    sys = require('sys'),
    assert = require('assert'),
    crypto = require('crypto'),
    _ = require('underscore'),
    exec = require('child_process').exec,
    fs = require('fs');

function md5(str) {
    return crypto.createHash('md5').update(str).digest('hex');
}

var get = require('../lib/node-get');


// Ensure that we start over with a clean test_data directory.
exec('rm -rf ./test_data && mkdir ./test_data', function(err, stdout, stderr) {
if (err) throw err;

exports['test constructor'] = function(beforeExit) {
    // Verify callback completion.
    var completed = {
        perform: 0,
        toDisk: 0,
        asString: 0,
        asBuffer: 0
    };

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
            md5: 'ac629823b373e7308087264d9f00ef5c'
        },
        {
            url: 'http://www.gdal.org/ogr/drv_sqlite.html',
            bin: false,
            md5: '6c7b88f22cf3a1c9dc0ef265004d449d'
        }
    ];

    files.forEach(function(reference, i) {
        var req = {
            uri: reference.url,
            headers: {
                'User-Agent': 'tombot'
            }
        };

        new get(req).perform(function(err, result) {
            var body = [];
            if (reference.error) {
                assert.eql(err, reference.error, 'This should have had an error');
            } else if (err) {
                throw new Error(err);
            } else {
                result.on('data', function(chunk) {
                    body.push(chunk);
                });
                result.on('end', function() {
                    completed.perform++;
                    assert.ok(body.length);
                });
                result.on('close', function() {
                    completed.perform++;
                    assert.ok(body.length);
                });
            }
        });

        new get(req).toDisk('test_data/file_' + i, function(err, result) {
            completed.toDisk++;
            if (reference.error) {
                assert.equal(err.message, reference.error);
            } else if (err) {
                throw new Error(err);
            } else {
                assert.equal(md5(fs.readFileSync(result)), reference.md5);
            }
        });

        new get(req).asString(function(err, result) {
            completed.asString++;

            if (reference.bin && err) {
                assert.equal(err.message, "Can't download binary file as string");
            } else if (reference.error) {
                assert.equal(err.message, reference.error);
            } else if (err) {
                throw new Error(err);
            } else {
                assert.equal(md5(result), reference.md5);
            }
        });

        new get(req).asBuffer(function(err, result) {
            completed.asBuffer++;

            if (reference.error) {
                assert.equal(err.message, reference.error);
            } else if (err) {
                throw err;
            } else {
                assert.equal(md5(result), reference.md5);
            }
        });
    });

    beforeExit(function() {
        assert.deepEqual(completed, {
            perform: files.length /* + _.reduce(_.pluck(files, 'redirects'),
                function(memo, num) { return memo + (num || 0); }, 0) */,
            toDisk: files.length,
            asString: files.length,
            asBuffer: files.length
        });
    });
};
});
