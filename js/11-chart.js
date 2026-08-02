/* ============================================================================
   CHART THE REAL SKY
   ==========================================================================*/

var SIGN_GLYPH = SIGNS.map(function(s){ return s.glyph; });
var BODY_ORDER = ["Sun","Moon","Mercury","Venus","Mars","Jupiter","Saturn",
                  "Uranus","Neptune","Pluto","NorthNode"];
var BODY_ID = { Sun:"sun", Moon:"moon", Mercury:"mercury", Venus:"venus", Mars:"mars",
  Jupiter:"jupiter", Saturn:"saturn", Uranus:"uranus", Neptune:"neptune", Pluto:"pluto" };
var NODE_GLYPH = "☊";

function signOf(lon){ return SIGNS[Math.floor(((lon % 360) + 360) % 360 / 30)]; }
function degInSign(lon){ return ((lon % 360) + 360) % 360 % 30; }
function fmtPos(lon){
  var d = degInSign(lon), deg = Math.floor(d), m = Math.round((d - deg) * 60);
  if (m === 60){ m = 0; deg += 1; }
  return deg + "° " + (m < 10 ? "0" : "") + m + "′";
}
function fmtFull(lon){ var s = signOf(lon); return s.glyph + " " + fmtPos(lon) + " " + s.name; }

/* ------------------------------------------------------------ time zones --- */

function tzOffsetMin(tz, instantMs){
  try {
    var dtf = new Intl.DateTimeFormat("en-US", { timeZone:tz, hour12:false,
      year:"numeric", month:"2-digit", day:"2-digit",
      hour:"2-digit", minute:"2-digit", second:"2-digit" });
    var p = {};
    dtf.formatToParts(new Date(instantMs)).forEach(function(x){ p[x.type] = x.value; });
    var asUTC = Date.UTC(+p.year, +p.month - 1, +p.day, (+p.hour) % 24, +p.minute, +p.second);
    return Math.round((asUTC - instantMs) / 60000);
  } catch (err){ return 0; }
}
function localToUTCms(y, mo, d, h, mi, tz){
  var naive = Date.UTC(y, mo - 1, d, h, mi);
  var guess = naive;
  for (var i = 0; i < 4; i++){
    var off = tzOffsetMin(tz, guess);
    var next = naive - off * 60000;
    if (next === guess) break;
    guess = next;
  }
  return guess;
}

/* ------------------------------------------------------------ place data - *
   The 50,000-place table is ~2 MB and only the Chart section needs it, so it
   lives in data/cities.js and is pulled in the first time someone opens this
   page. A classic <script> tag rather than fetch(), so the site still works
   when the repo is opened straight off disk with file:// — fetch would be
   blocked by CORS there, a script tag is not.                                */

var CITIES_SRC = "data/cities.js";
var CITIES_WANT = 2;          /* the schema version this file knows how to read */
var citiesPromise = null;

function citiesLoaded(){ return typeof CITIES !== "undefined"; }

function ensureCities(){
  if (citiesPromise) return citiesPromise;
  citiesPromise = new Promise(function(resolve, reject){
    if (citiesLoaded()) return resolve();
    var s = document.createElement("script");
    s.src = CITIES_SRC;
    s.async = true;
    s.onload = function(){
      if (!citiesLoaded()) return reject(new Error("cities.js loaded but defined no CITIES"));
      /* The service worker serves cache-first and revalidates each file on its
         own schedule, so a returning visitor can briefly pair this script with
         a cities.js from an earlier deploy. Reading moved fields out of an old
         record would produce a chart that is quietly wrong rather than one that
         fails — much the worse outcome — so refuse the file instead. */
      if (typeof CITIES_FORMAT === "undefined" || CITIES_FORMAT !== CITIES_WANT){
        return reject(new Error("cities.js is a different format"));
      }
      resolve();
    };
    s.onerror = function(){ reject(new Error("could not load " + CITIES_SRC)); };
    document.head.appendChild(s);
  });
  /* let a failed load be retried on the next attempt */
  citiesPromise.catch(function(){ citiesPromise = null; });
  return citiesPromise;
}

function setPlaceStatus(msg, tone){
  var hint = $("#cPlaceHint");
  if (!hint) return;
  hint.innerHTML = tone
    ? '<span style="color:' + (tone === "warn" ? "#ffd35e" : "var(--muted)") + '">' + msg + "</span>"
    : msg;
}

/* ------------------------------------------------------ place autocomplete - */

var chosenCity = null;

/* Accent folding, so "Koln" finds "Köln" and "Sao Paulo" finds "São Paulo".
   tools/build-cities.js applies exactly this transform when it bakes the alias
   field; if the two ever drift apart, folded queries stop matching the folded
   names in the data and the failure is silent. Keep them in step.            */
function fold(s){
  return String(s).normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")    /* đ Đ */
    .replace(/[łŁ]/g, "l")    /* ł Ł */
    .replace(/[øØ]/g, "o")    /* ø Ø */
    .replace(/[æÆ]/g, "ae")   /* æ Æ */
    .replace(/[œŒ]/g, "oe")   /* œ Œ */
    .replace(/[þÞ]/g, "th")   /* þ Þ */
    .replace(/[ðÐ]/g, "d")    /* ð Ð */
    .replace(/ß/g, "ss")           /* ß */
    /* Typographic apostrophes to the one on the keyboard, so N'Djamena and
       Ra's Bayrut are reachable by someone typing them the ordinary way. */
    .replace(/[\u2018\u2019\u02bc\u00b4\u0060]/g, "'")
    /* Turkish dotless i, so Bagcilar is reachable from an ASCII keyboard. */
    .replace(/\u0131/g, "i")
    .toLowerCase();
}

/* Fifty thousand rows is too many to lowercase on every keystroke, so the work
   happens once and the result is reused. Three parallel structures:

     CNAME    every full name a record answers to — the folded name and any
              exonym — each preceded by "|", so "does some whole name start
              with this query" is one indexOf for "|" + query
     CTEXT    every searchable word, space-delimited and space-padded, so
              "does some word start with this query" is one indexOf too
     CBUCKET  two-letter word prefix -> record indices

   CBUCKET is what keeps this fast: a query only ever looks at the few thousand
   records whose name contains a word starting with the same two letters. And
   because it is filled by walking CITIES in order, and CITIES is sorted by
   population, every bucket comes out ranked already — nothing sorts at query
   time.                                                                      */
var CNAME = null, CTEXT = null, CBUCKET = null, CFOLD = null, AFOLD = null;

function buildCityIndex(){
  if (CBUCKET) return;
  var n = CITIES.length;
  CNAME = new Array(n); CTEXT = new Array(n); CBUCKET = Object.create(null);

  for (var i = 0; i < n; i++){
    var c = CITIES[i];
    /* The alias field leads with the folded name whenever it differs from a
       plain lowercasing, which is why this never has to call normalize(). */
    var alias = c[6] || c[0].toLowerCase();
    CNAME[i] = "|" + alias;

    var text = " " + alias.replace(/[^a-z0-9]+/g, " ").trim() + " ";
    CTEXT[i] = text;

    var seen = "";
    var words = text.split(" ");
    for (var w = 0; w < words.length; w++){
      if (words[w].length < 2) continue;
      var p = words[w].slice(0, 2);
      /* one entry per record per bucket, however many words share a prefix */
      if (seen.indexOf("|" + p) >= 0) continue;
      seen += "|" + p;
      (CBUCKET[p] || (CBUCKET[p] = [])).push(i);
    }
  }

  CFOLD = CTRY.map(fold);
  AFOLD = ADM.map(fold);
}

/* Does this look like a region or country someone appended to narrow things
   down — the "il" in "springfield il"? */
function narrowsPlace(t){
  var i;
  for (i = 1; i < AFOLD.length; i++) if (AFOLD[i].indexOf(t) === 0) return true;
  for (i = 0; i < CFOLD.length; i++) if (CFOLD[i].indexOf(t) === 0) return true;
  return false;
}

function placeMatches(i, t){
  var c = CITIES[i];
  return AFOLD[c[5]].indexOf(t) === 0 || CFOLD[c[1]].indexOf(t) === 0;
}

function lookupCities(head, tail){
  var bucket = CBUCKET[head.slice(0, 2)];
  var whole = [], word = [], i, k;

  if (bucket){
    for (k = 0; k < bucket.length && whole.length < 40; k++){
      i = bucket[k];
      if (tail && !placeMatches(i, tail)) continue;
      /* Any full name counts, not just the primary one, so "cologne" ranks
         Köln above the Lombardy village that is actually spelt that way — both
         are whole-name matches, and population decides between them. */
      if (CNAME[i].indexOf("|" + head) >= 0) whole.push(i);
      else if (word.length < 40 && CTEXT[i].indexOf(" " + head) >= 0) word.push(i);
    }
  }
  var out = whole.concat(word);

  /* Typing a country's whole name lists that country's cities, as it always
     has, and now in population order — "france" opens with Paris. It has to be
     the whole name: on a prefix, "fran" would bury Frankfurt under France. */
  if (!tail){
    var country = -1;
    for (i = 0; i < CFOLD.length; i++) if (CFOLD[i] === head){ country = i; break; }
    if (country >= 0){
      var byCountry = [];
      for (i = 0; i < CITIES.length && byCountry.length < 40; i++){
        if (CITIES[i][1] === country) byCountry.push(i);
      }
      for (i = 0; i < out.length; i++) if (byCountry.indexOf(out[i]) < 0) byCountry.push(out[i]);
      out = byCountry;
    }
  }
  return out.slice(0, 40);
}

