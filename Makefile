.PHONY: all serve install
browserify=./node_modules/.bin/browserify
static=./node_modules/.bin/static
port=8080

all: out out/bundle.js

out:
	-@mkdir out

out/bundle.js: glossa.js
	$(browserify) glossa.js -o out/bundle.js -r ./glossa.js

install:
	npm install

clean:
	-rm -rf out

serve:
	$(static) -p $(port)
