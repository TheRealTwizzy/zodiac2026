/* Regenerates data/cities.js.
 *
 *   cd tools && npm install && node build-cities.js
 *
 * Run by hand, never as part of a build — the site itself still has no build
 * step, and nothing in tools/ ships with it. These dependencies exist for the
 * few seconds this script runs; the site stays dependency-free.
 *
 * Sources, all permissively licensed:
 *   all-the-cities            MIT.  GeoNames places with population, name,
 *                             country and coordinates — 135k down to pop 1000.
 *   tz-lookup                 CC0.  Coordinates -> IANA zone, from the tz
 *                             boundary shapes.
 *   countries-states-cities   MIT.  ISO 3166-2 subdivision names, plus cities
 *                             carrying a subdivision code and coordinates.
 *   tools/exonyms.tsv         hand-written. English names GeoNames doesn't
 *                             carry (Munich for München, and so on).
 *
 * The underlying place data is GeoNames, CC BY 4.0 — attributed in the header
 * this script writes and in the README.
 *
 * On regions: GeoNames codes its first-order divisions with FIPS for a lot of
 * countries, while every published subdivision list is keyed by ISO. Matching
 * the two by code resolves barely a third of the rows. So instead each place
 * is matched against the ISO-coded city list — by name first, then by nearest
 * neighbour — which resolves nearly all of them. See resolveRegion().
 *
 * Deliberately NOT used: country-state-city, which carries the same data but
 * is GPL-3.0 and would be a licence problem in an MIT repository.
 */

const fs = require("fs");
const path = require("path");
const allCities = require("all-the-cities");
const tzLookup = require("tz-lookup");
const csc = require("countries-states-cities").default;

/* The one knob. 5000 gives ~49k places, 15000 ~26k, 1000 all 135k. Capitals
   and first-order admin seats come in regardless, so that a small regional
   capital is never missing. */
const POP_MIN = 5000;
const ALWAYS = new Set(["PPLC", "PPLA"]);

/* Nowhere anyone is born today: historical, abandoned and destroyed
   settlements. Only 22 records clear POP_MIN anyway, and their populations are
   the contradictory leftovers you'd expect on a place marked abandoned.
   PPLX — "section of a populated place" — is deliberately NOT here: it covers
   2,456 real places including Navi Mumbai at 2.6 million. */
const WEAK = new Set(["PPLH", "PPLQ", "PPLW", "PPLCH"]);

/* How far a place may sit from the nearest ISO-coded city before we give up
   and leave its region blank. Wide enough for sparse countries, tight enough
   not to reach across a border. */
const MATCH_KM = 60;

/* Per-place matching decides each row on its own, so two towns in the same
   county can come out labelled differently when one of them sits nearer the
   border. Voting fixes that: every place sharing a GeoNames admin code gets
   the name most of them agreed on, as long as the agreement is clear. Below
   this share the group keeps its per-place answers, which is the best we have. */
const VOTE_SHARE = 0.6;

/* Upstream data errors, keyed by GeoNames admin code. countries-states-cities
   files all 120 Northern Irish towns — Belfast, Derry, Antrim — under the
   subdivision code for North Yorkshire, and does it consistently, so no amount
   of cross-checking inside the data can catch it. Verified by hand against the
   GeoNames codes, which do distinguish the four UK countries correctly. */
const OVERRIDE = new Map([
  ["GB/NIR", "Northern Ireland"]
]);

const OUT = path.join(__dirname, "..", "data", "cities.js");
const EXONYMS = path.join(__dirname, "exonyms.tsv");

/* ------------------------------------------------------------- helpers --- */

/* Strip diacritics and case, so "Köln" and "Koln" compare equal. js/11-chart.js
   has the same function; the two must stay in step or a folded alias generated
   here won't match a folded query there. */
function fold(s){
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")     /* đ Đ */
    .replace(/[łŁ]/g, "l")     /* ł Ł */
    .replace(/[øØ]/g, "o")     /* ø Ø */
    .replace(/[æÆ]/g, "ae")    /* æ Æ */
    .replace(/[œŒ]/g, "oe")    /* œ Œ */
    .replace(/[þÞ]/g, "th")    /* þ Þ */
    .replace(/[ðÐ]/g, "d")     /* ð Ð */
    .replace(/ß/g, "ss")            /* ß */
    .replace(/[\u0126\u0127]/g, "h")   /* Maltese H-bar */
    .replace(/[\u018f\u0259]/g, "e")   /* Azerbaijani schwa */
    /* Typographic apostrophes to the one on the keyboard, so N'Djamena and
       Ra's Bayrut are reachable by someone typing them the ordinary way. */
    .replace(/[\u2018\u2019\u02bc\u00b4\u0060]/g, "'")
    /* Turkish dotless i, so Bagcilar is reachable from an ASCII keyboard. */
    .replace(/\u0131/g, "i")
    .toLowerCase();
}

