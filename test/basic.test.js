var path = require('path'),
    sys = require('sys'),
    assert = require('assert'),
    crypto = require('crypto'),
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
        asString: 0
    };

    var files = [
        {
            url: 'http://tilemill-data.s3.amazonaws.com/couchsurf.kml',
            bin: false,
            md5: '96b31a84f667007a2296edd78fb77c28'
        } /*,
        {
            url: 'http://tilemill-data.s3.amazonaws.com/couchsurf.kml',
            bin: false
        },
        {
            url: 'http://tilemill-data.s3.amazonaws.com/images/paperfolds_256.png',
            bin: true,
            md5: 'a99502016d4e2124cf2dc4775aafc256'
        },
        {
            url: 'http://tilemill-data.s3.amazonaws.com/test_data/ipsum.json',
            bin: false
        },
        {
            url: 'http://tilemill-data.s3.amazonaws.com/test_data/README.txt',
            bin: false
        },
        {
            url: 'http://tilemill-data.s3.amazonaws.com/test_data/shape_demo.zip',
            bin: true
        },
        {
            url: 'http://tilemill-data.s3.amazonaws.com/nasa_raster/lasvegas_tm5_12jan09_crop_geo_merc_small.tif',
            bin: true
        },
        {
            url: 'http://dcatlas.dcgis.dc.gov/catalog/download.asp?downloadID=2315&downloadTYPE=ESRI',
            bin: true
        },
        {
            url: 'http://www.gdal.org/ogr/drv_sqlite.html',
            bin: false
        }
        */
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
                throw err;
            } else {
                result.on('data', function(chunk) {
                    body.push(chunk);
                });
                result.on('end', function() {
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
                throw err;
            } else {
                assert.equal(md5(fs.readFileSync(result)), reference.md5);
            }
        });

        new get(req).asString(function(err, result) {
            completed.asString++;

            if (!reference.bin && err) {
                assert.equal(err.message, "Can't download binary file");
            } else if (reference.error) {
                assert.equal(err.message, reference.error);
            } else if (err) {
                throw err;
            } else {
                assert.equal(md5(result), reference.md5);
            }
        });

        new get(req).asBuffer(function(err, result) {
            if (reference.error) {
                assert.eql(err, reference.error);
            } else {
                assert.equal(md5(result), reference.md5);
            }
        });
    });

    beforeExit(function() {
        assert.deepEqual(completed, {
            perform: files.length,
            toDisk: files.length,
            asString: files.length
        });
    });
};
});
