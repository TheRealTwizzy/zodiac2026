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
 *   tools/geonames-admin1.tsv  GeoNames' own admin1 table, CC BY 4.0, vendored.
 *   tools/countries.tsv        ISO 3166 country names, readable forms.
 *   tools/exonyms.tsv         hand-written. English names GeoNames doesn't
 *                             carry (Munich for München, and so on).
 *
 * The underlying place data is GeoNames, CC BY 4.0 — attributed in the header
 * this script writes and in the README.
 *
 * On regions: they are LOOKED UP, never inferred. Every place carries a
 * GeoNames adminCode, and tools/geonames-admin1.tsv is GeoNames' own table of
 * what those codes mean, so the division a place belongs to is a fact read out
 * of a file. An earlier version guessed instead — name-match, then nearest
 * neighbour within 60 km, then a majority vote — and guessed wrong often
 * enough to label 45 Jiangsu cities including Nanjing "Taiwan Province,
 * People's Republic of China", Tianjin as Hebei, and Bogota as Cundinamarca.
 *
 * The authoritative name is not always the readable one — GeoNames says
 * "Latium" for Lazio and "Jiangsu Sheng" for Jiangsu. Display names therefore
 * come from a small, explicit layer on top (regions.tsv plus two mechanical
 * rules), so readability is a reviewable decision rather than a side effect.
 *
 * Deliberately NOT used: country-state-city, which is GPL-3.0 and would be a
 * licence problem in an MIT repository.
 */

const fs = require("fs");
const path = require("path");
const allCities = require("all-the-cities");
const tzLookup = require("tz-lookup");

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

const OUT = path.join(__dirname, "..", "data", "cities.js");
const EXONYMS = path.join(__dirname, "exonyms.tsv");
const ADMIN1  = path.join(__dirname, "geonames-admin1.tsv");
const REGIONS = path.join(__dirname, "regions.tsv");
const COUNTRIES = path.join(__dirname, "countries.tsv");

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
    .toLowerCase()
    /* Abbreviations people actually type. 306 places begin "Saint" and 27
       begin "St."; without this neither form finds the other, and
       "st petersburg" answers with Florida rather than Russia. */
    .replace(/\bst\.?\s+/g, "saint ")
    .replace(/\bste\.?\s+/g, "sainte ")
    .replace(/\bsankt\s+/g, "saint ")
    .replace(/\bmt\.?\s+/g, "mount ")
    .replace(/\bft\.?\s+/g, "fort ")
    ;
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

/* One line per "<country>.<adminCode>", straight from GeoNames. */
function readAdmin1(){
  const map = new Map();
  for (const line of fs.readFileSync(ADMIN1, "utf8").split("\n")){
    if (!line || line.startsWith("#")) continue;
    const [key, name] = line.split("\t");
    if (key && name) map.set(key.trim(), name.trim());
  }
  return map;
}

/* Readability layer. GeoNames names a division the way its own gazetteer does,
   which is not always how an English speaker would: "Latium" for Lazio,
   "Jiangsu Sheng" for Jiangsu. Two mechanical rules plus an explicit file. */
function readRegionNames(){
  const map = new Map();
  if (!fs.existsSync(REGIONS)) return map;
  for (const line of fs.readFileSync(REGIONS, "utf8").split("\n")){
    if (!line.trim() || line.startsWith("#")) continue;
    const [key, name] = line.split("\t").map((x) => (x || "").trim());
    if (key && name) map.set(key, name);
  }
  return map;
}

function displayRegion(key, authoritative, preferred){
  if (preferred.has(key)) return preferred.get(key);
  return authoritative
    /* Romanised Chinese generics: Sheng = province, Shi = municipality,
       Zizhiqu = autonomous region. English drops all three. */
    .replace(/\s+(Sheng|Shi|Zizhiqu)$/, "")
    /* GeoNames suffixes a bare disambiguator on a handful of entries. */
    .replace(/\s+\(general\)$/i, "");
}

/* ------------------------------------------------------------------ run --- */

console.log("reading all-the-cities (" + allCities.length + " places)…");
const picked = allCities.filter((c) =>
  (c.population >= POP_MIN && !WEAK.has(c.featureCode)) || ALWAYS.has(c.featureCode));
console.log("  population >= " + POP_MIN + ", plus capitals and admin seats: " + picked.length);

console.log("reading the admin1 table…");
const admin1 = readAdmin1();
const preferredRegion = readRegionNames();
const exonyms = readExonyms();

const countryName = new Map();
for (const line of fs.readFileSync(COUNTRIES, "utf8").split("\n")){
  if (!line.trim() || line.startsWith("#")) continue;
  const [iso, name] = line.split("\t").map((x) => (x || "").trim());
  if (iso && name) countryName.set(iso, name);
}

console.log("resolving time zones and looking up regions…");
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

  /* Looked up, not inferred. No entry means no region — the interface shows
     name and country, which is honest, rather than a nearby guess. */
  const adminKey = c.country + "." + c.adminCode;
  const authoritative = admin1.get(adminKey) || "";
  const region = authoritative ? displayRegion(adminKey, authoritative, preferredRegion) : "";
  if (!region) noRegion++;

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
    key: folded + "|" + c.country + "|" + region
  });
}

console.log("  dropped, unusable time zone: " + noTz);
console.log("  dropped, unknown country: " + noCountry);
console.log("  no admin1 entry, region left blank: " + noRegion);

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
