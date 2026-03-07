#!/usr/bin/env bash
set -euo pipefail

REPO="KaustubhPatange/excalidraw-nextcloud"
NC_ROOT="${NC_ROOT:-/var/www/html}"
CUSTOM_APPS="$NC_ROOT/custom_apps"
CONFIG="$NC_ROOT/config/mimetypemapping.json"

if [ ! -f "$NC_ROOT/occ" ] || [ ! -f "$NC_ROOT/config/config.php" ]; then
  echo "Error: this does not look like a Nextcloud installation (checked $NC_ROOT)."
  echo "Run this script inside the Nextcloud container, or set NC_ROOT to the correct path."
  exit 1
fi

echo "Fetching latest release..."

LATEST_TAG=$(curl -fsSLI -o /dev/null -w '%{url_effective}' \
  "https://github.com/$REPO/releases/latest" | grep -o '[^/]*$')

if [ -z "$LATEST_TAG" ] || [ "$LATEST_TAG" = "latest" ]; then
  echo "Error: could not determine the latest release tag. Make sure a published release exists."
  exit 1
fi

DOWNLOAD_URL="https://github.com/$REPO/releases/download/$LATEST_TAG/excalidraw-${LATEST_TAG}.tar.gz"

echo "Downloading $LATEST_TAG..."
curl -fsSL "$DOWNLOAD_URL" -o /tmp/excalidraw.tar.gz

echo "Installing to $CUSTOM_APPS/excalidraw..."
rm -rf "$CUSTOM_APPS/excalidraw"
tar -xzf /tmp/excalidraw.tar.gz -C "$CUSTOM_APPS"
rm /tmp/excalidraw.tar.gz

echo "Updating MIME type mapping..."
if [ ! -f "$CONFIG" ]; then
  echo '{"excalidraw":["application/vnd.excalidraw+json"]}' > "$CONFIG"
else
  php -r "
    \$f = '$CONFIG';
    \$m = json_decode(file_get_contents(\$f), true) ?: [];
    \$m['excalidraw'] = ['application/vnd.excalidraw+json'];
    file_put_contents(\$f, json_encode(\$m, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
  "
fi

echo "Enabling app..."
php "$NC_ROOT/occ" app:enable excalidraw

echo "Done. Excalidraw app installed successfully."
