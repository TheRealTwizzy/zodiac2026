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
Everything works offline: no CDN, no web fonts, no analytics, and no network
calls unless you explicitly ask for one. There is exactly one thing that can
reach the network — an optional web search for places too small for the
built-in list — and it only ever happens when you click the button that offers
it. See [Place search](#place-search).

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
js/10b-place-web.js       the opt-in web place lookup — the only network code
js/11-chart.js            chart calculation and readout
js/12-history-quiz-glossary-tour.js
js/13-boot.js             starts everything
data/cities.js            ~50,000 place records, generated, loaded on demand
sw.js                     service worker (precache, cache-first)
manifest.json             PWA manifest
icon.svg / icon-maskable.svg / og.svg
serve.js                  dependency-free static server
smoke.js                  headless test suite
tools/build-cities.js     regenerates data/cities.js — run by hand, not a build
tools/exonyms.tsv         English names the source data doesn't carry
docs/IMPLEMENTATION.md    what was built, and what was deliberately left
```

No build step, no bundler, no framework. The `js/` files are plain classic
scripts, numbered because they execute in order and later files depend on
earlier ones. Splitting them out means the browser caches each part separately
and the shell stays tiny.

`data/cities.js` is loaded lazily rather than upfront. At ~2 MB it is by a wide
margin the largest asset in the project and only the Chart section needs it, so
it loads the first time someone opens that section. It arrives via a dynamic
`<script>` tag rather than `fetch()` — deliberately, because `fetch` of a local
file is blocked by CORS on `file://` and a classic script tag is not. A failed
load shows a recoverable message rather than a dead form.

It is a generated file and carries a schema version. `js/11-chart.js` refuses a
version it does not recognise, so a half-refreshed service worker cache reports
a load failure rather than quietly reading fields that have moved — the sort of
mistake that would produce a wrong chart instead of no chart.

## Place search

The Chart section needs a latitude, a longitude and a time zone. Those come
from `data/cities.js`: every place in the world with a population of 5,000 or
more, plus every national capital and first-order administrative seat whatever
its size — about 50,000 in all, each with its region, so the eight Springfields
in the United States are told apart rather than listed eight times identically.
Type a region or country after the name to narrow it: `springfield il`.

Accents are optional in either direction, and English exonyms work — `cologne`
finds Köln, `munchen` finds Munich.

**The web fallback.** A population floor of 5,000 still leaves out villages,
and someone born in a village should not be told their birthplace does not
exist. So when the built-in list comes up short, the dropdown offers one extra
row: a button to search the web. It is worth being precise about what that
does, because it is the only network request this site can make:

- It happens **only when you click that button**. Never on typing. There is no
  setting that changes this — "always allow" only skips the explanation.
- It sends **only the text you typed**, to Open-Meteo's public geocoder. Not the
  date, not the time, not anything about the chart. No cookies, no account, no
  API key, and the referrer is suppressed.
- The response is never cached — the service worker leaves cross-origin
  requests alone entirely.
- Choose **Never** and the offer disappears for good. It can be turned back on
  from the same line.
- It is hidden when you are offline, and when the page is opened from `file://`.

Everything else keeps working with no network at all. A place found on the web
becomes an ordinary chosen place: it saves, it shares, and a shared link
resolves from the coordinates in the URL without going anywhere.

### Regenerating the place data

```
cd tools && npm install && node build-cities.js
```

`tools/` has its own manifest, so `npm install` at the root still installs
jsdom and nothing else, and CI never sees these packages. Place data is from
[GeoNames](https://www.geonames.org/), CC BY 4.0; regions are ISO 3166-2; time
zones are derived from the tz boundary shapes. The population floor is a single
constant at the top of the script.

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

**183 checks.** The suite drives the real page in a DOM and tests behaviour,
not just that files parse. Where a claim can be checked independently it is:
aspect patterns are re-verified against the raw angular separations, sign
boundaries against the 2024 equinoxes and solstices, the retrograde window
against the documented April 2024 Mercury retrograde, the ayanamsa against the
known precession rate, and offline resilience by making `history` and
`localStorage` throw mid-run. Every one of the 50,000 place records is checked
for shape and range, and every time zone in the file is one `Intl` accepts.
The claims made above about the web lookup are tests, not prose: that typing
never reaches the wire, that the first use asks, that the request carries
nothing but the typed text, and that a failure degrades to a message. It
finishes with an end-to-end pass that renders every section and walks a full
user journey.

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
