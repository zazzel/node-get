var assert = require('assert');
var Get = require('../lib/index.js');

it('checkMaxLength', function() {
    assert.equal(Get.checkMaxLength(null, 10), undefined);
    assert.equal(Get.checkMaxLength(1000, 10), undefined);
    assert.equal(Get.checkMaxLength(10, 10), undefined);
    assert.deepEqual(Get.checkMaxLength(10, 11).toString(), 'Error: File exceeds maximum allowed length of 10 bytes');
});

it('checkContentLength', function() {
    assert.equal(Get.checkContentLength({}, 10), undefined);
    assert.equal(Get.checkContentLength({'content-length':'foo'}, 10), undefined);
    assert.equal(Get.checkContentLength({'content-length':10}, 10), undefined);
    assert.equal(Get.checkContentLength({'content-length':'10'}, 10), undefined);
    assert.equal(Get.checkContentLength({'content-length':'10.0'}, 10), undefined);
    assert.equal(Get.checkContentLength({'content-length':'10'}, 9).toString(), 'Error: Body (9 bytes) does not match content-length (10 bytes)');
});
