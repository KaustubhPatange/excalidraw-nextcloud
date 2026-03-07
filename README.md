# Nextcloud Excalidraw

A personal Nextcloud app that registers as a file handler for `.excalidraw` files. Clicking any `.excalidraw` file in the Files app opens a full-screen Excalidraw editor. Changes are automatically saved back to the file via WebDAV with a 2-second debounce. The file is also saved when closing the editor.

No collaboration, no Excalidraw Plus features. Built for personal use.

Compatible with Nextcloud 28 to 30.

<video src="assets/demo.mp4" controls width="100%"></video>

---

## Installing into Nextcloud

### Option 1: Install script (recommended)

Run the following command inside your Nextcloud container. It will download the latest release, extract it to `custom_apps/`, register the MIME type, and enable the app.

```bash
curl -fsSL https://raw.githubusercontent.com/KaustubhPatange/excalidraw-nextcloud/master/install.sh | bash
```

If your Nextcloud root is not `/var/www/html`, set `NC_ROOT` before running:

```bash
NC_ROOT=/path/to/nextcloud curl -fsSL https://raw.githubusercontent.com/KaustubhPatange/excalidraw-nextcloud/master/install.sh | bash
```

### Option 2: Manual steps

1. Download the latest `excalidraw-v*.tar.gz` from the [Releases](https://github.com/KaustubhPatange/excalidraw-nextcloud/releases) page.

2. Extract it into your Nextcloud `custom_apps/` directory. The archive extracts to a folder named `excalidraw`, which is required:

   ```bash
   tar -xzf excalidraw-v*.tar.gz -C /var/www/html/custom_apps
   ```

3. Register the `.excalidraw` MIME type. Add the following to `config/mimetypemapping.json` in your Nextcloud root (create the file if it does not exist):

   ```json
   {
     "excalidraw": ["application/vnd.excalidraw+json"]
   }
   ```

   If the file already contains other entries, add the `excalidraw` key alongside them.

4. Enable the app:

   ```bash
   php /var/www/html/occ app:enable excalidraw
   ```

   Or enable it through the Admin panel under Apps > Your Apps.

---

## Building from Source

Requirements: Node.js 20+

```bash
npm install
npm run build
```

This produces a `js/` directory containing the compiled bundle and Excalidraw fonts. To install the built output manually, copy the app directory into `custom_apps/excalidraw/` and follow steps 3 and 4 from the manual install above.

---

## Development Workflow

Run webpack in watch mode to rebuild on every file change:

```bash
npm run dev
```

---

## How It Works

- `appinfo/info.xml` declares the app metadata and Nextcloud version constraints.
- `lib/AppInfo/Application.php` registers an event listener on `LoadAdditionalScriptsEvent`, which fires whenever the Nextcloud Files page loads. The listener injects the compiled JS bundle into the page.
- `src/fileaction.jsx` registers a `FileAction` with the Nextcloud Files API that matches any file ending in `.excalidraw`. When triggered, it mounts a full-screen React overlay containing the Excalidraw component. The file is loaded via a WebDAV GET request and saved via WebDAV PUT on every change (debounced 2 seconds) and again when the editor is closed.
- Fonts are bundled locally under `js/fonts/` and served from the same origin to satisfy Nextcloud's Content Security Policy.
