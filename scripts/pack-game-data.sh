#!/bin/bash

set -ex

if [ -z "$1" ] || [ -z "$2" ]; then
  echo "Usage: $0 <folder> <zip>"
  exit 1
fi

rm -rf .tmp etc/game-data-$2.zip
cp -r $1 .tmp
find .tmp -iname "*.avi" -delete

pushd .tmp
zip -9r ../etc/game-data-$2.zip ./*
popd
