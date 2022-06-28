#!/bin/bash

REGEX='(clip-[0-9]{4}-[0-9]{2}-[0-9]{2})[ ]([0-9]{2});([0-9]{2});([0-9]{2}).dv'

find . -name '*.dv' -type f -print0 | while read -d $'\0' file; do
  if [[ $file =~ $REGEX ]]; then
    mv "$file" "${BASH_REMATCH[1]}_${BASH_REMATCH[2]}-${BASH_REMATCH[3]}-${BASH_REMATCH[4]}.dv"
  fi
done