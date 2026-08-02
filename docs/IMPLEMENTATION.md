# Implementation status

Everything in `cosmic-atlas-qol-master.md`, plus the mobile-app work and the
file split. Run `npm test` to verify — **143 checks**.

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

### Payload

```
shell   26 KB
css     76 KB
js     404 KB
data   104 KB   loaded only when the Chart section is opened
```

Previously 504 KB in one file, all parsed upfront. Now each part caches
separately and the service worker precaches the lot for offline use.

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

## Testing

```
npm test
JSDOM_PATH=/path/to/node_modules/jsdom node smoke.js
```

143 checks across 27 sections. Where a claim can be verified independently it
is: aspect patterns are re-checked against raw angular separations, sign
boundaries against the 2024 equinoxes and solstices, the retrograde window
against the documented April 2024 Mercury retrograde, the ayanamsa against the
known precession rate, and offline resilience by making the browser APIs throw.
