#!/bin/bash

if [ ! -d pcre ]; then
  wget https://ftp.pcre.org/pub/pcre/pcre-8.41.tar.gz -O pcre-8.41.tar.gz
  tar xf pcre-8.41.tar.gz
  mv pcre-8.41 pcre
fi

cd pcre
emconfigure ./configure --enable-static --disable-shared --enable-utf --enable-unicode-properties
emmake make
cd ..

