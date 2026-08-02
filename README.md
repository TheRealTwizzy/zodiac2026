# Cosmic Atlas

An interactive atlas of the zodiac — twelve signs, sixteen celestial bodies,
twelve houses, the aspect geometry that connects them, and a birth chart
computed from a planetary theory fitted to NASA/JPL's DE421 ephemeris.

Astrology is presented here as a symbolic tradition and a piece of cultural
history, not as a predictive science. Sky positions are matters of fact; the
labels attached to them are matters of tradition, and the site keeps those two
things visibly apart.

## Running it

**Simplest — no tooling at all.** Open `index.html` in any browser.
Everything works offline: no CDN, no web fonts, no analytics, no network calls
of any kind.

**Recommended — over http.**

```
node serve.js          # http://localhost:8080
node serve.js 3000     # pick another port
```

`serve.js` uses only node's built-in modules and behaves the same in
PowerShell, cmd and any POSIX shell.

`serve.js` uses only node's built-in modules. Serving over http rather than
`file://` gets you two things some browsers restrict on local files:

- section history, so Back walks between sections rather than leaving the site
- `localStorage`, so birth data, quiz scores and filter state persist

Both degrade gracefully on `file://` — history falls back to plain hash
assignment, and storage failures are swallowed — so nothing breaks either way.

## Install it

It's a PWA. Over http you'll get an install prompt; once installed it runs
standalone with no browser chrome and works with no network at all — the
service worker precaches every asset. `manifest.json` also registers shortcuts
straight to the chart, the wheel and the quiz.

## Layout

```
index.html                markup shell, ~26 KB
css/atlas.css             every style
js/01-astro.js            positional astronomy engine
js/02-signs-plain.js      plain-language layer over the sign data
js/03-bodies.js           the sixteen celestial bodies
js/04-houses.js           the twelve houses
js/05-glossary.js         glossary entries
js/06-history.js          Sky & Story content
js/07-quiz.js             quiz bank
js/08-signs-wheel.js      sign data and the interactive wheel
js/09-site-core.js        router, search, theme, mobile shell
js/10-planets-houses-aspects.js
js/11-chart.js            chart calculation and readout
js/12-history-quiz-glossary-tour.js
js/13-boot.js             starts everything
data/cities.js            ~3,000 place records, loaded on demand
sw.js                     service worker (precache, cache-first)
manifest.json             PWA manifest
icon.svg / icon-maskable.svg / og.svg
serve.js                  dependency-free static server
smoke.js                  headless test suite
docs/IMPLEMENTATION.md    what was built, and what was deliberately left
```

No build step, no bundler, no framework. The `js/` files are plain classic
scripts, numbered because they execute in order and later files depend on
earlier ones. Splitting them out means the browser caches each part separately
and the shell stays tiny.

`data/cities.js` is loaded lazily rather than upfront. At ~100 KB it is the
largest asset in the project and only the Chart section needs it, so it loads
the first time someone opens that section. It arrives via a dynamic `<script>` tag
rather than `fetch()` — deliberately, because `fetch` of a local file is
blocked by CORS on `file://` and a classic script tag is not. A failed load
shows a recoverable message rather than a dead form.

## Tests

```
npm install     # jsdom, the only dependency, and only for tests
npm test
```

Or against a jsdom installed elsewhere. Bash:

```bash
JSDOM_PATH=/path/to/node_modules/jsdom node smoke.js
```

PowerShell — the `VAR=value command` prefix is Bash syntax and won't work, so
set it as its own statement:

```powershell
$env:JSDOM_PATH = "C:\path\to\node_modules\jsdom"
node smoke.js
```

**147 checks.** The suite drives the real page in a DOM and tests behaviour,
not just that files parse. Where a claim can be checked independently it is:
aspect patterns are re-verified against the raw angular separations, sign
boundaries against the 2024 equinoxes and solstices, the retrograde window
against the documented April 2024 Mercury retrograde, the ayanamsa against the
known precession rate, and offline resilience by making `history` and
`localStorage` throw mid-run. It finishes with an end-to-end pass that renders
every section and walks a full user journey.

CI runs it on every push and pull request.

## On mobile

Below 820px the site switches to an app shell rather than a page: a fixed
bottom tab bar, safe-area padding for notches and home indicators, bottom
sheets instead of centred dialogs, glossary definitions as a sheet rather than
a floating tooltip, 44px minimum touch targets, press states instead of hover,
a top bar that gets out of the way as you read, and horizontal swipe to page
between sections.

## Themes

Dark by default, light available from the header, and it follows your OS until
you choose explicitly. The whole palette is CSS custom properties, so the light
theme is a variable swap rather than a second stylesheet.

## Notes on accuracy

- Positions are checked against DE421 to better than 20 arcseconds.
- Placidus houses are undefined near the poles; the chart detects this, falls
  back to Whole Sign, and says so.
- Historical daylight saving before ~1970 is unreliable in every time zone
  database. Dates that old raise a warning, and clock times that are ambiguous
  or never existed are flagged, with a ±1 hour correction offered.
- Without a birth time the Ascendant, the houses and the four angles are
  withheld rather than computed from a guessed noon.
- Inside 1900–2100 expect agreement with DE421 to better than 20 arcseconds.
  The form accepts 1600–2200; outside the core range expect arcminutes.

The **How to Read This** section in the app spells all of this out, along with
which statements are facts and which are conventions of the tradition.

## Windows / PowerShell

No build step and no shell scripts, so everything runs the same everywhere.
Two Windows-specific gotchas are written up in `docs/PUSHING.md`: PowerShell's
default execution policy blocking the `npm.ps1` shim, and the fact that the
Bash `VAR=value command` prefix isn't valid PowerShell.

## Licence

MIT — see `LICENSE`.

The astronomical algorithms follow standard published methods (Meeus, and the
JPL DE-series fits). The interpretive content is original prose describing a
traditional symbolic system.
