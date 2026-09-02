## Publishing to Firefox

Release Firefox only installs add-ons signed by Mozilla, so the `.xpi` from the build must be signed through [addons.mozilla.org](https://addons.mozilla.org) before it can be installed permanently.

1. Generate API credentials at https://addons.mozilla.org/developers/addon/api/key/
2. Put them in `.env` as `WEB_EXT_API_KEY` and `WEB_EXT_API_SECRET` (or export them).
3. Bump `version` in `src/manifest.json`. AMO rejects uploads that reuse a version number.
4. Commit. The source archive is taken from `HEAD`, so it must match what is built.
5. Run `npm run publish:firefox`. Once Mozilla approves the version, the signed `.xpi` is written to `web-ext-artifacts/`.

`publish:firefox` runs the whole pipeline and stops at the first failure:

- `lint:firefox`: typechecks, builds `dist/`, and lints it with `web-ext lint`.
- `source:firefox`: writes `web-ext-artifacts/source.zip` from `git archive HEAD`. AMO requires readable source because the build is bundled and minified.
- `sign:firefox`: uploads `dist/` and the source archive to AMO on the listed channel, which submits the version for review and publishes it once approved.

`amo-metadata.json` holds the listing metadata that AMO requires for a new listed add-on: summary, category, license, and notes for reviewers on how to build. Edit it to change the listing. The script passes it on every submission, and the license applies per version.
