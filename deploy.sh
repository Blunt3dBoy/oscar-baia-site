#!/usr/bin/env bash
# Deploy the site to Cloudflare Pages (project: oscar-baia).
# Regenerates Events / Discography from data/*.json, assembles ./dist,
# and uploads it. Requires a one-time `npx wrangler login`.
set -euo pipefail
cd "$(dirname "$0")"

export CLOUDFLARE_ACCOUNT_ID=60bd93daee77fd8089514be25dd02254

VER=$(scripts/make-dist.sh | tail -1)

npx --yes wrangler@latest pages deploy dist \
  --project-name oscar-baia --branch main --commit-dirty=true

echo
echo "Live: https://oscar-baia.pages.dev  ·  https://oscarbaia.com   (v=$VER)"
