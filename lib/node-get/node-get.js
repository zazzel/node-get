// node.js libraries
var http = require('http'),
    sys = require('sys'),
    fs = require('fs'),
    events = require('events'),
    Buffer = require('buffer').Buffer,
    url = require('url'),
    path = require('path');

// Local node-get libraries
var encodings = require('./encodings');

var default_headers = {
    'Accept-Encoding': 'none',
    'Connection': 'close',
    'User-Agent': 'node-get'
};

// Get a Get object. Takes an argument, that is either
// a plain string representing the URI, or an object:
//
//     {
//       // required
//       uri: "string of uri",
//
//       // optional, default in source
//       headers: { object of headers to send with the request }
//
//       // optional, default 10
//       max_redirs: 5 // maximum number of redirects to follow
//
//       no_proxy: true // prevent automatic proxy usage when HTTP_PROXY is set.
//     }
function Get(options) {
    // Allow calling without new keyword.
    if (!(this instanceof Get)) {
        return new Get(options);
    }

    if (typeof options == 'string') {
        this.uri = options;
        this.headers = default_headers;
        if (process.env.HTTP_PROXY) {
            this.proxy = url.parse(process.env.HTTP_PROXY);
        } else {
            this.proxy = {};
        }
    } else {
        if (!options.uri) {
            throw Error('uri option required in get constructor');
        }
        this.uri = options.uri;
        this.max_redirs = options.max_redirs || 10;
        this.encoding = options.encoding;
        this.headers = options.headers || default_headers;
        if (!this.no_proxy && process.env.HTTP_PROXY) {
            this.proxy = url.parse(process.env.HTTP_PROXY);
        } else {
            this.proxy = {};
        }
    }
}

sys.inherits(Get, events.EventEmitter);

// Create or reuse a HTTP client
//
// - @return {http.Client} a proper client.
Get.prototype.client = function(callback) {
    // TODO: handle non http/https protocols
    this.uri_o = url.parse(this.uri);

    // Validate the URI at this step so that invalid
    // redirects are also caught.
    if (!(this.uri_o.protocol &&
        (this.uri_o.protocol == 'http:' || this.uri_o.protocol == 'https:') &&
        this.uri_o.hostname)) {
        return callback.call(this, new Error('Invalid URL'));
    }

    // Reuse existing client connections in the
    // case of redirects.
    if (this._client &&
        (this.uri_o.port || 80) == this._client.port &&
        this.uri_o.host == this._client.host) {
        return this._client;
    }

    // TODO: should proxies support HTTPS?
    if (this.uri_o.protocol == 'https:') {
        this._client = http.createClient(443, this.uri_o.hostname, true);
    } else {
        this._client = http.createClient(this.proxy.port || this.uri_o.port || 80,
            this.proxy.hostname || this.uri_o.hostname);
    }

    this._client.headers = this.headers;
    return this._client;
};

Get.prototype.guessEncoding = function(location) {
    // The 'most reliable' measure is probably the end of files, so
    // start off with extname.
    if (this.encoding) return this.encoding;
    var ext = path.extname(location).toLowerCase();
    if (encodings.ext[ext]) return encodings.ext[ext];
};

// Innermost API function of Get
//
// - @param {Function} callback
// - @param {Number} times number of times re-called.
Get.prototype.perform = function(callback, times) {
    if (times > this.max_redirs) {
        callback(new Error('Redirect limit of ' + this.max_redirs + ' reached'));
        return;
    }

    times = times || 1;

    var c = this.client(callback);
    // The client can fail if the url is invalid
    if (!c) return;

    // Handle DNS-level errors, like ECONNREFUSED
    c.addListener('error', function(err) {
        callback.call(this, err);
    }.bind(this));

    // TODO: fix when/if gzip is supported.
    // If a proxy is defined, ask for the full requested URL,
    // otherwise construct the URL without a hostname and protocol.
    var request = c.request('GET',
        this.proxy.hostname ?
         this.uri :
         ((this.uri_o.pathname || '') +
         (this.uri_o.search || '') +
         (this.uri_o.hash || '')) || '/', {
            host: this.uri_o.hostname
        }
    );

    request.addListener('response', function(response) {
        if (response.statusCode >= 300 &&
            response.statusCode < 400 &&
            response.headers.location) {
            // Redirection
            // -----------
            // Servers can send a full redirect location
            // or a short form, like a hyperlink. Handle both.
            if (url.parse(response.headers.location).protocol) {
                this.uri = response.headers.location;
            } else {
                this.uri = url.resolve(this.uri, response.headers.location);
            }
            this.perform(callback, times + 1);
            return;
        } else if (response.statusCode >= 400) {
            // failure
            var err = new Error('Server returned HTTP ' + response.statusCode);
            err.status = response.statusCode;
            callback.call(this, err, response);
        } else {
            // success
            callback.call(this, null, response);
        }
    }.bind(this));

    request.end();
};

// Stream a file to disk
// ---------------------
// - @param {String} filename.
// - @param {Function} callback.
Get.prototype.toDisk = function(filename, callback) {
    // TODO: catch all errors
    this.perform(function(err, response) {
        if (err) return callback(err);

        // Don't set an encoding. Using an encoding messes up binary files.

        // Pump contents from the response stream into a new writestream.
        var file = fs.createWriteStream(filename);
        file.on('error', callback);
        file.on('close', function() { callback(null, filename, response.headers); });
        response.pipe(file);
    });
};

// Get the contents of a URL as a string
//
// - @param {Function} callback.
Get.prototype.asString = function(callback) {
    // TODO: catch all errors
    this.perform(function(err, response) {
        if (err) return callback(err);

        switch ((response.headers['content-type'] || '').toLowerCase()) {
            case 'binary/octet-stream':
            case 'application/octet-stream':
                return callback(new Error("Can't download binary file as string"));
            default:
                // TODO: respect Content-Transfer-Encoding header
                response.setEncoding(this.guessEncoding(this.uri));
        }

        // Fill an array with chunks of data,
        // and then join it into a string before calling `callback`
        var out = [];
        response.on('data', function(chunk) {
            out.push(chunk);
        });
        response.on('error', function(err) {
            callback(err);
        });
        response.on('end', function() {
            callback(null, out.join(''), response.headers);
        });
    });
};

// Get the contents of a URL as a buffer
//
// - @param {Function} callback.
Get.prototype.asBuffer = function(callback) {
    this.perform(function(err, response) {
        if (err) return callback(err);

        // Don't set an encoding.

        // Fill an array with chunks of data,
        // and then join it into a buffer before calling `callback`
        var out = [];
        response.on('data', function(chunk) {
            out.push(chunk);
        });
        response.on('error', function(err) {
            callback(err);
        });
        response.on('end', function() {
            for (var length = 0, i = 0; i < out.length; i++) {
                length += out[i].length;
            }
            var result = new Buffer(length);
            for (var pos = 0, i = 0; i < out.length; i++) {
                out[i].copy(result, pos);
                pos += out[i].length;
            }
            callback(null, result, response.headers);
        });
    });
};

module.exports = Get;
