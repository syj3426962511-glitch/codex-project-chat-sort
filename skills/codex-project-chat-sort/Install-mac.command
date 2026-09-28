#!/bin/bash
cd -- "$(dirname -- "$0")" || exit 1
NODE="$(command -v node)"
if [ -z "$NODE" ]; then
  for candidate in /opt/homebrew/bin/node /usr/local/bin/node; do
    if [ -x "$candidate" ]; then NODE="$candidate"; break; fi
  done
fi
if [ -z "$NODE" ]; then echo 'Node.js 22+ is required.'; read -r -p 'Press Enter to close.'; exit 1; fi
"$NODE" scripts/mac.mjs install "$@"
result=$?
read -r -p 'Press Enter to close.'
exit "$result"
