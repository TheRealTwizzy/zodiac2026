# Implementation status

Everything in `cosmic-atlas-qol-master.md`, plus the mobile-app work and the
file split, plus the place-data work in batch five. Run `npm test` to verify —
**212 checks**.

---

## Batch one — plumbing

| § | Item |
|---|---|
| 1.1 | `pushState`/`popstate` history — Back walks sections instead of leaving the site |
| 1.2 | `store()`/`load()` persistence layer; birth data, quiz bests, wheel filters, visited sections |
| 1.3 | Section pager footer, generated from `PAGES` |
| 1.4 | Mobile nav edge mask |
| 2 | Scroll-position memory · visited nav dots · unknown-hash toast |
| 3 | Quiz retry-missed and per-category bests · `Esc` clears the wheel · teaching empty state · mobile compatibility matrix · chart loading state · `alert()` removed |
| 4 | Chart aspects truncated to the tightest six |
| 5.1 | **Quiz choice shuffling** — the source data was 52% option B |
| 6.1 | **`CITIES` split to `data/cities.js`**, loaded on first entry to Chart |
| 6.2 | Reduced-motion skips starfield generation entirely |
| 6.3 | Autocomplete debounce · 6.4 dead CSS removed · 6.5 social metadata |
| 7 | Error boundary around `pageRender` · `applySub()` reports failure · reduced motion honoured in JS |

## Batch two — depth and correctness

| § | Item |
|---|---|
| 9.1 | **Aspect pattern detection** — grand trine, T-square, grand cross, yod, stellium. Outer-planet-only stelliums labelled *generational* and sorted below personal figures |
| 5.4 | **Unknown birth time mode** — Ascendant, house ring, angles and every house-dependent line withheld; wheel reorients on 0° Aries |
| 5.3 | **DST anomaly detection** — clock times that happened twice or never happened; pre-1970 warning; ±1 hour correction |
| 10.1 | **Sign-from-date tool** using real Sun positions, not a date table |
| 10.2 | Six notable-chart presets |
| 1.5 | **Shareable chart URLs** carrying coordinates, not a city index · copy link · print stylesheet |

## Batch three — offline, sidereal, accessibility

| § | Item |
|---|---|
| — | **Offline hardening.** `history.pushState` throws on `file://` in some browsers; all writes go through `writeHash()` with a hash-assignment fallback. Verified by making both `history` and `localStorage` throw mid-suite |
| — | **Zero external dependencies**, asserted by test |
| — | `serve.js` — dependency-free static server, path-traversal guarded |
| 9.2 | **Sidereal toggle** (Lahiri). Tropical chart never mutated, so switching back is exact to 1e-12. Implied precession rate measures **50.3 arcsec/year** |
| 2 | Cross-links on sign, house and body names in generated output |
| 8 | Live region · focus into rendered output · focus restored on dialog close · real Tab trap in both modals |
| 10.9 | Keyboard sheet on `?`, `g`+digit to jump, arrows to page |

## Batch four — mobile app, PWA, and the rest

| § | Item |
|---|---|
| — | **PWA.** `manifest.json` (standalone, shortcuts to chart/wheel/quiz), maskable icon, apple meta, cache-first service worker precaching every asset, install prompt with a dismissal that sticks. Registration skipped on `file://`, where it would throw |
| — | **Mobile app shell.** Fixed bottom tab bar (four tabs plus a More sheet), safe-area insets, top bar that hides as you read, bottom sheets for search/shortcuts/More, glossary tooltip as a sheet, 44px touch targets, tap-highlight and double-tap delay suppressed, press states instead of hover, horizontal swipe between sections |
| 10.6 | **Light theme** — palette swap on `[data-theme]`, follows the OS until chosen explicitly, updates `theme-color` |
| 9.3 | **Retrograde context** — steps the ephemeris to find when the retrograde began and when it stations. Matches the April 2024 Mercury window to the day |
| 9.5 / 11 | **How to Read This** section — facts vs. tradition, the computation chain, where it stops being reliable, and the conventions chosen. Linked from the footer |
| 3 | Tour resume from the furthest step · aspect dial magnetic snapping (Shift to override) |
| 2 | Wheel pair deep links (`#/wheel/aries+libra`) · read-progress bar |
| 5.5 | Date range widened to 1600–2200, with an accuracy caveat outside 1900–2100 |
| 7 | Tour spotlight measures after the scroll settles instead of guessing with a timeout |
| — | **File split** — `css/atlas.css` and thirteen ordered `js/` parts. Shell is 26 KB |

## Batch five — place data