/* Equirectangular approximation. Plenty at these distances and much cheaper
   than haversine when it runs a few hundred thousand times. */
function distKm(aLat, aLon, bLat, bLon){
  const x = (aLon - bLon) * Math.cos((aLat + bLat) * Math.PI / 360);
  const y = aLat - bLat;
  return Math.sqrt(x * x + y * y) * 111.32;
}

function round2(n){ return Math.round(n * 100) / 100; }

/* Intl is the same engine the site uses to turn a zone into an offset, so a
   zone it rejects here would silently produce a wrong chart there. */
function zoneWorks(tz){
  try { new Intl.DateTimeFormat("en", { timeZone: tz }); return true; }
  catch (err){ return false; }
}

/* --------------------------------------------------------------- inputs --- */

/* Registered in both directions. Which of the two names GeoNames actually
   stores varies — it has "Munich" but "Köln", "Prague" but "Kraków" — so a
   one-way list would silently cover half the cases and leave the rest
   unfindable under the name their own residents use. */
function readExonyms(){
  const map = new Map();               /* foldedName|CC -> ["munchen"] */
  function add(name, cc, other){
    const key = fold(name) + "|" + cc;
    map.set(key, (map.get(key) || []).concat([fold(other)]));
  }
  const src = fs.readFileSync(EXONYMS, "utf8").split("\n");
  for (const line of src){
    if (!line.trim() || line.startsWith("#")) continue;
    const parts = line.split("\t").map((p) => p.trim());
    const [local, cc, english] = parts;
    if (!local || !cc || !english) continue;
    add(local, cc, english);
    add(english, cc, local);
  }
  return map;
}

/* Per country: every ISO-coded city bucketed into half-degree cells for
   nearest-neighbour lookup, plus a folded-name map for the exact-match path. */
function buildRegionIndex(){
  const stateName = new Map();         /* "DE/BW" -> "Baden-Württemberg" */
  const byCountry = new Map();         /* "DE" -> { cells, names } */

  for (const country of csc.getAllCountries()){
    const iso2 = country.iso2;
    for (const state of csc.getStatesOfCountry(country.id)){
      stateName.set(iso2 + "/" + state.state_code, state.name);

      for (const city of csc.getCitiesOfState(state.id)){
        const lat = parseFloat(city.latitude), lon = parseFloat(city.longitude);
        if (!isFinite(lat) || !isFinite(lon)) continue;

        let entry = byCountry.get(iso2);
        if (!entry) byCountry.set(iso2, entry = { cells: new Map(), names: new Map() });
        const rec = { lat, lon, code: state.state_code };

        const key = Math.round(lat * 2) + "," + Math.round(lon * 2);
        let cell = entry.cells.get(key);
        if (!cell) entry.cells.set(key, cell = []);
        cell.push(rec);

        const n = fold(city.name);
        let named = entry.names.get(n);
        if (!named) entry.names.set(n, named = []);
        named.push(rec);
      }
    }
  }
  return { stateName, byCountry };
}

/* Name match first — the Aachen in Germany is the one in North Rhine-
   Westphalia whatever its coordinates round to, and where a name repeats the
   nearest wins. Failing that take whichever ISO-coded city is closest, which
   is nearly always in the same region, since regions are far larger than the
   gaps between towns. */
function resolveRegion(index, iso2, name, lat, lon){
  const entry = index.byCountry.get(iso2);
  if (!entry) return "";

  const named = entry.names.get(fold(name));
  if (named){
    let best = null, bestD = Infinity;
    for (const r of named){
      const d = distKm(lat, lon, r.lat, r.lon);
      if (d < bestD){ bestD = d; best = r; }
    }
    if (best && bestD <= MATCH_KM) return index.stateName.get(iso2 + "/" + best.code) || "";
  }

  let best = null, bestD = Infinity;
  const cLat = Math.round(lat * 2), cLon = Math.round(lon * 2);
  for (let dy = -1; dy <= 1; dy++){
    for (let dx = -1; dx <= 1; dx++){
      const cell = entry.cells.get((cLat + dy) + "," + (cLon + dx));
      if (!cell) continue;
      for (const r of cell){
        const d = distKm(lat, lon, r.lat, r.lon);
        if (d < bestD){ bestD = d; best = r; }
      }
    }
  }
  if (best && bestD <= MATCH_KM) return index.stateName.get(iso2 + "/" + best.code) || "";
  return "";
}

/* ------------------------------------------------------------------ run --- */

