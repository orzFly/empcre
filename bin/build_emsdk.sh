#!/bin/bash

#git clone https://github.com/juj/emsdk.git
cd emsdk
git pull
./emsdk install emscripten-1.36.14
./emsdk activate emscripten-1.36.14
./emsdk install clang-e1.36.14-64bit
./emsdk activate clang-e1.36.14-64bit
cd ..