function searchCities(q){
  if (!citiesLoaded()) return [];
  var qf = fold(q).replace(/\s+/g, " ").trim();
  if (qf.length < 2) return [];
  buildCityIndex();

  /* "springfield il", "cambridge ma", "london, ontario" — without this there
     is no way to tell eight Springfields apart from the keyboard. Only treat
     the last word as a narrowing term if it actually names a region or
     country, or "new york" would search for a place called "new". */
  var m = qf.match(/^(.+?)[\s,]+([^\s,]+)$/);
  if (m && m[1].length >= 2 && narrowsPlace(m[2])){
    var narrowed = lookupCities(m[1].trim(), m[2]);
    if (narrowed.length) return narrowed;
  }
  return lookupCities(qf, "");
}

/* "Illinois, United States", or just "France" where no region is recorded. */
function cityRegion(i){
  var c = CITIES[i], a = ADM[c[5]];
  return (a ? a + ", " : "") + CTRY[c[1]];
}
function cityLabel(i){ return CITIES[i][0] + ", " + cityRegion(i); }

/* The same label from a chosenCity rather than a row index — used for places
   that never came out of the table, like a restored form, a preset or a shared
   link. region and country are both optional. */
function placeLabel(c){
  return [c.name].concat(c.region ? [c.region] : [], c.country ? [c.country] : []).join(", ");
}

var PLACE_HINT = "Time zone and daylight saving are handled automatically";

function wirePlace(){
  var inp = $("#cPlace"), list = $("#cPlaceList");
  /* One list, three kinds of row: a place from the built-in table, a place
     that came back from the web, and the button that offers to go and ask.
     Keeping them in one array is what lets the arrow keys walk the whole
     thing without caring where any given row came from. */
  var rows = [], hi = 0, webBusy = false, lastQuery = "";

  function close(){ list.classList.remove("on"); inp.setAttribute("aria-expanded", "false"); }

  function rowHTML(r, k){
    var cls = k === hi ? "hi" : "";
    if (r.kind === "city"){
      return '<button type="button" data-row="' + k + '" class="' + cls + '">' +
        E(CITIES[r.i][0]) + "<small>" + E(cityRegion(r.i)) + "</small></button>";
    }
    if (r.kind === "web"){
      var tail = [r.w.region, r.w.country].filter(Boolean).join(", ");
      return '<button type="button" data-row="' + k + '" class="web ' + cls + '">' +
        E(r.w.name) + "<small>" + (tail ? E(tail) + " · " : "") + "from the web</small></button>";
    }
    return '<button type="button" data-row="' + k + '" class="ask ' + cls + '">' +
      (webBusy ? "Searching…" : "Search the web for “" + E(r.q) + "”") +
      "<small>sends only that text to open-meteo.com</small></button>";
  }

  function draw(){
    if (!rows.length){ close(); return; }
    list.innerHTML = rows.map(rowHTML).join("");
    list.classList.add("on");
    inp.setAttribute("aria-expanded", "true");
  }

  /* The offer to search the web appears only when the built-in table came up
     thin, and only as a row to click. Nothing here starts a request. */
  function withWebOffer(found, q){
    var out = found.map(function(i){ return { kind:"city", i:i }; });
    if (found.length < 3 && q.length >= 3 && webLookupAvailable()){
      out.push({ kind:"ask", q:q });
    }
    return out;
  }

  function runSearch(){
    var q = inp.value.trim();
    lastQuery = q;
    rows = withWebOffer(searchCities(q), q);
    hi = 0;
    draw();
  }

  /* Even bucketed, a query plus a full dropdown rebuild is more than a phone
     wants to do between keystrokes — and the first query also pays for the
     index. Debounce it. */
  var acTimer = null;
  inp.addEventListener("input", function(){
    chosenCity = null;
    setPlaceStatus(PLACE_HINT);
    clearTimeout(acTimer);
    acTimer = setTimeout(function(){
      if (!citiesLoaded()){
        /* someone typed before the data landed — finish loading, then search */
        setPlaceStatus("Loading places…");
        ensureCities().then(function(){
          setPlaceStatus(PLACE_HINT);
          runSearch();
        }, placeLoadFailed);
        return;
      }
      runSearch();
    }, 120);
  });

  inp.addEventListener("keydown", function(e){
    if (!list.classList.contains("on")) return;
    if (e.key === "ArrowDown"){ hi = Math.min(rows.length - 1, hi + 1); draw(); e.preventDefault(); }
    else if (e.key === "ArrowUp"){ hi = Math.max(0, hi - 1); draw(); e.preventDefault(); }
    else if (e.key === "Enter"){ e.preventDefault(); activate(hi); }
    else if (e.key === "Escape") close();
  });

  list.addEventListener("click", function(e){
    var b = e.target.closest("[data-row]");
    if (b) activate(+b.dataset.row);
  });

  /* The consent buttons live in the hint line, outside the list, so this
     mustn't fire while someone is reaching for them. */
  inp.addEventListener("blur", function(){ setTimeout(close, 160); });

  function activate(k){
    var r = rows[k];
    if (!r) return;
    if (r.kind === "city") return pick(r.i);
    if (r.kind === "web") return pickWeb(r.w);
    if (!webBusy) askWeb(r.q);
  }

  /* region is additive and always optional. Presets, restored localStorage
     from before this change, and shared links in the old format all produce a
     chosenCity without one, so every reader treats it as "" when missing
     rather than assuming it is there. */
  function pick(i){
    if (i == null) return;
    var c = CITIES[i];
    chosenCity = { name:c[0], country:CTRY[c[1]], lat:c[2], lon:c[3], tz:TZS[c[4]],
                   region:ADM[c[5]] || "" };
    inp.value = cityLabel(i);
    close();
    showPlaceCoords(c[2], c[3], TZS[c[4]]);
  }

  /* A place from the web becomes exactly the same object a place from the
     table does. From here on nothing can tell them apart — it saves, it
     shares, and a shared link resolves it from coordinates with no network. */
  function pickWeb(w){
    chosenCity = { name:w.name, country:w.country, lat:w.lat, lon:w.lon, tz:w.tz,
                   region:w.region };
    inp.value = placeLabel(w);
    close();
    showPlaceCoords(w.lat, w.lon, w.tz);
  }

  function askWeb(q){
    if (webConsent() === "always") return doWeb(q);
    askConsent(q);
  }

  /* Asked once, in the hint line rather than a dialog, so it doesn't snatch
     focus in the middle of typing. */
  function askConsent(q){
    var hint = $("#cPlaceHint");
    if (!hint) return;
    hint.innerHTML =
      '<span class="consent">Search the web for this place? Only the text you typed ' +
      'is sent, to open-meteo.com — no cookies, no account, nothing about your chart. ' +
      '<button type="button" class="chip ghost" data-web="once">Search once</button> ' +
      '<button type="button" class="chip ghost" data-web="always">Always</button> ' +
      '<button type="button" class="chip ghost" data-web="never">Never</button></span>';
    announce("Web place search needs your permission.");

    hint.querySelectorAll("[data-web]").forEach(function(b){
      b.addEventListener("click", function(){
        var choice = b.dataset.web;
        if (choice === "never"){
          setWebConsent("never");
          setPlaceStatus("Web place search is off. " +
            '<button type="button" class="chip ghost" data-web="reset">Turn it back on</button>');
          $("#cPlaceHint").querySelector("[data-web]").addEventListener("click", function(){
            setWebConsent("");
            setPlaceStatus(PLACE_HINT);
            inp.focus();
          });
          rows = rows.filter(function(r){ return r.kind !== "ask"; });
          draw();
          return;
        }
        if (choice === "always") setWebConsent("always");
        doWeb(q);
      });
    });
  }

  function doWeb(q){
    webBusy = true;
    draw();
    setPlaceStatus("Searching open-meteo.com…");
    webPlaceSearch(q, function(found){
      webBusy = false;
      /* A slow answer to a query nobody is looking at any more is discarded
         rather than dropped into the list under whatever is being typed now. */
      if (inp.value.trim() !== q) return;
      setPlaceStatus(PLACE_HINT);
      if (!found.length){
        rows = rows.filter(function(r){ return r.kind !== "ask"; });
        setPlaceStatus("Nothing came back for “" + E(q) + "”. Try a nearby larger town.", "warn");
        draw();
        return;
      }
      rows = rows.filter(function(r){ return r.kind === "city"; })
        .concat(found.map(function(w){ return { kind:"web", w:w }; }));
      hi = 0;
      draw();
      announce(found.length + " place" + (found.length === 1 ? "" : "s") + " found on the web.");
    }, function(){
      webBusy = false;
      setPlaceStatus("Couldn’t reach the place search just now. " +
        "The built-in list still works.", "warn");
      rows = rows.filter(function(r){ return r.kind !== "ask"; });
      draw();
    });
  }

  window._pickCityIdx = pick;
  window._placeRows = function(){ return rows; };
  window._placeActivate = activate;
}

function placeLoadFailed(){
  setPlaceStatus("Couldn’t load the place list (" + E(CITIES_SRC) + "). " +
    "Check that file sits next to the page, then reload.", "warn");
}

function showPlaceCoords(lat, lon, tz){
  $("#cPlaceHint").innerHTML = "📍 " + E(Math.abs(lat).toFixed(2)) + "° " + (lat >= 0 ? "N" : "S") +
    ", " + E(Math.abs(lon).toFixed(2)) + "° " + (lon >= 0 ? "E" : "W") + " · " + E(tz);
}

/* ------------------------------------------------------- saved birth data - *
   The form used to reset to 1990-06-15 on every visit. Remember what the
   person last calculated so returning to the page resumes where they were.   */