console.log("reading all-the-cities (" + allCities.length + " places)…");
const picked = allCities.filter((c) =>
  (c.population >= POP_MIN && !WEAK.has(c.featureCode)) || ALWAYS.has(c.featureCode));
console.log("  population >= " + POP_MIN + ", plus capitals and admin seats: " + picked.length);

console.log("indexing ISO subdivisions…");
const index = buildRegionIndex();
const exonyms = readExonyms();

const countryName = new Map();
for (const c of csc.getAllCountries()) countryName.set(c.iso2, c.name);

console.log("resolving time zones and regions…");
const rows = [];
let noTz = 0, noCountry = 0, noRegion = 0;

for (const c of picked){
  const lon = c.loc.coordinates[0], lat = c.loc.coordinates[1];

  let tz = "";
  try { tz = tzLookup(lat, lon) || ""; } catch (err){ tz = ""; }
  /* A place we can't time-zone correctly yields a wrong Ascendant, which is
     worse than not offering it at all. Drop it. */
  if (!tz || !zoneWorks(tz)){ noTz++; continue; }

  const country = countryName.get(c.country);
  if (!country){ noCountry++; continue; }

  const region = resolveRegion(index, c.country, c.name, lat, lon);

  /* Alternative names, pipe-separated, emitted only when there is something
     to say. The FIRST entry is always the accent-folded name, which is what
     lets the site recover a foldable key without running normalize() over
     every row at load. Any English exonym follows it. */
  const lower = c.name.toLowerCase();
  const folded = fold(c.name);
  const ex = (exonyms.get(folded + "|" + c.country) || [])
    .filter((e) => e !== folded);
  const alts = (folded !== lower || ex.length) ? [folded].concat(ex) : [];

  rows.push({
    name: c.name, country, lat: round2(lat), lon: round2(lon), tz, region,
    alias: Array.from(new Set(alts)).join("|"), pop: c.population, id: c.cityId,
    admin: c.country + "/" + c.adminCode,
    key: folded + "|" + c.country + "|" + region
  });
}

console.log("  dropped, unusable time zone: " + noTz);
console.log("  dropped, unknown country: " + noCountry);

/* Vote each GeoNames admin area on to a single region name. */
const ballots = new Map();
for (const r of rows){
  let box = ballots.get(r.admin);
  if (!box) ballots.set(r.admin, box = new Map());
  box.set(r.region, (box.get(r.region) || 0) + 1);
}
const elected = new Map();
let decided = 0;
for (const [admin, box] of ballots){
  const override = OVERRIDE.get(admin);
  if (override){ elected.set(admin, override); decided++; continue; }
  let best = "", bestN = 0, total = 0;
  for (const [name, n] of box){
    total += n;
    if (name && n > bestN){ best = name; bestN = n; }
  }
  if (best && bestN / total >= VOTE_SHARE){ elected.set(admin, best); decided++; }
}
for (const r of rows){
  const won = elected.get(r.admin);
  if (won) r.region = won;
  r.key = fold(r.name) + "|" + r.admin.split("/")[0] + "|" + r.region;
}
console.log("  admin areas: " + ballots.size + ", agreed on a name: " + decided +
  " (" + (100 * decided / ballots.size).toFixed(1) + "%), " +
  OVERRIDE.size + " corrected by hand");
noRegion = rows.filter((r) => !r.region).length;

/* GeoNames carries near-duplicate records for the same settlement (a PPL and
   a PPLA a few hundred metres apart). Keep the most populous of each. */
const bestByKey = new Map();
for (const r of rows){
  const prev = bestByKey.get(r.key);
  if (!prev || r.pop > prev.pop) bestByKey.set(r.key, r);
}
const unique = Array.from(bestByKey.values());
console.log("  merged " + (rows.length - unique.length) + " duplicate records");
console.log("  without a region: " + unique.filter((r) => !r.region).length +
  " (" + (100 * unique.filter((r) => r.region).length / unique.length).toFixed(1) + "% resolved)");

/* Population order becomes array order, so nothing has to ship a population
   figure to rank by: the autocomplete's 40-result cap keeps the places people
   are most likely to mean, and "Sky right now" picks the largest city in the
   browser's zone. The trailing keys make the sort total, so two runs of this
   script always produce byte-identical output. */
unique.sort((a, b) => b.pop - a.pop || a.id - b.id);

/* Index tables — repeating every zone, country and region name in full would
   roughly double the file. Sorted, so a regeneration produces a readable diff
   rather than a reshuffle. */
function table(values, first){
  const list = Array.from(new Set(values)).sort();
  if (first !== undefined){
    const at = list.indexOf(first);
    if (at > 0) list.splice(at, 1);
    if (at !== 0) list.unshift(first);
  }
  const map = new Map();
  list.forEach((v, i) => map.set(v, i));
  return { list, map };
}

