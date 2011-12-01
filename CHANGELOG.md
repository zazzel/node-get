## Changelog

### 1.1.2

* Better error handling around invalid URLs

### 1.1.1

* Node 0.6.3 compatibility without warnings

### 1.1.0

* Returns Get instance as last parameter of `toDisk`, which
  assists with filetype-guessing

### 1.0.0

* Switched from deprecated `createClient()` API to new
  `http.request` API from node.
* Stronger support for HTTPS
* No longer supports node versions below 0.3.6

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
