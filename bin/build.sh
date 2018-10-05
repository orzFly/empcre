#!/bin/bash

emcc -Lpcre/.libs -lpcre -Ipcre src/pcrejs.c pcre/.libs/libpcre.a -o dist/native.js -s \
    EXPORTED_FUNCTIONS="[
    `bin/find_exports.sh | sed -e 's/^/\"/' -e 's/$/\",/'`
    \"_REMatch_get_match_at\"
    ]" \
    --closure 1 -Oz --llvm-lto 1 --llvm-opts 3 --memory-init-file 0 \
    -s EXPORT_NAME="'__native__PCRE'" --post-js src/post-js.js

