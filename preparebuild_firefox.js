#!/usr/bin/env node

const fs = require("fs");

const manifest = JSON.parse(fs.readFileSync("./src/manifest.json", "utf-8"));

manifest.manifest_version = 2;

manifest.background = { scripts: ["faviconcacher.js"] };
manifest.chrome_settings_overrides = { homepage: "newtab.html" };

const faviconIdx = manifest.permissions.indexOf("favicon");
if (faviconIdx !== -1) manifest.permissions.splice(faviconIdx, 1);

if (!manifest.permissions.includes("tabs")) manifest.permissions.push("tabs");

fs.writeFileSync("./src/manifest.json", JSON.stringify(manifest, null, "\t"));
