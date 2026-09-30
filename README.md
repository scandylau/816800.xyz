# 816800.xyz

Source of [816800.xyz](https://816800.xyz/) — a small set of browser-based tools,
built around one idea: **when a stream plays in VLC but not in the browser, tell you why.**

No build step, no framework, no backend.

## M3U8 / HLS / DASH player

The main tool. Paste a stream URL and play it in the page.

- **HLS** (`.m3u8`) via [hls.js](https://github.com/video-dev/hls.js), **DASH** (`.mpd`) via
  [dash.js](https://github.com/Dash-Industry-Forum/dash.js). dash.js is loaded on demand —
  only when the URL looks like DASH — so an HLS-only visit never pays for it.
- **CORS diagnostics.** When playback fails, the player probes the stream URL for
  `Access-Control-Allow-Origin` and reports what it finds. A browser needs that header
  to read a stream; VLC does not, which is exactly why "it works in VLC" tells you nothing.
- Recently used URLs are kept in `localStorage`. Nothing is uploaded anywhere.

## Other tools

- **Short link** redirect — fully static, the target is encoded into the link itself,
  so there is no database to query and nothing stored server-side.
- **Text utilities** — case converter, camelCase / snake_case / kebab-case,
  word counter, reading time estimate.

## How it is put together

- Plain HTML, hand-written CSS, plain JS. No bundler, no transpile, no package manager.
- Third-party libraries are vendored under `assets/vendor/` (hls.js, dash.js, Plyr)
  rather than pulled from a CDN — the site keeps working regardless of a third party's uptime.
- Bilingual UI (English / Chinese) on a single URL. English is the default and the
  primary language; Chinese lives in `data-zh` attributes and is swapped in by
  `assets/js/i18n.js`.
- Deployed to Cloudflare Pages on every push to `main`.

## Running locally

Any static file server will do:

```bash
python -m http.server 8000
```

Then open <http://localhost:8000>. No install, no build, no environment variables.

Note that the CORS diagnostics are subject to the same rules as any browser: a stream
that refuses your origin will also refuse `localhost`. That is the tool working correctly.

## License

MIT — see [LICENSE](LICENSE).

The vendored libraries under `assets/vendor/` (hls.js, dash.js, Plyr) are distributed
under their own licenses and are not covered by this repository's MIT license.
