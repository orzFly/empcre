PCRE (on Emscripten) for browser
=======

 - used https://github.com/orzFly/pcre.js as a base
 - added UMD for proper requires and imports
 - updated emscripten and provided emsdk build example script
 - fixed small fixes while using newer emscripten (--enable-utf8 => --enable-utf etc.)
 - added --enable-unicode-properties for unicode properties

## Build/Development
To rebuild dist:
```bash
./bin/build_pcre.sh

git clone https://github.com/juj/emsdk.git
./bin/build_emsdk.sh

./bin/build.sh
```

Some parts of build might be cached, on rerun:
```bash
./bin/build_emsdk.sh

./bin/build.sh
```