function saveChartInputs(){
  if (!chosenCity) return;
  store("chartInputs", {
    date: $("#cDate").value,
    time: $("#cTime").value,
    house: $("#cHouse").value,
    city: chosenCity,
    label: $("#cPlace").value,
    noTime: !!($("#cNoTime") && $("#cNoTime").checked),
    shift: timeShiftMin
  });
}

function restoreChartInputs(){
  var s = load("chartInputs", null);
  if (!s || !s.city){
    $("#cDate").value = "1990-06-15";
    $("#cTime").value = "12:00";
    return false;
  }
  $("#cDate").value = s.date || "1990-06-15";
  $("#cTime").value = s.time || "12:00";
  if (s.house) $("#cHouse").value = s.house;
  if ($("#cNoTime")) $("#cNoTime").checked = !!s.noTime;
  timeShiftMin = s.shift || 0;
  syncTimeField();
  chosenCity = s.city;
  $("#cPlace").value = s.label || s.city.name;
  showPlaceCoords(s.city.lat, s.city.lon, s.city.tz);
  return true;
}

/* the time input is meaningless while "I don't know the birth time" is on */
function syncTimeField(){
  var box = $("#cNoTime"), t = $("#cTime");
  if (!box || !t) return;
  t.disabled = box.checked;
  t.style.opacity = box.checked ? ".45" : "";
  t.required = !box.checked;
}

/* --------------------------------------------------- time-quality checks --- *
   localToUTCms() resolves a local clock time to a UTC instant by iterating
   against Intl's offsets. Two things it cannot see, both of which move the
   Ascendant by a whole sign, so both get said out loud rather than absorbed. */

/* Was this local time ambiguous (clocks went back — it happened twice) or
   non-existent (clocks went forward — it never happened at all)? */
function dstAnomaly(y, mo, d, h, mi, tz){
  var naive = Date.UTC(y, mo - 1, d, h, mi);
  var offA = tzOffsetMin(tz, naive - 12 * 3600000);
  var offB = tzOffsetMin(tz, naive + 12 * 3600000);
  if (offA === offB) return null;
  var candidates = [naive - offA * 60000, naive - offB * 60000].filter(function(ms){
    return tzOffsetMin(tz, ms) === (naive - ms) / 60000;
  });
  if (candidates.length > 1) return "ambiguous";
  if (candidates.length === 0) return "skipped";
  return null;
}

function timeWarnings(dv, tv, city, unknownTime){
  var out = [];
  var y = +dv.slice(0, 4);
  var dp = dv.split("-").map(Number), tp = tv.split(":").map(Number);

  if (unknownTime){
    out.push({ tone:"info", text:"<b>No birth time given.</b> The Sun, Moon and " +
      "planets below are correct to within the Moon's daily drift. The Ascendant, " +
      "the Midheaven and every house placement need a time and are marked " +
      "unavailable." });
    return out;
  }
  if (y < 1900 || y > 2100){
    out.push({ tone:"info", text:"<b>Outside 1900–2100 the fit loosens.</b> The " +
      "planetary theory here is fitted to DE421 and is at its best near the " +
      "present; this far out, expect arcminutes rather than arcseconds. Sign " +
      "placements are unaffected, precise degrees may drift." });
  }
  if (y < 1970){
    out.push({ tone:"warn", text:"<b>Historical daylight saving is unreliable before " +
      "about 1970.</b> Time zone databases are thin and inconsistent that far back — " +
      "British Double Summer Time and pre-1966 US state-by-state rules are common " +
      "traps. If you know the clock was an hour off what's assumed here, use the " +
      "adjustment below." });
  }
  var anomaly = null;
  try { anomaly = dstAnomaly(dp[0], dp[1], dp[2], tp[0], tp[1], city.tz); } catch (e){}
  if (anomaly === "ambiguous"){
    out.push({ tone:"warn", text:"<b>This clock time happened twice.</b> The clocks " +
      "went back that night, so this local time maps to two different moments an " +
      "hour apart. The earlier one was used — try the adjustment below for the other." });
  } else if (anomaly === "skipped"){
    out.push({ tone:"warn", text:"<b>This clock time never existed.</b> The clocks " +
      "jumped forward past it that night. The nearest real moment was used." });
  }
  return out;
}

/* ======================================================= ZODIAC MODE ====== *
   Sky & Story explains that the tropical zodiac tracks the seasons while the
   sidereal one tracks the stars, and that the two have drifted about a sign
   apart. This makes that switchable rather than merely stated: subtract the
   ayanamsa from every ecliptic longitude and the same sky gets read against
   the other reference frame.

   Lahiri (Chitrapaksha) is used — the Indian government standard and the most
   widely used ayanamsa. The formula is the standard linear-plus-quadratic fit;
   it agrees with published Lahiri tables to well under an arcminute across the
   site's 1900–2050 range.                                                    */

var zodiacMode = "tropical";     /* or "sidereal" */

function ayanamsa(jdTT){
  /* degrees of precession accumulated since the Lahiri zero epoch */
  var T = (jdTT - 2451545.0) / 36525;
  return 23.85231 + 1.3971667 * T + 0.0000389 * T * T;
}

/* Shift a computed chart into the sidereal frame. Returns a new object; the
   original tropical chart is never mutated, so switching back is exact. */
function toSidereal(ch){
  var ay = ayanamsa(ch.jdTT);
  var out = Object.create(Object.getPrototypeOf(ch));
  Object.keys(ch).forEach(function(k){ out[k] = ch[k]; });
  out.bodies = {};
  Object.keys(ch.bodies).forEach(function(n){
    out.bodies[n] = { lon: Astro.norm360(ch.bodies[n].lon - ay),
                      speed: ch.bodies[n].speed };
  });
  out.asc = Astro.norm360(ch.asc - ay);
  out.mc  = Astro.norm360(ch.mc - ay);
  out.houses = { system: ch.houses.system,
                 cusps: ch.houses.cusps.map(function(c){
                   return Astro.norm360(c - ay); }) };
  out.meta = {};
  Object.keys(ch.meta).forEach(function(k){ out.meta[k] = ch.meta[k]; });
  out.meta.zodiac = "sidereal";
  out.meta.ayanamsa = ay;
  out.tropical = ch;
  return out;
}

function applyZodiacMode(ch){
  if (!ch) return ch;
  var base = ch.tropical || ch;
  if (zodiacMode === "sidereal") return toSidereal(base);
  base.meta.zodiac = "tropical";
  base.meta.ayanamsa = 0;
  return base;
}

function zodiacToggleHTML(m){
  var sid = m.zodiac === "sidereal";
  return '<div class="zmode">' +
    '<span class="zmode-l">Zodiac</span>' +
    '<div class="zmode-btns">' +
      '<button class="btn" type="button" data-zodiac="tropical"' +
        (sid ? "" : ' aria-pressed="true"') + ">Tropical</button>" +
      '<button class="btn" type="button" data-zodiac="sidereal"' +
        (sid ? ' aria-pressed="true"' : "") + ">Sidereal</button>" +
    "</div>" +
    '<span class="zmode-note">' +
      (sid
        ? "Measured from the stars. Lahiri ayanamsa — " +
          E(m.ayanamsa.toFixed(2)) + "° of precession subtracted."
        : "Measured from the March equinox, so it tracks the seasons.") +
    "</span>" +
  "</div>";
}

document.addEventListener("click", function(e){
  var b = e.target.closest("[data-zodiac]");
  if (!b || !lastChart) return;
  zodiacMode = b.dataset.zodiac;
  store("zodiacMode", zodiacMode);
  renderChartOut(applyZodiacMode(lastChart));
});

/* ------------------------------------------------------------- presets --- *
   An empty form with a city autocomplete is a wall. These are public moments
   with documented times, so anyone can poke at the engine without handing
   over their own birth data first.                                          */

var CHART_PRESETS = [
  { label:"Moon landing", date:"1969-07-20", time:"20:17",
    city:{ name:"Houston", country:"United States", lat:29.76, lon:-95.37, tz:"America/Chicago" },
    note:"Eagle touches down in the Sea of Tranquillity, mission time." },
  { label:"Millennium", date:"2000-01-01", time:"00:00",
    city:{ name:"London", country:"United Kingdom", lat:51.51, lon:-0.13, tz:"Europe/London" },
    note:"Midnight at the prime meridian as the year rolled over." },
  { label:"Apollo 13 “Houston…”", date:"1970-04-13", time:"21:08",
    city:{ name:"Houston", country:"United States", lat:29.76, lon:-95.37, tz:"America/Chicago" },
    note:"The oxygen tank ruptures, 56 hours into the flight." },
  { label:"First web page", date:"1991-08-06", time:"12:00",
    city:{ name:"Geneva", country:"Switzerland", lat:46.20, lon:6.14, tz:"Europe/Zurich" },
    note:"Berners-Lee posts the first public page from CERN." },
  { label:"Total eclipse, 1999", date:"1999-08-11", time:"11:03",
    city:{ name:"Plymouth", country:"United Kingdom", lat:50.37, lon:-4.14, tz:"Europe/London" },
    note:"Totality over Cornwall — Sun and Moon in exact conjunction." },
  { label:"Sky right now", now:true, note:"Your own location and this moment." }
];

function renderPresets(){
  var host = $("#cPresets");
  if (!host) return;
  host.innerHTML = CHART_PRESETS.map(function(p, i){
    return '<button class="chip ghost" type="button" data-preset="' + i + '" title="' +
      E(p.note) + '">' + E(p.label) + "</button>";
  }).join("");
}

function applyPreset(i){
  var p = CHART_PRESETS[i];
  if (!p) return;
  if (p.now){ $("#cNow").click(); return; }
  $("#cDate").value = p.date;
  $("#cTime").value = p.time;
  if ($("#cNoTime")) $("#cNoTime").checked = false;
  timeShiftMin = 0;
  syncTimeField();
  chosenCity = p.city;
  $("#cPlace").value = placeLabel(p.city);
  showPlaceCoords(p.city.lat, p.city.lon, p.city.tz);
  var ch = computeChart();
  if (ch){ renderChartOut(ch); saveChartInputs(); }
}

