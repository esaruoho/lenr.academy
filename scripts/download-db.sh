#!/bin/bash
set -e

# Download database from db.lenr.academy
# Usage:
#   ./scripts/download-db.sh           # Downloads latest version
#   ./scripts/download-db.sh v1.2.3    # Downloads specific version

VERSION=${1:-latest}
BASE_URL="https://db.lenr.academy"
PUBLIC_DIR="public"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Downloading database version: $VERSION${NC}"
echo ""

# Ensure public directory exists
mkdir -p "$PUBLIC_DIR"

# Download database
echo -e "${BLUE}Downloading parkhomov.db...${NC}"
curl -f -L --progress-bar -o "$PUBLIC_DIR/parkhomov.db" "$BASE_URL/$VERSION/parkhomov.db"

# Download metadata
echo -e "${BLUE}Downloading parkhomov.db.meta.json...${NC}"
curl -f -L -o "$PUBLIC_DIR/parkhomov.db.meta.json" "$BASE_URL/$VERSION/parkhomov.db.meta.json"

echo ""
echo -e "${GREEN}Database download complete!${NC}"
echo ""

# Show metadata
if [ -f "$PUBLIC_DIR/parkhomov.db.meta.json" ]; then
  echo "Database info:"
  if command -v jq &> /dev/null; then
    jq '.' "$PUBLIC_DIR/parkhomov.db.meta.json"
  else
    cat "$PUBLIC_DIR/parkhomov.db.meta.json"
  fi
  echo ""
fi

echo -e "${BLUE}Location: $PUBLIC_DIR/parkhomov.db${NC}"
echo -e "${BLUE}Ready for development: npm run dev${NC}"
echo ""
