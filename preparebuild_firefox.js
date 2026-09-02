#!/usr/bin/env node

const fs = require('fs');

const manifest = JSON.parse(fs.readFileSync('./src/manifest.json', 'utf-8'));

manifest.manifest_version = 2;

manifest.browser_specific_settings = {
  gecko: {
    id: 'newtabrecentbookmarksreloaded@lachlanmcmillan.github.io',
    strict_min_version: '142.0',
    data_collection_permissions: { required: ['none'] },
  },
};
manifest.background = { scripts: ['faviconcacher.js'], type: 'module' };
manifest.chrome_settings_overrides = { homepage: 'newtab.html' };

const faviconIdx = manifest.permissions.indexOf('favicon');
if (faviconIdx !== -1) manifest.permissions.splice(faviconIdx, 1);

if (!manifest.permissions.includes('tabs')) manifest.permissions.push('tabs');

fs.writeFileSync('./dist/manifest.json', JSON.stringify(manifest, null, '\t'));

const { execSync } = require('child_process');
const xpi = `new-tab-recent-bookmarks-${manifest.version}.xpi`;
fs.rmSync(`./dist/${xpi}`, { force: true });
execSync(`zip -r -X ${xpi} . -x '.*' '*.xpi'`, {
  cwd: './dist',
  stdio: 'inherit',
});
console.log(`Packaged dist/${xpi}`);