document.addEventListener("click", function(e){
  var b = e.target.closest("[data-preset]");
  if (b) applyPreset(+b.dataset.preset);
});

/* ------------------------------------------------------------- computing --- */

var lastChart = null;    /* always the tropical chart — the source of truth */
var shownChart = null;   /* what is actually rendered (tropical or sidereal) */
var timeShiftMin = 0;    /* manual ±60 minute correction */

function computeChart(){
  var dv = $("#cDate").value;
  var unknownTime = !!($("#cNoTime") && $("#cNoTime").checked);
  var tv = unknownTime ? "12:00" : ($("#cTime").value || "12:00");
  if (!dv){
    $("#cDateHint").innerHTML = '<span style="color:#ffd35e">Pick a date to calculate ' +
      "from.</span>";
    $("#cDate").focus();
    return null;
  }
  $("#cDateHint").textContent = "1600 to 2200 — accuracy is best near the present";
  if (!chosenCity){
    $("#cPlaceHint").innerHTML = '<span style="color:#ffd35e">Pick a city from the list — ' +
      "the Ascendant and houses need a latitude and longitude.</span>";
    $("#cPlace").focus();
    return null;
  }
  var dp = dv.split("-").map(Number), tp = tv.split(":").map(Number);
  var ms = localToUTCms(dp[0], dp[1], dp[2], tp[0], tp[1], chosenCity.tz);
  if (!unknownTime && timeShiftMin) ms += timeShiftMin * 60000;
  var off = tzOffsetMin(chosenCity.tz, ms);
  var u = new Date(ms);
  var jd = Astro.julianDay(u.getUTCFullYear(), u.getUTCMonth() + 1, u.getUTCDate(),
    u.getUTCHours() + u.getUTCMinutes() / 60 + u.getUTCSeconds() / 3600);
  var ch = Astro.chart(jd, chosenCity.lat, chosenCity.lon,
    { houseSystem: $("#cHouse").value });
  ch.meta = {
    dateStr: dv, timeStr: tv, city: chosenCity,
    offset: off, utc: u,
    requested: $("#cHouse").value,
    unknownTime: unknownTime,
    shift: unknownTime ? 0 : timeShiftMin,
    warnings: timeWarnings(dv, tv, chosenCity, unknownTime)
  };
  lastChart = ch;
  ch.meta.zodiac = "tropical";
  ch.meta.ayanamsa = 0;
  return applyZodiacMode(ch);
}

/* ------------------------------------------------------- shareable charts - *
   The router already understands #/page/sub, so a chart just needs a compact
   sub. Coordinates travel in the link rather than a city index, so the URL
   does not depend on the ordering of cities.js and survives edits to it.     */

function chartToSub(ch){
  var m = ch.meta, c = m.city;
  var parts = [
    m.dateStr,
    m.unknownTime ? "x" : m.timeStr.replace(":", ""),
    c.lat.toFixed(2), c.lon.toFixed(2), c.tz,
    ch.houseSystem === m.requested ? m.requested : m.requested,
    /* name,region,country — or name,country as it has always been when there
       is no region. applyChartSub reads it back by counting the commas, so
       links shared before regions existed still resolve. Ten place names carry
       a comma of their own ("Washington, D. C."), as do four regions and one
       country, so the separator has to be stripped from each part the same way
       the field separator already is. */
    [c.name].concat(c.region ? [c.region] : [], c.country ? [c.country] : [])
      .map(function(s){ return String(s).replace(/[|,]/g, " ").trim(); })
      .join(",")
  ];
  if (m.shift) parts.push(m.shift > 0 ? "p60" : "m60");
  return parts.join("|");
}

function applyChartSub(sub){
  var p = String(sub).split("|");
  if (p.length < 7) return false;
  var date = p[0], time = p[1], lat = parseFloat(p[2]), lon = parseFloat(p[3]);
  var tz = p[4], house = p[5], place = p[6], shift = p[7];
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || isNaN(lat) || isNaN(lon)) return false;

  /* Three parts is name,region,country; two is the older name,country and must
     keep working, because every link shared before regions existed has that
     shape and coordinates in a link are supposed to outlive the data file. */
  var nameParts = place.split(",");
  chosenCity = { name:nameParts[0] || "Shared location",
                 region:nameParts.length > 2 ? nameParts[1] : "",
                 country:(nameParts.length > 2 ? nameParts[2] : nameParts[1]) || "",
                 lat:lat, lon:lon, tz:tz };
  $("#cDate").value = date;
  var noTime = (time === "x");
  if ($("#cNoTime")) $("#cNoTime").checked = noTime;
  if (!noTime && /^\d{4}$/.test(time)){
    $("#cTime").value = time.slice(0, 2) + ":" + time.slice(2);
  }
  syncTimeField();
  timeShiftMin = shift === "p60" ? 60 : (shift === "m60" ? -60 : 0);
  if (["whole", "placidus", "equal"].indexOf(house) > -1) $("#cHouse").value = house;
  $("#cPlace").value = placeLabel(chosenCity);
  showPlaceCoords(lat, lon, tz);

  var ch = computeChart();
  if (!ch) return false;
  renderChartOut(ch);
  return true;
}

function shareChartHTML(){
  return '<div class="share">' +
    '<button class="btn" type="button" id="cShare">🔗 Copy link to this chart</button>' +
    '<button class="btn" type="button" id="cPrint">Print / save as PDF</button>' +
    '<span class="share-note" id="cShareNote"></span>' +
  "</div>";
}

function wireShare(ch){
  var b = $("#cShare");
  if (b) b.addEventListener("click", function(){
    var url = location.origin + location.pathname + location.search +
      "#/chart/" + encodeURIComponent(chartToSub(ch));
    var note = $("#cShareNote");
    function ok(){
      if (note){ note.textContent = "Link copied."; note.classList.add("on"); }
      writeHash("#/chart/" + encodeURIComponent(chartToSub(ch)), true);
      setTimeout(function(){ if (note) note.classList.remove("on"); }, 3200);
    }
    if (navigator.clipboard && navigator.clipboard.writeText){
      navigator.clipboard.writeText(url).then(ok, function(){ fallbackCopy(url, ok); });
    } else fallbackCopy(url, ok);
  });
  var pb = $("#cPrint");
  if (pb) pb.addEventListener("click", function(){ window.print(); });
}

function fallbackCopy(text, done){
  var ta = document.createElement("textarea");
  ta.value = text;
  ta.setAttribute("readonly", "");
  ta.style.cssText = "position:absolute;left:-9999px";
  document.body.appendChild(ta);
  ta.select();
  try { document.execCommand("copy"); done(); }
  catch (e){
    var note = $("#cShareNote");
    if (note) note.textContent = "Couldn’t copy — the link is in the address bar.";
  }
  document.body.removeChild(ta);
}

function houseOf(ch, lon){
  var c = ch.houses.cusps;
  for (var i = 0; i < 12; i++){
    var a = c[i], b = c[(i + 1) % 12];
    var span = ((b - a) % 360 + 360) % 360;
    var d = ((lon - a) % 360 + 360) % 360;
    if (d < span) return i + 1;
  }
  return 1;
}

/* -------------------------------------------------------------- drawing ---- */

