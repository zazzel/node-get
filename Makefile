#
# Run all tests
#

ifndef only
test:
	./node_modules/.bin/expresso -I lib test/*.test.js
else
test:
	rm -rf test_data/files_*
	./node_modules/.bin/expresso -I lib test/${only}.test.js
endif

lint:
	./node_modules/.bin/jshint lib/node-get/*.js

doc:
	./node_modules/.bin/docco lib/node-get/*.js bin/node-get-file.js

.PHONY: test
