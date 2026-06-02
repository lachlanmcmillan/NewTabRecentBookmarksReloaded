#!/usr/bin/env node

const fs = require("fs");

const manifest = JSON.parse(fs.readFileSync("./src/manifest.json", "utf-8"));

manifest.manifest_version = 3;

delete manifest.background;
delete manifest.chrome_settings_overrides;

const tabsIdx = manifest.permissions.indexOf("tabs");
if (tabsIdx !== -1) manifest.permissions.splice(tabsIdx, 1);

if (!manifest.permissions.includes("favicon"))
  manifest.permissions.push("favicon");

fs.writeFileSync("./src/manifest.json", JSON.stringify(manifest, null, "\t"));