const tzs = table(unique.map((r) => r.tz));
const ctry = table(unique.map((r) => r.country));
/* "" pinned to index 0, so "no region" is a plain falsy check on the site. */
const adm = table(unique.map((r) => r.region), "");

const records = unique.map((r) => {
  const t = [JSON.stringify(r.name), ctry.map.get(r.country), r.lat, r.lon,
             tzs.map.get(r.tz), adm.map.get(r.region)];
  if (r.alias) t.push(JSON.stringify(r.alias));
  return "[" + t.join(",") + "]";
});

/* JSON.parse of one string is markedly faster than evaluating the equivalent
   array literal, and on a file this size that is the difference between a
   perceptible pause and none. Wrapped in single quotes, so only backslashes,
   apostrophes and the two line separators JSON allows raw need escaping —
   backslash first, or every apostrophe city breaks. */
function jsString(s){
  return "'" + s.replace(/\\/g, "\\\\").replace(/'/g, "\\'")
    .replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029") + "'";
}

const header = `/* Cosmic Atlas — place data.  GENERATED FILE — DO NOT EDIT BY HAND.
 *
 * Regenerate with:  cd tools && npm install && node build-cities.js
 *
 * Loaded on demand, the first time someone opens the Chart section. It is by
 * far the largest asset here and most visitors never need it, so it does not
 * travel with the page. See ensureCities() in js/11-chart.js.
 *
 * Five globals, in this order:
 *
 *   CITIES_FORMAT  schema version. js/11-chart.js refuses to use a file whose
 *                  version it doesn't know, so a half-updated service worker
 *                  cache reports a load failure instead of quietly reading
 *                  fields that have moved.
 *   TZS      ${String(tzs.list.length).padEnd(6)} IANA time zone names       ["Africa/Abidjan", ...]
 *   CTRY     ${String(ctry.list.length).padEnd(6)} country names             ["Afghanistan", ...]
 *   ADM      ${String(adm.list.length).padEnd(6)} region names, [0] is ""    ["", "Aargau", ...]
 *   CITIES   ${String(unique.length).padEnd(6)} records, each a 6- or 7-tuple:
 *
 *          [ name,        String  "Springfield"
 *            countryIdx,  Number  index into CTRY  -> "United States"
 *            lat,         Number  degrees north, negative south   (-90..90)
 *            lon,         Number  degrees east,  negative west  (-180..180)
 *            tzIdx,       Number  index into TZS   -> "America/Chicago"
 *            admIdx,      Number  index into ADM   -> "Illinois", 0 if none
 *            alias ]      String  optional, pipe-separated alternative names.
 *                                 The first is always the accent-folded name,
 *                                 so the site can build a search key without
 *                                 running normalize() over every record at
 *                                 load; English exonyms follow it, in both
 *                                 directions — "koln|cologne", "rome|roma".
 *
 * Every place with a population of ${POP_MIN.toLocaleString("en-US")} or more, plus every national
 * capital and first-order administrative seat whatever its size.
 *
 * ORDERING IS LOAD-BEARING. Records run population-descending, and that is the
 * only ranking signal shipped: the autocomplete relies on it to choose between
 * equally good name matches, and "Sky right now" relies on it to pick a city
 * for the browser's time zone. Re-sorting this file would silently degrade
 * both.
 *
 * Latitude and longitude are the place centre to two decimals — about a
 * kilometre, far finer than house cusps need. Time zone rules themselves come
 * from the browser's own IANA database via Intl; this file only says which
 * zone a place is in. Regions are ISO 3166-2, blank where no subdivision could
 * be matched, in which case the interface shows name and country alone.
 *
 * Place data from GeoNames (https://www.geonames.org/), CC BY 4.0.
 */
`;

const out = header +
  "var CITIES_FORMAT=2;\n" +
  "var TZS=" + JSON.stringify(tzs.list) + ";\n" +
  "var CTRY=" + JSON.stringify(ctry.list) + ";\n" +
  "var ADM=" + JSON.stringify(adm.list) + ";\n" +
  "var CITIES=JSON.parse(" + jsString("[" + records.join(",") + "]") + ");\n";

fs.writeFileSync(OUT, out);

const kb = Buffer.byteLength(out) / 1024;
console.log("\nwrote data/cities.js — " + unique.length + " places, " +
  (kb / 1024).toFixed(2) + " MB");
console.log("  " + tzs.list.length + " zones, " + ctry.list.length + " countries, " +
  (adm.list.length - 1) + " regions, " +
  unique.filter((r) => r.alias).length + " with search aliases");
