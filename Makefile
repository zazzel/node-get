#
# Run all tests
#

ifndef only
test:
	expresso -I lib test/*.test.js
else
test:
	rm -rf test_data/files_*
	expresso -I lib test/${only}.test.js
endif

doc:
	docco lib/node-get/*.js bin/node-get-file.js

.PHONY: test
