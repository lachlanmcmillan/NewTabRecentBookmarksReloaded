## Publishing to Firefox

Release Firefox only installs add-ons signed by Mozilla, so the `.xpi` from the build must be signed through [addons.mozilla.org](https://addons.mozilla.org) before it can be installed permanently.

1. Generate API credentials at https://addons.mozilla.org/developers/addon/api/key/
2. Export them as `WEB_EXT_API_KEY` and `WEB_EXT_API_SECRET`.
3. Bump `version` in `src/manifest.json`. AMO rejects uploads that reuse a version number.
4. Run `npm run lint:firefox` and fix any errors.
5. Run `npm run sign:firefox`. The signed `.xpi` is written to `web-ext-artifacts/`.

The sign script uses the unlisted channel, which signs the file without publishing it on AMO. To publish on the AMO site instead, use `--channel listed`. Because the build is bundled and minified, AMO requires the source code to be uploaded alongside a listed submission.
