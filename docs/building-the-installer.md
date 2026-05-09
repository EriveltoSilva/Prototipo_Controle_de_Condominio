# Building the Installer

This guide explains how to produce the Windows installer and portable archive for the **Kilamba Controller** desktop application.

---

## Prerequisites

| Requirement | Version | Notes |
|-------------|---------|-------|
| Node.js | 18 or higher | https://nodejs.org |
| npm | included with Node.js | |
| Windows 10 / 11 | x64 | build target is win32-x64 |
| Windows Developer Mode | enabled | required for symlink creation — see step 1 |

## Resume

```bash
npm install
npm run rebuild
npm run package

```
---

## Step 1 — Enable Windows Developer Mode

electron-builder downloads a signing toolchain (`winCodeSign`) that contains macOS symlinks. Windows blocks symlink creation by default. Developer Mode grants that right without requiring administrator access.

1. Open **Settings**
2. Go to **Privacy & Security > For Developers**
3. Turn **Developer Mode** ON
4. Confirm the prompt if one appears
5. **Open a new terminal** — the privilege applies only to sessions started after the setting is enabled

> If you skip this step the build will fail with:
> `ERROR: Cannot create symbolic link — a required privilege is not held by the client`

---

## Step 2 — Install dependencies

From the project root:

```bash
npm install
```

This installs all Node.js dependencies including `electron-builder` and the native `serialport` module.

---

## Step 3 — Rebuild native modules

The `serialport` package contains a native C++ addon (`.node` file) that must be compiled specifically for the Electron version used by this project. Run:

```bash
npm run rebuild
```

This calls `electron-rebuild` targeting the correct Electron ABI. It only needs to be run once after `npm install`, or again after upgrading Electron.

---

## Step 4 — Run the package script

```bash
npm run package
```

What happens internally:

1. **electron-vite build** — compiles the main process, preload bridge, and React renderer into `out/`
2. **electron-builder** — packages `out/` together with production `node_modules`, wraps it in the Electron runtime, rebuilds native modules for the target platform, and produces the installer

The build takes 2-5 minutes on first run (downloads the Electron binary ~111 MB). Subsequent runs reuse the cache and finish in under a minute.

---

## Step 5 — Collect the output

All output is written to the `dist/` folder:

```
dist/
  Kilamba Controller Setup 1.0.0.exe       NSIS installer
  Kilamba Controller Setup 1.0.0.exe.blockmap
  Kilamba Controller-1.0.0-win.zip         Portable archive
  win-unpacked/                            Unpacked app (used by both outputs)
  latest.yml                               Auto-update metadata
  builder-effective-config.yaml            Resolved build config (for debugging)
```

### Installer (`Setup 1.0.0.exe`)

- Double-click to install
- Lets the user choose the installation directory
- Creates a Start Menu shortcut
- Creates a Desktop shortcut
- Uninstaller registered in Windows Add/Remove Programs

### Portable (`-win.zip`)

- Extract anywhere and run `Kilamba Controller.exe` directly
- No installation required
- Useful for sharing on a USB drive or running without admin rights

---

## Build Configuration

The electron-builder configuration lives in the `"build"` field of `package.json`:

```json
"build": {
  "appId": "com.kilamba.controller",
  "productName": "Kilamba Controller",
  "directories": { "output": "dist" },
  "files": ["out/**/*", "package.json"],
  "asarUnpack": [
    "**/node_modules/serialport/**",
    "**/node_modules/@serialport/**",
    "**/node_modules/bindings/**",
    "**/node_modules/node-gyp-build/**"
  ],
  "npmRebuild": true,
  "win": {
    "target": [
      { "target": "nsis", "arch": ["x64"] },
      { "target": "zip",  "arch": ["x64"] }
    ]
  },
  "nsis": {
    "oneClick": false,
    "allowToChangeInstallationDirectory": true,
    "createDesktopShortcut": true,
    "createStartMenuShortcut": true
  }
}
```

### Key options explained

| Option | Purpose |
|--------|---------|
| `asarUnpack` | Extracts native `.node` binaries from the ASAR archive so they can be loaded at runtime |
| `npmRebuild` | Rebuilds native modules for the packaged Electron version before packaging |
| `nsis.oneClick: false` | Shows the installer wizard instead of installing silently to a fixed path |

---

## Troubleshooting

### Cannot create symbolic link

```
ERROR: Cannot create symbolic link — a required privilege is not held by the client
```

Enable Windows Developer Mode as described in Step 1 and open a new terminal.

---

### serialport fails to load at runtime

The `.node` native binary was not unpacked from the ASAR archive. Verify that the `asarUnpack` entries in `package.json` include `**/node_modules/serialport/**` and `**/node_modules/@serialport/**`, then rebuild.

---

### Modules not found after install

Run `npm run rebuild` to recompile native modules for the current Electron ABI.

---

### Build uses stale output

Delete `out/` and `dist/` and run `npm run package` again:

```bash
rm -r out dist
npm run package
```