function drawNatal(ch){
  var svg = $("#natal");
  /* With no birth time the horizon is unknown, so the house ring and the
     four angles are meaningless. Orient the wheel on 0° Aries instead and
     draw neither. */
  var noTime = !!(ch.meta && ch.meta.unknownTime);
  svg.innerHTML =
    '<defs><radialGradient id="ngrad" cx="50%" cy="45%" r="62%">' +
    '<stop offset="0%" stop-color="#161c46" stop-opacity=".8"/>' +
    '<stop offset="100%" stop-color="#04050f" stop-opacity=".4"/></radialGradient>' +
    '<filter id="nglow" x="-60%" y="-60%" width="220%" height="220%">' +
    '<feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/>' +
    '<feMergeNode in="SourceGraphic"/></feMerge></filter></defs>';
  var cx = 350, cy = 350, RS = 318, RS2 = 276, RH = 226, RP = 196, RC = 120;
  var asc = noTime ? 0 : ch.asc;
  function th(lon){ return 180 - (((lon - asc) % 360 + 360) % 360); }

  svg.appendChild(mk("circle", { cx:cx, cy:cy, r:RS, fill:"url(#ngrad)", stroke:"rgba(160,175,255,.16)" }));
  svg.appendChild(mk("circle", { cx:cx, cy:cy, r:RS2, fill:"none", stroke:"rgba(160,175,255,.16)" }));
  svg.appendChild(mk("circle", { cx:cx, cy:cy, r:RH, fill:"none", stroke:"rgba(160,175,255,.11)" }));
  svg.appendChild(mk("circle", { cx:cx, cy:cy, r:RC, fill:"rgba(6,8,22,.55)", stroke:"rgba(160,175,255,.14)" }));

  /* sign ring */
  SIGNS.forEach(function(s, i){
    var a1 = th(i * 30), a2 = th(i * 30 + 30);
    if (a2 > a1) a2 -= 360;
    var p = mk("path", { d:arcPath(cx, cy, RS2, RS, a1, a2),
      fill:ELEMENTS[s.element].hex, opacity:".085" });
    svg.appendChild(p);
    var e = polar(cx, cy, RS, a1), e2 = polar(cx, cy, RS2, a1);
    svg.appendChild(mk("line", { x1:e[0], y1:e[1], x2:e2[0], y2:e2[1], stroke:"rgba(160,175,255,.2)" }));
    var m = polar(cx, cy, (RS + RS2) / 2, th(i * 30 + 15));
    var t = mk("text", { class:"nsign", x:m[0], y:m[1] + 7, fill:ELEMENTS[s.element].hex });
    t.textContent = s.glyph;
    svg.appendChild(t);
  });

  /* degree ticks */
  for (var d = 0; d < 360; d += 5){
    var q1 = polar(cx, cy, RS2, th(d)), q2 = polar(cx, cy, RS2 - (d % 30 === 0 ? 12 : 5), th(d));
    svg.appendChild(mk("line", { x1:q1[0], y1:q1[1], x2:q2[0], y2:q2[1],
      stroke:"rgba(160,175,255," + (d % 30 === 0 ? ".26" : ".1") + ")" }));
  }

  /* house cusps */
  if (!noTime) ch.houses.cusps.forEach(function(c, i){
    var a = th(c);
    var p1 = polar(cx, cy, RC, a), p2 = polar(cx, cy, RS2, a);
    var major = (i % 3 === 0);
    svg.appendChild(mk("line", { x1:p1[0], y1:p1[1], x2:p2[0], y2:p2[1],
      stroke:major ? "rgba(231,235,255,.5)" : "rgba(160,175,255,.2)",
      "stroke-width":major ? 1.5 : 1, "stroke-dasharray":major ? "" : "4 5" }));
    var nxt = ch.houses.cusps[(i + 1) % 12];
    var span = ((nxt - c) % 360 + 360) % 360;
    var mp = polar(cx, cy, RC + 26, th(c + span / 2));
    var t = mk("text", { class:"nhouse", x:mp[0], y:mp[1] + 4 });
    t.textContent = i + 1;
    svg.appendChild(t);
  });

  /* angles */
  if (!noTime) [["ASC", ch.asc, -1], ["MC", ch.mc, 0], ["DSC", ch.asc + 180, 1], ["IC", ch.mc + 180, 0]]
    .forEach(function(a){
      var p = polar(cx, cy, RS + 20, th(a[1]));
      var t = mk("text", { class:"nang", x:p[0], y:p[1] + 4,
        "text-anchor":a[2] < 0 ? "end" : (a[2] > 0 ? "start" : "middle") });
      t.textContent = a[0];
      svg.appendChild(t);
    });

  /* planets, with collision spreading */
  var items = BODY_ORDER.map(function(n){
    return { n:n, lon:ch.bodies[n].lon, sp:ch.bodies[n].speed };
  });
  var placed = items.map(function(it){
    return { it:it, a:((it.lon - asc) % 360 + 360) % 360 };
  }).sort(function(x, y){ return x.a - y.a; });
  var MINSEP = 9.5;
  for (var pass = 0; pass < 220; pass++){
    var moved = false;
    for (var i = 0; i < placed.length; i++){
      var j = (i + 1) % placed.length;
      var gap = ((placed[j].a - placed[i].a) % 360 + 360) % 360;
      if (gap < MINSEP){
        var push = (MINSEP - gap) / 2;
        placed[i].a = (placed[i].a - push + 360) % 360;
        placed[j].a = (placed[j].a + push) % 360;
        moved = true;
      }
    }
    if (!moved) break;
  }

  placed.forEach(function(p){
    var it = p.it;
    var col = it.n === "NorthNode" ? "#c4caf0" : (BMAP[BODY_ID[it.n]] || {}).color || "#fff";
    var a = 180 - p.a;
    var trueA = th(it.lon);
    var g = mk("g", { class:"nplanet", style:"--c:" + col, "data-b":it.n,
      tabindex:"0", role:"button",
      "aria-label":it.n + " at " + fmtFull(it.lon) });
    var tick1 = polar(cx, cy, RH, trueA), tick2 = polar(cx, cy, RH - 9, trueA);
    g.appendChild(mk("line", { x1:tick1[0], y1:tick1[1], x2:tick2[0], y2:tick2[1],
      stroke:col, "stroke-width":1.6, opacity:".8" }));
    var pp = polar(cx, cy, RP, a);
    if (Math.abs(((a - trueA + 540) % 360) - 180) > 0.4){
      var l1 = polar(cx, cy, RH - 9, trueA), l2 = polar(cx, cy, RP + 15, a);
      g.appendChild(mk("line", { x1:l1[0], y1:l1[1], x2:l2[0], y2:l2[1],
        stroke:col, "stroke-width":.8, opacity:".38" }));
    }
    g.appendChild(mk("circle", { cx:pp[0], cy:pp[1], r:15, fill:"rgba(8,10,28,.82)",
      stroke:col, "stroke-width":1, opacity:".9" }));
    var t = mk("text", { class:"npg", x:pp[0], y:pp[1] + 7 });
    t.textContent = it.n === "NorthNode" ? NODE_GLYPH : PLANET_GLYPH[it.n];
    g.appendChild(t);
    var dp = polar(cx, cy, RP - 26, a);
    var t2 = mk("text", { class:"npd", x:dp[0], y:dp[1] + 3 });
    t2.textContent = Math.floor(degInSign(it.lon)) + "°" + (it.sp < 0 ? "℞" : "");
    g.appendChild(t2);
    svg.appendChild(g);
  });

  /* aspect lines inside the core */
  var asps = chartAspects(ch);
  asps.forEach(function(x){
    var p1 = polar(cx, cy, RC - 2, th(ch.bodies[x.a].lon));
    var p2 = polar(cx, cy, RC - 2, th(ch.bodies[x.b].lon));
    svg.appendChild(mk("line", { x1:p1[0], y1:p1[1], x2:p2[0], y2:p2[1],
      stroke:x.asp.c, "stroke-width":x.orb < 2 ? 1.7 : 1,
      opacity:x.orb < 2 ? ".72" : ".4", "stroke-linecap":"round" }));
  });
}

function chartAspects(ch){
  var out = [];
  for (var i = 0; i < BODY_ORDER.length; i++){
    for (var j = i + 1; j < BODY_ORDER.length; j++){
      if (BODY_ORDER[i] === "NorthNode" || BODY_ORDER[j] === "NorthNode") continue;
      var sep = Math.abs(ch.bodies[BODY_ORDER[i]].lon - ch.bodies[BODY_ORDER[j]].lon) % 360;
      if (sep > 180) sep = 360 - sep;
      for (var k = 0; k < ASPECT_LIST.length; k++){
        var A = ASPECT_LIST[k], o = Math.abs(sep - A.deg);
        if (o <= (A.deg % 90 === 0 || A.deg === 120 || A.deg === 60 ? A.orb : A.orb)){
          out.push({ a:BODY_ORDER[i], b:BODY_ORDER[j], asp:A, orb:o, sep:sep });
          break;
        }
      }
    }
  }
  return out.sort(function(x, y){ return x.orb - y.orb; });
}

/* ====================================================== ASPECT PATTERNS ==== *
   A flat list of pairs is a list. A named pattern is a reading. Everything
   below is plain geometry over the aspects already computed — no extra
   astronomy and no claims the rest of the site doesn't already make.
   Patterns use tighter orbs than single aspects: a figure built from three
   loose aspects is mostly a coincidence of orbs.                             */

var PATTERN_ORB = { major:7, minor:3 };

function aspectMap(asps){
  var m = {};
  asps.forEach(function(x){
    m[x.a + "|" + x.b] = x;
    m[x.b + "|" + x.a] = x;
  });
  return m;
}

function hasAspect(map, a, b, degName, maxOrb){
  var x = map[a + "|" + b];
  if (!x || x.asp.name !== degName) return null;
  if (maxOrb != null && x.orb > maxOrb) return null;
  return x;
}

function bodyLabel(n){ return n === "NorthNode" ? "North Node" : n; }

