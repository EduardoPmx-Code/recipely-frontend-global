#!/bin/sh
set -e

ENV_CONFIG_FILE="/usr/share/nginx/html/env-config.js"

cat > "$ENV_CONFIG_FILE" <<EOF
window.__ENV__ = {
  API_URL: "${API_URL:-/api/}",
  WAITER_API_URL: "${WAITER_API_URL:-/waiter-api/api/}"
};
EOF

echo "✅ env-config.js generado:"
cat "$ENV_CONFIG_FILE"

exec nginx -g "daemon off;"