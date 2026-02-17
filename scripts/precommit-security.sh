#!/usr/bin/env bash
set -euo pipefail

echo "[security] running pre-commit checks"

npm run -s security:audit || {
  echo "[security] npm audit failed"
  exit 1
}

if command -v gitleaks >/dev/null 2>&1; then
  gitleaks detect --source . --no-git
else
  echo "[security] gitleaks not installed, skipping secret scan"
fi

echo "[security] pre-commit checks passed"