function detectPatterns(ch){
  var asps = chartAspects(ch);
  var map = aspectMap(asps);
  var bodies = BODY_ORDER.filter(function(n){ return n !== "NorthNode"; });
  var found = [];
  var O = PATTERN_ORB.major;

  /* ---- three-body figures ---- */
  for (var i = 0; i < bodies.length; i++){
    for (var j = i + 1; j < bodies.length; j++){
      for (var k = j + 1; k < bodies.length; k++){
        var A = bodies[i], B = bodies[j], C = bodies[k];

        /* Grand trine — three trines, one closed equilateral triangle */
        if (hasAspect(map, A, B, "Trine", O) &&
            hasAspect(map, B, C, "Trine", O) &&
            hasAspect(map, A, C, "Trine", O)){
          var el = signOf(ch.bodies[A].lon).element;
          var sameEl = el === signOf(ch.bodies[B].lon).element &&
                       el === signOf(ch.bodies[C].lon).element;
          found.push({
            key:"grand-trine", name:"Grand Trine", glyph:"△", c:"#3fdc8b",
            bodies:[A, B, C], term:"grand-trine",
            detail: sameEl ? "All three in " + el + "." : "Spanning more than one element.",
            blurb:"Three bodies at 120° to each other, closing an equilateral " +
              "triangle. Read in the tradition as a closed circuit — fluent, " +
              "self-sufficient, and for that reason easy to coast on."
          });
        }

        /* T-square — two bodies in opposition, both square a third */
        var opp = hasAspect(map, A, B, "Opposition", O);
        if (opp && hasAspect(map, A, C, "Square", O) && hasAspect(map, B, C, "Square", O)){
          found.push({
            key:"t-square", name:"T-Square", glyph:"⊥", c:"#ff6fc4",
            bodies:[A, B, C], apex:C, term:"t-square",
            detail:bodyLabel(C) + " is the apex.",
            blurb:"An opposition with a third body square to both ends. The " +
              "apex takes the strain of the axis and is where the tradition " +
              "says the pressure — and the output — concentrates."
          });
        }
        if (hasAspect(map, A, C, "Opposition", O) &&
            hasAspect(map, A, B, "Square", O) && hasAspect(map, C, B, "Square", O)){
          found.push({
            key:"t-square", name:"T-Square", glyph:"⊥", c:"#ff6fc4",
            bodies:[A, C, B], apex:B, term:"t-square",
            detail:bodyLabel(B) + " is the apex.",
            blurb:"An opposition with a third body square to both ends. The " +
              "apex takes the strain of the axis and is where the tradition " +
              "says the pressure — and the output — concentrates."
          });
        }
        if (hasAspect(map, B, C, "Opposition", O) &&
            hasAspect(map, B, A, "Square", O) && hasAspect(map, C, A, "Square", O)){
          found.push({
            key:"t-square", name:"T-Square", glyph:"⊥", c:"#ff6fc4",
            bodies:[B, C, A], apex:A, term:"t-square",
            detail:bodyLabel(A) + " is the apex.",
            blurb:"An opposition with a third body square to both ends. The " +
              "apex takes the strain of the axis and is where the tradition " +
              "says the pressure — and the output — concentrates."
          });
        }

        /* Yod — two bodies sextile, both quincunx a third */
        if (hasAspect(map, A, B, "Sextile", PATTERN_ORB.minor) &&
            hasAspect(map, A, C, "Quincunx", PATTERN_ORB.minor) &&
            hasAspect(map, B, C, "Quincunx", PATTERN_ORB.minor)){
          found.push({
            key:"yod", name:"Yod", glyph:"⚸", c:"#a988ff",
            bodies:[A, B, C], apex:C, term:"quincunx",
            detail:bodyLabel(C) + " is the apex.",
            blurb:"Two bodies in easy sextile, both awkwardly quincunx a third. " +
              "A narrow figure — it needs tight orbs to mean anything, and the " +
              "apex is the point nothing else translates to automatically."
          });
        }
      }
    }
  }

  /* ---- grand cross: two oppositions square to each other ---- */
  for (var a = 0; a < bodies.length; a++)
    for (var b = a + 1; b < bodies.length; b++)
      for (var c = b + 1; c < bodies.length; c++)
        for (var d = c + 1; d < bodies.length; d++){
          var q = [bodies[a], bodies[b], bodies[c], bodies[d]];
          /* try the three ways to split four bodies into two opposition pairs */
          var splits = [[0,1,2,3], [0,2,1,3], [0,3,1,2]];
          for (var s = 0; s < splits.length; s++){
            var p = splits[s];
            var o1 = hasAspect(map, q[p[0]], q[p[1]], "Opposition", O);
            var o2 = hasAspect(map, q[p[2]], q[p[3]], "Opposition", O);
            if (!o1 || !o2) continue;
            if (hasAspect(map, q[p[0]], q[p[2]], "Square", O) &&
                hasAspect(map, q[p[0]], q[p[3]], "Square", O) &&
                hasAspect(map, q[p[1]], q[p[2]], "Square", O) &&
                hasAspect(map, q[p[1]], q[p[3]], "Square", O)){
              found.push({
                key:"grand-cross", name:"Grand Cross", glyph:"✛", c:"#ff5f45",
                bodies:q.slice(), term:"t-square",
                detail:"Two oppositions at right angles.",
                blurb:"Four bodies forming two oppositions square to one another " +
                  "— effectively two interlocking T-squares. The tradition reads " +
                  "it as the most loaded configuration on a chart, and the least " +
                  "escapable."
              });
              break;
            }
          }
        }

  /* ---- stellium: three or more bodies in the same sign ---- */
  var bySign = {};
  bodies.forEach(function(n){
    var s = signOf(ch.bodies[n].lon);
    (bySign[s.id] = bySign[s.id] || { sign:s, list:[] }).list.push(n);
  });
  Object.keys(bySign).forEach(function(id){
    var g = bySign[id];
    if (g.list.length < 3) return;
    /* Uranus, Neptune and Pluto take 7–20 years to cross a sign, so a cluster
       made only of them is shared by everyone born in that stretch. Worth
       naming, but not as a personal feature — the site's whole posture is
       keeping that kind of distinction visible. */
    var slow = g.list.every(function(n){
      var b = BMAP[BODY_ID[n]];
      return b && b.cls === "outer";
    });
    found.push({
      key:"stellium", name: slow ? "Stellium (generational)" : "Stellium",
      glyph:"✦", c: slow ? "#8b93c4" : "#ffd35e",
      bodies:g.list, term:"stellium", generational:slow,
      detail:g.list.length + " bodies in " + g.sign.name + ".",
      blurb: slow
        ? "Three or more of the slow outer bodies sharing a sign. They take " +
          "years to cross one, so everyone born across a long stretch has this " +
          "— it describes a generation rather than a person."
        : "Three or more bodies packed into one sign. That sign's style stops " +
          "being one voice among ten and starts dominating the chart."
    });
  });

  return dedupePatterns(found);
}

/* The triple loop can find the same figure by more than one route. */
function dedupePatterns(list){
  var seen = {}, out = [];
  list.forEach(function(p){
    var k = p.key + ":" + p.bodies.slice().sort().join(",");
    if (seen[k]) return;
    seen[k] = 1;
    out.push(p);
  });
  var rank = { "grand-cross":0, "grand-trine":1, "t-square":2, "yod":3, "stellium":4 };
  return out.sort(function(x, y){
    /* generational stelliums sink below everything personal */
    if (!!x.generational !== !!y.generational) return x.generational ? 1 : -1;
    if (rank[x.key] !== rank[y.key]) return rank[x.key] - rank[y.key];
    return y.bodies.length - x.bodies.length;
  });
}

function patternsHTML(ch){
  var pats = detectPatterns(ch);
  if (!pats.length){
    return '<p style="color:var(--muted);font-size:13.5px;max-width:70ch;line-height:1.65">' +
      "No named figures in this chart — no grand trine, T-square, grand cross, " +
      "yod or stellium within orb. That is the ordinary case; most charts have " +
      "none or one.</p>";
  }
  return '<div class="patterns">' + pats.map(function(p){
    return '<div class="pattern" style="--c:' + p.c + '">' +
      '<div class="pat-head">' +
        '<span class="pat-g">' + E(p.glyph) + "</span>" +
        '<span class="pat-n">' + E(p.name) + "</span>" +
        '<span class="pat-d">' + E(p.detail) + "</span>" +
      "</div>" +
      '<div class="pat-bodies">' + p.bodies.map(function(n){
        var isApex = p.apex === n;
        var id = BODY_ID[n];
        return '<button class="pat-b' + (isApex ? " apex" : "") +
          '" data-go="planets"' + (id ? ' data-sub="' + E(id) + '"' : "") +
          ' title="' + (isApex ? "Apex — " : "") +
          E(fmtPos(ch.bodies[n].lon)) + " — open " + E(bodyLabel(n)) + '">' +
          E(PLANET_GLYPH[n] || "") + " " + E(bodyLabel(n)) +
          (isApex ? '<span class="apx">apex</span>' : "") + "</button>";
      }).join("") + "</div>" +
      '<p class="pat-blurb">' + E(p.blurb) + "</p>" +
    "</div>";
  }).join("") + "</div>";
}

/* ------------------------------------------------------------- readouts ---- */

function dignityNote(bodyName, lon){
  var id = BODY_ID[bodyName];
  if (!id) return "";
  var b = BMAP[id], s = signOf(lon).name;
  var out = [];
  if (b.rules.indexOf(s) > -1 || b.rulesTrad.indexOf(s) > -1) out.push("in the sign it rules");
  if (b.exalt === s) out.push("in its sign of exaltation");
  if (b.detriment.indexOf(s) > -1) out.push("in detriment");
  if (b.fall.indexOf(s) > -1) out.push("in fall");
  return out.join(", ");
}

/* How long has this body been retrograde, and when does it station? Walk the
   ephemeris day by day from the chart date until the sign of the daily motion
   flips. Bounded so a slow outer planet can't spin the loop forever. */
var RETRO_SCAN_DAYS = { Mercury:40, Venus:60, Mars:120, Jupiter:180,
                        Saturn:200, Uranus:220, Neptune:220, Pluto:240 };

function speedOn(name, jdUT){
  var y = Astro.jdToDate(jdUT);
  var T = (jdUT + Astro.deltaT(y.year, y.month) / 86400 - 2451545.0) / 36525;
  var step = 0.5 / 36525;
  var a = bodyLonAt(name, T - step), b = bodyLonAt(name, T + step);
  if (a == null || b == null) return null;
  var d = ((b - a + 540) % 360) - 180;
  return isFinite(d) ? d : null;
}

function bodyLonAt(name, T){
  try {
    var v;
    if (name === "Sun") v = Astro.sunApparent(T);
    else if (name === "Moon") v = Astro.moonLongitude(T);
    else v = Astro.planetLongitude(name, T);
    /* planetLongitude returns {lon, lat, ...}; the other two return a number */
    if (v && typeof v === "object") v = v.lon;
    return typeof v === "number" && isFinite(v) ? Astro.norm360(v) : null;
  } catch (e){ return null; }
}

function retroSpan(ch, name){
  var limit = RETRO_SCAN_DAYS[name];
  if (!limit) return null;
  var jd = ch.jdUT, back = 0, fwd = 0, i;
  for (i = 1; i <= limit; i++){
    var sp = speedOn(name, jd - i);
    if (sp == null || sp >= 0) break;
    back = i;
  }
  var beganBounded = (i > limit);
  for (i = 1; i <= limit; i++){
    var sp2 = speedOn(name, jd + i);
    if (sp2 == null || sp2 >= 0) break;
    fwd = i;
  }
  var endsBounded = (i > limit);
  return { back:back, fwd:fwd, beganBounded:beganBounded, endsBounded:endsBounded };
}

