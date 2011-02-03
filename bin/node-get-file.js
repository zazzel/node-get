#!/usr/bin/env node

var path = require('path'),
    url = require('url'),
    sys = require('sys'),
    get = require('node-get');

var usage = 'usage:\n'
    + '\ndownload to a file:'
    + '\n\tnode-get-file.js <file> <destination_file>'
    + '\n\nget contents of file:'
    + '\n\tnode-get-file.js <file> -'

// Guessing destination filenames wget-style has never been
// very robust, so require users to specify them.
var obj = process.ARGV[2];
var dest = process.ARGV[3];
if (!(obj && dest)) {
   console.log(usage);
   process.exit(1);
}

// Initialize the download.
var download = new get({
    uri: obj
});

switch (dest) {
    case '-':
        // Download to disk.
        download.asString(function(err, str) {
            // Print both errors and debugging messages
            // to stderr so that eventual piping is succesfull
            if (err) {
                sys.err(err);
            } else {
                console.log(str);
            }
        });
        break;
    default:
        // Download to disk.
        download.toDisk(dest, function(err, filename) {
            // Print both errors and debugging messages
            // to stderr so that eventual piping is succesfull
            if (err) {
                sys.err(err);
            } else {
                sys.debug('Downloaded to ' + filename);
            }
        });
        break;
}