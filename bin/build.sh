#!/bin/bash

emcc -Lpcre/.libs -lpcre -Ipcre src/c/empcre.c pcre/.libs/libpcre.a -o dist/empcre.js -s \
    EXPORTED_FUNCTIONS="[
    `bin/find_exports.sh | sed -e 's/^/\"/' -e 's/$/\",/'`
    ]" \
    --closure 1 -Oz --llvm-lto 1 --llvm-opts 3 --memory-init-file 0