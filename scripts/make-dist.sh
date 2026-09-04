#!/usr/bin/env bash
# Regenerate index.html from data/*.json and assemble ./dist (deploy-ready).
# Does NOT deploy. Prints the version stamp on the last line.
set -euo pipefail
cd "$(dirname "$0")/.."

VER="$(date +%Y%m%d%H%M%S)$(( RANDOM % 100 ))"

node scripts/build.mjs 1>&2

rm -rf dist && mkdir dist
rsync -a --delete \
  --exclude 'dist/' --exclude 'node_modules/' --exclude 'scripts/' --exclude 'data/' \
  --exclude 'README.md' --exclude 'DEPLOY.md' --exclude 'AUTOMATION.md' --exclude 'deploy.sh' \
  --exclude 'package.json' --exclude 'package-lock.json' \
  --exclude '.wrangler/' --exclude '.git/' --exclude '.github/' --exclude '.DS_Store' --exclude '.gitignore' \
  ./ ./dist/ 1>&2

perl -pi -e "s{(/assets/(?:css/style\.css|js/i18n\.js|js/main\.js))(\?v=[0-9]+)?}{\$1?v=$VER}g" dist/index.html

echo "$VER"
