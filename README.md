# get

`get` is a slightly higher-level HTTP client for nodejs.

## Installation

    npm install get

get has no dependencies.

For testing, you'll need make and [expresso](https://github.com/visionmedia/expresso).

For docs you'll need [docco](https://github.com/jashkenas/docco).

## Features

* Redirect following.
* Convenience functions for downloading and getting data as string.
* Binary-extension and basic binary detection.
* Configurable headers

## API

Downloads are objects in `get`.

```javascript
var dl = new get({ uri: 'http://google.com/' });
```

The get constructor can also take a plain string if you don't want to give options.

```javascript
var dl = new get('http://google.com/');
```

It can also take other options.

```javascript
var dl = new get({
    uri: 'http://google.com/',
    max_redirs: 20,
});
```

Then it exposes three main methods

```javascript
dl.asString(function(err, str) {
    console.log(str);
});
```

and

```javascript
dl.toDisk('myfile.txt', function(err, filename) {
    console.log(err);
});
```

and finally

```javascript
dl.asBuffer(function(err, data) {
    console.log(data);
});
```


There's also a lower-level API.

```javascript
dl.perform(function(err, response) {
    // response is just a response object, just like
    // HTTP request, except handling redirects
});
```

If you give node-get an object of settings instead of a string,
it accepts

* `uri` - the address of the resource
* `headers` - to replace its default headers with custom ones
* `max_redirs` - the number of redirects to follow before returning an error
* `no_proxy` - don't use a HTTP proxy, even if one is in `ENV`
* `encoding` - When calling `.guessEncoding()`, `get` will use this instead of the default value

## Example

```
var get = require('get');

new get('http://google.com/').asString(function(err, data) {
    if (err) throw err;
    console.log(data);
});
```

## Changelog

### 0.4.0

* Added `asBuffer()` method
* Streamlined `asDisk` to use node's native `.pipe()` function
* Added `encoding` option to constructor

### 0.4.0

* `.asBuffer()` added
* `get()` can now be used without `new`

### 0.3.0

* `get` now supports HTTP SOCKS proxies by setting `HTTP_PROXY` in `ENV`

### 0.2.0

* `node-get` is now `get`.

### 0.1.1

* [laplatrem](https://github.com/leplatrem): Fixed HTTPS support

### 0.1.0

* `max_redirs`, `headers` options in node-get constructor
* The API changes in 0.1.x - Get should never be expected to throw an exception.
* Handling of invalid URLs on redirect.
* Handling of file-level errors.

### 0.0.3

* Handling of DNS-level exceptions.

### 0.0.2

* Enhanced URL validation.

## TODO:

* Retries
* Tested HTTPS
* Guessing encoding wth headers
* User-customizable encodings

## Authors

* Tom MacWright (tmcw)
* Konstantin Kaefer (kkaefer)