function retroContext(ch, name){
  /* only meaningful while the body is actually retrograde */
  var b = ch.bodies[name];
  if (!b || b.speed >= 0) return "";
  var r = null;
  try { r = retroSpan(ch, name); } catch (e){ return ""; }
  if (!r) return "";
  var began = r.beganBounded ? "more than " + r.back + " days" : (r.back + 1) + " days";
  var ends  = r.endsBounded ? "more than " + r.fwd + " more days"
                            : "in " + (r.fwd + 1) + " days";
  return "<p><span class=\"lbl\">This retrograde:</span> " +
    "already " + E(began) + " underway on this date, and it stations direct " +
    E(ends) + ". Computed by stepping the ephemeris a day at a time and " +
    "watching the apparent motion change sign.</p>";
}

function bodyReadout(ch, name){
  var lon = ch.bodies[name].lon, sp = ch.bodies[name].speed;
  var noTime = !!(ch.meta && ch.meta.unknownTime);
  var s = signOf(lon), hn = houseOf(ch, lon), h = HMAP[hn];
  var sp2 = SIGNS_PLAIN[s.id];
  var col = name === "NorthNode" ? "#c4caf0" : (BMAP[BODY_ID[name]] || {}).color || "#fff";
  var b = BMAP[BODY_ID[name]];
  var what = b ? b.oneLine : "The point where the Moon's path crosses the Sun's path — the tradition reads it as a direction of growth.";
  var dig = dignityNote(name, lon);

  return '<div class="readout" style="--c:' + col + '">' +
    "<h4><span class=\"g\">" + E(name === "NorthNode" ? NODE_GLYPH : PLANET_GLYPH[name]) + "</span>" +
      E(name === "NorthNode" ? "North Node" : name) + " in " + E(s.name) +
      (sp < 0 ? '<span class="rx">℞</span>' : "") + "</h4>" +
    '<div class="pos">' + E(fmtPos(lon)) + " " + linkSign(s) +
      (noTime ? "" : " · " + linkHouse(hn) + " · " + E(h.title)) +
      (dig ? " · " + E(dig) : "") + "</div>" +
    "<p><span class=\"lbl\">What:</span> " + E(what) + "</p>" +
    "<p><span class=\"lbl\">How:</span> " + E(s.name) + " is " + E(s.element.toLowerCase()) +
      " and " + E(s.modality.toLowerCase()) + " — " + E((sp2 ? sp2.nutshell : s.drive).toLowerCase()) +
      ". " + E(sp2 ? sp2.oneLine : "") + "</p>" +
    (noTime
      ? "<p><span class=\"lbl\">Where:</span> <span class=\"na\">Needs a birth time.</span> " +
        "House placement depends on the horizon at the exact moment, which moves a " +
        "degree every four minutes.</p>"
      : "<p><span class=\"lbl\">Where:</span> " + linkHouse(hn)[0].toUpperCase() +
        linkHouse(hn).slice(1) + " covers " +
        E(h.covers.slice(0, 3).join(", ").toLowerCase()) + ". " + E(h.oneLine) + "</p>") +
    (sp < 0 ? retroContext(ch, name) : "") +
    (sp < 0 ? "<p><span class=\"lbl\">Retrograde:</span> from Earth this body appeared to " +
      "move backwards against the stars on this date. That is an effect of the two orbits " +
      "overtaking each other, not an actual reversal — the tradition reads it as the same " +
      "energy turned inward.</p>" : "") +
    "</div>";
}

var chartSel = "Sun";

function renderChartOut(ch){
  var m = ch.meta;
  announce("Chart calculated for " + m.dateStr +
    (m.unknownTime ? ", birth time unknown" : " at " + m.timeStr) +
    " in " + m.city.name + ".");
  var sunS = signOf(ch.bodies.Sun.lon), moonS = signOf(ch.bodies.Moon.lon), ascS = signOf(ch.asc);
  var offH = (m.offset >= 0 ? "+" : "−") +
    String(Math.floor(Math.abs(m.offset) / 60)).padStart(2, "0") + ":" +
    String(Math.abs(m.offset) % 60).padStart(2, "0");
  var sysName = { whole:"Whole Sign", equal:"Equal", placidus:"Placidus" }[ch.houseSystem];
  var fellBack = m.requested === "placidus" && ch.houseSystem !== "placidus";

  var noTime = !!m.unknownTime;

  var html =
    '<div class="bigthree">' +
      b3("Sun sign", sunS, ch.bodies.Sun.lon, "Where the Sun was — the sign most people mean by “my sign”.") +
      b3("Moon sign", moonS, ch.bodies.Moon.lon, "The Moon moves a sign every 2½ days, so this needs the date, not just the month.") +
      (noTime
        ? b3Unknown("Rising sign", "Changes every ~2 hours, so it cannot be " +
            "derived without a birth time.")
        : b3("Rising sign", ascS, ch.asc, "The sign coming over the eastern horizon. Changes every ~2 hours — this is why birth time matters.")) +
    "</div>" +

    (m.warnings && m.warnings.length
      ? m.warnings.map(function(w){
          return '<div class="notice' + (w.tone === "warn" ? " warn" : " calm") + '">' +
            w.text + "</div>";
        }).join("")
      : "") +

    '<div class="notice calm">' +
      "<b>Computed for</b> " + E(m.dateStr) +
      (noTime ? " (time unknown)" : " at " + E(m.timeStr)) + " in " +
      E(m.city.name + ", " + m.city.country) + " (UTC" + offH + ") · " +
      "that is " + E(m.utc.toISOString().slice(0, 16).replace("T", " ")) + " UTC · " +
      (noTime ? "no house system — needs a time" : E(sysName) + " houses") +
      (fellBack && !noTime ? " — <b>Placidus is undefined this far from the equator, so Whole Sign was used instead.</b>" : "") +
      (m.shift ? " · <b>adjusted " + (m.shift > 0 ? "+" : "−") + "1 hour</b>" : "") +
    "</div>" +

    zodiacToggleHTML(m) +

    shareChartHTML() +

    (noTime ? "" : timeNudgeHTML(m)) +

    '<div class="chart-layout">' +
      '<div class="card" style="padding:10px">' +
        '<svg id="natal" viewBox="0 0 700 700" role="img" aria-label="Natal chart wheel"></svg>' +
        '<p style="text-align:center;font-size:11.5px;color:var(--faint);margin:2px 0 8px">' +
          (noTime
            ? "0° Aries on the left · signs outside · no house ring without a birth time · ℞ marks retrograde"
            : "Ascendant on the left · signs outside · houses numbered inside · ℞ marks retrograde") + "</p>" +
      "</div>" +
      "<div>" +
        "<h3 class=\"sec\" style=\"margin-top:0\">Positions</h3>" +
        '<div class="plist" id="chartList"></div>' +
        '<div id="chartRead"></div>' +
      "</div>" +
    "</div>" +

    "<h3 class=\"sec\">Angles between the bodies</h3>" +
    '<p style="font-size:13.5px;color:var(--text-2);max-width:70ch;line-height:1.65;margin:0 0 14px">' +
      "These are the actual angular separations on this date, and the traditional name for each. " +
      "Tighter orbs are read as stronger. Pairs with no listed angle are simply not in aspect.</p>" +
    '<div class="grid g3" id="chartAsps"></div>' +
    '<div id="aspMore" style="margin-top:14px"></div>' +

    "<h3 class=\"sec\">Named figures</h3>" +
    '<p style="font-size:13.5px;color:var(--text-2);max-width:70ch;line-height:1.65;margin:0 0 14px">' +
      "When several of those angles lock together they make a shape the tradition " +
      "has a name for. These are found by geometry alone, using tighter orbs than " +
      "single aspects — a figure built from three loose angles is mostly a " +
      "coincidence of orbs.</p>" +
    '<div id="chartPatterns"></div>' +

    "<h3 class=\"sec\">The chart in one paragraph</h3>" +
    '<div class="plainbox" style="max-width:74ch">' +
      "<p>Read a chart as a stack of three-part sentences: " +
      "<b>" + E(PLANET_GLYPH.Sun + " Sun") + "</b> (identity) " +
      "in <b>" + linkSign(sunS) + "</b> (" + E((SIGNS_PLAIN[sunS.id] || {}).nutshell || "").toLowerCase() +
      ")" +
      (noTime
        ? " in <b class=\"na\">house unknown</b>. The third part of every sentence " +
          "needs a birth time — without one you have the planet and the sign, which is " +
          "two thirds of the grammar."
        : " in <b>" + linkHouse(houseOf(ch, ch.bodies.Sun.lon)) + "</b> (" +
          E(HMAP[houseOf(ch, ch.bodies.Sun.lon)].title.toLowerCase()) + ").") +
      " Then the same for the Moon, then for each planet. Nothing more complicated is happening — " +
      "the rest is memorising twelve signs, twelve houses and ten bodies.</p>" +
    "</div>" +

    '<div class="notice">' +
      "<b>What this is and is not.</b> Every number above is real positional astronomy — " +
      "computed from a planetary theory fitted to NASA/JPL's DE421 ephemeris and checked " +
      "against it to better than 20 arcseconds. The labels attached to those positions are " +
      "the vocabulary of a symbolic tradition. This page will never tell you what is going " +
      "to happen, because that is not something a sky position can tell anyone." +
    "</div>";

  $("#chartOut").innerHTML = html;
  focusTarget($("#chartOut"));
  drawNatal(ch);
  renderChartList(ch);
  selectChartBody(chartSel, ch);

  shownChart = ch;
  renderChartAspects(ch, false);
  var pat = $("#chartPatterns");
  if (pat) pat.innerHTML = patternsHTML(ch);
  wireShare(ch);
  autolink($("#chartOut"));
}

