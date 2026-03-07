# Nextcloud Excalidraw

A personal Nextcloud app that registers as a file handler for `.excalidraw` files. Clicking any `.excalidraw` file in the Files app opens a full-screen Excalidraw editor. Changes are automatically saved back to the file via WebDAV with a 2-second debounce.

No collaboration, no Excalidraw Plus features. Built for personal use.

Compatible with Nextcloud 28 to 30.

---

## Requirements

- Node.js 18+
- A running Nextcloud instance with access to its `custom_apps/` directory

---

## Building

Install dependencies and build the frontend bundle:

```
npm install
npm run build
```

This produces a `js/` directory containing the compiled bundle and Excalidraw fonts.

---

## Installing into Nextcloud

1. Copy the entire app directory into your Nextcloud `custom_apps/` folder and name it `excalidraw`:

   ```
   cp -rp /path/to/nextcloud-excalidraw /path/to/nextcloud/custom_apps/excalidraw
   ```

   The app ID is `excalidraw`, so the folder name must match exactly.

2. Register the `.excalidraw` MIME type so Nextcloud recognizes the file format. Add the following to `config/mimetypemapping.json` in your Nextcloud root (create the file if it does not exist):

   ```json
   {
     "excalidraw": ["application/vnd.excalidraw+json"]
   }
   ```

3. Enable the app via the Nextcloud CLI:

   ```
   php occ app:enable excalidraw
   ```

   Or enable it through the Admin panel under Apps > Your Apps.

4. If Nextcloud is running inside Docker and the `custom_apps/` directory is bind-mounted to the host, copy the built `js/` output into the app's folder on the host after each build:

   ```
   cp -rp js/ /path/to/nextcloud/custom_apps/excalidraw/js/
   ```

---

## Development Workflow

Run webpack in watch mode to rebuild on every file change:

```
npm run dev
```

To automatically sync the built `js/` output to your Nextcloud instance after each rebuild, run the sync script in a separate terminal. Update the destination path inside `sync.mjs` to point to your Nextcloud `custom_apps/excalidraw/js/` directory, then run:

```
npm run sync
```

---

## How It Works

- `appinfo/info.xml` declares the app metadata and Nextcloud version constraints.
- `lib/AppInfo/Application.php` registers an event listener on `LoadAdditionalScriptsEvent`, which fires whenever the Nextcloud Files page loads. The listener injects the compiled JS bundle into the page.
- `src/fileaction.jsx` registers a `FileAction` with the Nextcloud Files API that matches any file ending in `.excalidraw`. When triggered, it mounts a full-screen React overlay containing the Excalidraw component. The file is loaded via a WebDAV GET request and saved via WebDAV PUT on every change (debounced 2 seconds).
- Fonts are bundled locally under `js/fonts/` and served from the same origin to satisfy Nextcloud's Content Security Policy.