| § | Item |
|---|---|
| — | **~50,000 places, up from 3,043.** Every place at population 5,000 or above, plus every capital and first-order admin seat regardless of size. 136 US cities became 7,000-odd; Springfield, Cambridge and the other names the old table simply did not have all resolve |
| — | **A region on every record.** ISO 3166-2, 98.4% resolved. This is what makes eight Springfields distinguishable, and it is why the field now reads `Springfield, Illinois, United States` |
| — | **`tools/build-cities.js`** — generator, run by hand, own manifest so the root install stays jsdom-only. GeoNames places, tz boundary shapes for zones, ISO subdivisions cross-referenced by name then proximity, voted per admin area for consistency |
| — | **Bucketed search.** A two-letter word-prefix index built once on first query. 210 queries run in about 20 ms against 50,000 records — faster than the old linear scan over 3,043 |
| — | **Accent folding and exonyms.** `sao paulo` finds São Paulo, `cologne` finds Köln, `munchen` finds Munich, in both directions |
| — | **Region narrowing.** `springfield il` resolves to exactly one place; the trailing word is only treated as a filter when it actually names a region or country, so `new york` is not read as a place called "new" |
| — | **Opt-in web lookup** for places below the floor — `js/10b-place-web.js`, click-only, one endpoint, no key, asked once and remembered. See the README's Place search section; the privacy claims there are all covered by tests |
| — | **Schema version on the data file.** The service worker revalidates each file independently, so new code could otherwise meet an old data file and read fields that had moved — producing a quietly wrong chart. The version check turns that into an ordinary recoverable load failure |

### Payload

```
shell     26 KB
css       76 KB
js       423 KB
data    2,074 KB   loaded only when the Chart section is opened
```

Previously 504 KB in one file, all parsed upfront. Now each part caches
separately and the service worker precaches the lot for offline use. The place
table is the one large asset, and it is lazy — nobody who does not open the
Chart section ever downloads it.

---

## Deliberately not done

- **§10.3 Transits, §10.4 saved charts and synastry** — real features rather
  than polish; they need product decisions about storing multiple charts and
  what a synastry reading should claim.
- **§10.5 reference tables, §10.7 starred glossary, §10.8 learning path,
  §10.10 entry fork** — additive surface area, none of it blocking.
- **§4 depth toggle, start-page hierarchy, progressive wheel controls** — the
  mobile shell changed the information density enough that these are worth
  re-judging against the new layout rather than building to the old notes.
- **§5.2 expanding the quiz pool** — content work, not engineering.

## Bugs found and fixed along the way

1. Quiz answer position carried the answer — 25 of 48 were option B.
2. `Astro.sunApparent` takes Julian centuries, not a Julian day; the sign tool
   was silently returning undefined signs.
3. `Astro.planetLongitude` returns an object, not a number — the retrograde
   scan compared against `NaN` and always hit its bounds.
4. A double-transform in the dial's snap-distance maths snapped to the wrong
   aspect.
5. `retroContext` didn't check the body was actually retrograde, so it would
   report a span for a direct planet.
6. The focus trap's visibility filter used `offsetParent`, which is unreliable
   inside fixed-position dialogs.
7. `history.pushState` throwing on `file://` would have taken the router down.
8. The place table's schema could skew against the code that reads it. The
   service worker is cache-first and revalidates each file independently, so a
   returning visitor could pair new JS with a cached data file whose fields had
   moved — `TZS[undefined]`, an offset of zero, and a chart that is wrong
   without saying so. Fixed with a schema version the loader checks, plus the
   cache bump.
9. The guard against city records being pasted back into the main sources
   matched a five-field tuple exactly. Adding a sixth field would have made it
   match nothing and pass for ever while checking nothing. It now also asserts
   that no source file declares the data globals at all, which survives the
   next schema change.
10. `countries-states-cities` files all 120 Northern Irish towns — Belfast,
    Derry, Antrim — under the ISO code for North Yorkshire, consistently enough
    that no cross-check inside the data can catch it. Corrected against the
    GeoNames codes, which do separate the four UK countries.
11. The autocomplete's highlighted row was `color:#fff` on a pale lilac
    background, which the light theme made very nearly invisible.
12. The schema check sat only on the load path. A rejected load still leaves
    the globals defined — the script did execute — so a retry resolved straight
    away and ordinary typing walked the incompatible table anyway. The check
    now lives in `citiesLoaded()`, the predicate everything else asks.
13. The search index tokenized on `[a-z0-9]`, which emptied the entry for every
    name written in a non-Latin script with no Latin alias. Thirteen places —
    Зуунмод, Бережани, six Macedonian towns, four Maltese, one Azerbaijani —
    shipped in the table and could not be selected in any script, their own
    included. Now split on separators, so letters in every script survive; Ħ
    and Ə joined the fold so those names also work from an ASCII keyboard.
14. Choosing **Never** for the web lookup rendered the way back only at that
    moment, so after a reload the setting was permanent in practice — while the
    README promised it could be turned back on. It now reappears whenever a
    search comes up short, and the hint line uses one delegated handler rather
    than listeners re-bound on every rewrite.

## Testing

```
npm test
JSDOM_PATH=/path/to/node_modules/jsdom node smoke.js
```

212 checks across 30 sections. Where a claim can be verified independently it
is: aspect patterns are re-checked against raw angular separations, sign
boundaries against the 2024 equinoxes and solstices, the retrograde window
against the documented April 2024 Mercury retrograde, the ayanamsa against the
known precession rate, and offline resilience by making the browser APIs throw.