/* Show only the tightest six by default. Tight orbs are what the tradition
   weights anyway, so the cut is meaningful rather than arbitrary. */
var ASP_PREVIEW = 6;

function renderChartAspects(ch, showAll){
  var all = chartAspects(ch).slice(0, 18);
  var shown = showAll ? all : all.slice(0, ASP_PREVIEW);
  var host = $("#chartAsps");
  if (!host) return;
  if (!all.length){
    host.innerHTML = '<p style="color:var(--muted);font-size:13px">' +
      "No major aspects within orb.</p>";
    return;
  }
  host.innerHTML = shown.map(function(x){
    var ga = x.a === "NorthNode" ? NODE_GLYPH : PLANET_GLYPH[x.a];
    var gb = x.b === "NorthNode" ? NODE_GLYPH : PLANET_GLYPH[x.b];
    return '<div class="tile" style="--c:' + x.asp.c + ';cursor:default">' +
      '<span class="tm" style="color:' + x.asp.c + '">' + E(x.asp.sym + " " + x.asp.name) + "</span>" +
      '<span class="tn" style="font-size:14px">' + E(ga + " " + x.a) + " — " + E(gb + " " + x.b) + "</span>" +
      '<span class="td">' + x.sep.toFixed(1) + "° apart · orb " + x.orb.toFixed(1) + "°</span></div>";
  }).join("");
  var more = $("#aspMore");
  if (more){
    more.innerHTML = all.length > ASP_PREVIEW
      ? '<button class="btn" type="button" data-aspmore="' + (showAll ? "less" : "more") + '">' +
        (showAll ? "Show the tightest " + ASP_PREVIEW + " only"
                 : "Show all " + all.length + " aspects") + "</button>"
      : "";
  }
}

document.addEventListener("click", function(e){
  var b = e.target.closest("[data-aspmore]");
  if (b && shownChart) renderChartAspects(shownChart, b.dataset.aspmore === "more");
});

function b3(k, s, lon, d){
  return '<div class="b3" style="--c:' + ELEMENTS[s.element].hex + '22;--c2:' +
    ELEMENTS[s.element].hex + '">' +
    '<div class="k">' + E(k) + "</div>" +
    '<div class="v"><span class="g">' + E(s.glyph) + "</span>" + E(s.name) + "</div>" +
    '<div class="d">' + E(fmtPos(lon)) + " · " + E(d) + "</div></div>";
}

/* Same slot, but visibly withheld rather than filled with a guess. */
function b3Unknown(k, d){
  return '<div class="b3 unknown" style="--c:rgba(255,255,255,.04);--c2:var(--faint)">' +
    '<div class="k">' + E(k) + "</div>" +
    '<div class="v"><span class="g">—</span>Needs a birth time</div>' +
    '<div class="d">' + E(d) + "</div></div>";
}

/* ±1 hour correction, for the DST cases the time zone database can't resolve. */
function timeNudgeHTML(m){
  return '<div class="nudge">' +
    '<span class="nudge-l">Clock looks an hour off?</span>' +
    '<button class="btn" type="button" data-shift="-60"' +
      (m.shift === -60 ? ' aria-pressed="true"' : "") + ">−1 hour</button>" +
    '<button class="btn" type="button" data-shift="0"' +
      (m.shift === 0 ? ' aria-pressed="true"' : "") + ">As entered</button>" +
    '<button class="btn" type="button" data-shift="60"' +
      (m.shift === 60 ? ' aria-pressed="true"' : "") + ">+1 hour</button>" +
  "</div>";
}

document.addEventListener("click", function(e){
  var b = e.target.closest("[data-shift]");
  if (!b) return;
  timeShiftMin = +b.dataset.shift;
  var ch = computeChart();
  if (ch){ renderChartOut(ch); saveChartInputs(); }
});

/* Sign, body and house names in generated output are jumping-off points.
   The router and applySub() already handle these targets. */
function linkSign(s){
  return '<button class="xlink" data-go="wheel" data-sub="' + E(s.id) +
    '" title="Open ' + E(s.name) + ' on the wheel">' + E(s.name) + "</button>";
}
function linkHouse(n){
  return '<button class="xlink" data-go="houses" data-sub="' + n +
    '" title="Open house ' + n + '">house ' + n + "</button>";
}
function linkBody(name){
  var id = BODY_ID[name];
  if (!id) return E(bodyLabel(name));
  return '<button class="xlink" data-go="planets" data-sub="' + E(id) +
    '" title="Open ' + E(name) + '">' + E(name) + "</button>";
}

function renderChartList(ch){
  $("#chartList").innerHTML = BODY_ORDER.map(function(n){
    var lon = ch.bodies[n].lon, s = signOf(lon), hn = houseOf(ch, lon);
    var noTime = !!(ch.meta && ch.meta.unknownTime);
    var col = n === "NorthNode" ? "#c4caf0" : (BMAP[BODY_ID[n]] || {}).color || "#fff";
    var b = BMAP[BODY_ID[n]];
    return '<button class="prow" data-cb="' + n + '" style="--c:' + col + '">' +
      '<span class="pgl">' + E(n === "NorthNode" ? NODE_GLYPH : PLANET_GLYPH[n]) + "</span>" +
      "<span><span class=\"pnm\">" + E(n === "NorthNode" ? "North Node" : n) +
        (ch.bodies[n].speed < 0 ? '<span class="rx">℞</span>' : "") + "</span>" +
        '<span class="pmeta">' + E(b ? b.keywords.slice(0, 2).join(" · ") : "growth direction") + "</span></span>" +
      '<span class="ppos"><span class="pd">' + E(s.glyph + " " + fmtPos(lon)) + "</span><br>" +
        '<span class="ph">' + (noTime ? "—" : "house " + hn) + "</span></span></button>";
  }).join("");
}

function selectChartBody(n, ch){
  chartSel = n;
  ch = ch || shownChart || lastChart;
  if (!ch) return;
  $$("[data-cb]").forEach(function(b){ b.classList.toggle("sel", b.dataset.cb === n); });
  $$(".nplanet").forEach(function(g){ g.classList.toggle("sel", g.dataset.b === n); });
  $("#chartRead").innerHTML = bodyReadout(ch, n);
  autolink($("#chartRead"));
}

document.addEventListener("click", function(e){
  var b = e.target.closest("[data-cb]") || e.target.closest(".nplanet");
  if (b) selectChartBody(b.dataset.cb || b.dataset.b);
});

/* ----------------------------------------------------------------- boot ---- */

function renderChartPage(){
  wirePlace();
  renderPresets();
  zodiacMode = load("zodiacMode", "tropical") === "sidereal" ? "sidereal" : "tropical";
  var hadSaved = restoreChartInputs();

  $("#cNoTime").addEventListener("change", function(){
    syncTimeField();
    if (this.checked) timeShiftMin = 0;
    if (lastChart){
      var ch = computeChart();
      if (ch){ renderChartOut(ch); saveChartInputs(); }
    }
  });

  /* start pulling the place table as soon as this page is opened — by the
     time anyone has typed two characters it is normally already here. Don't
     stomp on the restored city's coordinate line while it loads. */
  if (!chosenCity) setPlaceStatus("Loading places…");
  ensureCities().then(function(){
    if (!chosenCity) setPlaceStatus("Time zone and daylight saving are handled automatically");
  }, placeLoadFailed);

  $("#chartForm").addEventListener("submit", function(e){
    e.preventDefault();
    var btn = $("#chartForm button[type=submit]");
    if (btn){ btn.disabled = true; btn.textContent = "Calculating…"; }
    /* let the button paint before the ephemeris run blocks the thread */
    setTimeout(function(){
      try {
        var ch = computeChart();
        if (ch){ renderChartOut(ch); saveChartInputs(); }
      } finally {
        if (btn){ btn.disabled = false; btn.textContent = "Calculate"; }
      }
    }, 0);
  });

  /* if we restored a previous chart, show it straight away */
  if (hadSaved){
    var ch0 = computeChart();
    if (ch0) renderChartOut(ch0);
  }

  $("#cNow").addEventListener("click", function(){
    ensureCities().then(skyNow, placeLoadFailed);
  });

  function skyNow(){
    var tz = "UTC";
    try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"; } catch (err){}
    if (!chosenCity){
      var idx = -1;
      for (var i = 0; i < CITIES.length; i++) if (TZS[CITIES[i][4]] === tz){ idx = i; break; }
      if (idx >= 0) window._pickCityIdx(idx);
      else {
        chosenCity = { name:"Greenwich", country:"United Kingdom", lat:51.48, lon:0, tz:"Europe/London" };
        $("#cPlace").value = "Greenwich, United Kingdom";
      }
    }
    var now = new Date();
    var p = {};
    new Intl.DateTimeFormat("en-CA", { timeZone:chosenCity.tz, year:"numeric", month:"2-digit",
      day:"2-digit", hour:"2-digit", minute:"2-digit", hour12:false })
      .formatToParts(now).forEach(function(x){ p[x.type] = x.value; });
    $("#cDate").value = p.year + "-" + p.month + "-" + p.day;
    $("#cTime").value = ((+p.hour) % 24 < 10 ? "0" : "") + ((+p.hour) % 24) + ":" + p.minute;
    var ch = computeChart();
    if (ch){ renderChartOut(ch); saveChartInputs(); }
  }
}
pageRender.chart = renderChartPage;
