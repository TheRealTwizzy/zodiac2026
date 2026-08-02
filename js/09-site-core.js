/* ============================================================================
   SITE CORE — routing, navigation, glossary tooltips, search, start page
   ==========================================================================*/

var PAGES = [
  { id:"start",    label:"Start here" },
  { id:"wheel",    label:"The Wheel" },
  { id:"planets",  label:"Planets" },
  { id:"houses",   label:"Houses" },
  { id:"aspects",  label:"Aspects" },
  { id:"chart",    label:"Your Sky" },
  { id:"history",  label:"Sky & Story" },
  { id:"quiz",     label:"Quiz" },
  { id:"glossary", label:"Glossary" },
  { id:"about",    label:"How to Read This" }
];

var E = function(t){ return String(t == null ? "" : t)
  .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
  .replace(/"/g,"&quot;"); };

var $  = function(s, r){ return (r || document).querySelector(s); };
var $$ = function(s, r){ return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

var GMAP = {};
GLOSSARY.forEach(function(g){ GMAP[g.id] = g; });

/* ---------------------------------------------------------------- router --- */

var current = "start";
var pageInit = {};      /* id -> boolean, lazily rendered */
var pageRender = {};    /* id -> function, filled by the section modules */
var scrollMemory = {};  /* id -> scrollY, so returning to a section resumes */
var visited = {};       /* id -> true, drives the faint nav dot */

/* -------------------------------------------------------------- storage --- *
   One small wrapper so a blocked or full localStorage can never break a
   render path. Everything persisted by the site goes through these two.      */
var STORE_PREFIX = "cosmicatlas:";
function store(key, val){
  try { localStorage.setItem(STORE_PREFIX + key, JSON.stringify(val)); }
  catch (e){ /* private mode, quota, disabled — carry on unpersisted */ }
}
function load(key, fallback){
  try {
    var raw = localStorage.getItem(STORE_PREFIX + key);
    return raw === null ? fallback : JSON.parse(raw);
  } catch (e){ return fallback; }
}

visited = load("visited", {});

/* ---------------------------------------------------------- history i/o --- *
   Opened straight off disk (file://) some browsers refuse pushState, and a
   throw here would take the whole router down. Fall back to assigning the
   hash, which always works, and only then give up quietly. Nothing about the
   site's behaviour depends on history succeeding — Back just stops being
   section-aware.                                                             */

var historyWorks = true;

function writeHash(h, replace){
  if (historyWorks){
    try {
      if (replace) history.replaceState(null, "", h);
      else history.pushState(null, "", h);
      return;
    } catch (e){
      historyWorks = false;   /* file:// or a sandboxed frame — stop trying */
    }
  }
  try {
    /* assigning location.hash still updates the address bar and Back stack */
    if (location.hash !== h) location.hash = h;
  } catch (e){ /* nothing more we can do; navigation still works in-page */ }
}

/* ------------------------------------------------------- announcements --- *
   Large regions get replaced wholesale — a chart calculated, a sign selected,
   a quiz answered. Sighted users see it; without a live region nobody else
   does. One polite region, cleared and rewritten so repeat messages re-fire. */

function announce(msg){
  var el = $("#live");
  if (!el) return;
  el.textContent = "";
  setTimeout(function(){ el.textContent = msg; }, 40);
}

/* Move focus into freshly rendered output so keyboard users aren't stranded
   at the control that produced it. */
function focusTarget(el){
  if (!el) return;
  if (!el.hasAttribute("tabindex")) el.setAttribute("tabindex", "-1");
  try { el.focus({ preventScroll:true }); } catch (e){ try { el.focus(); } catch (e2){} }
}

/* --------------------------------------------------------- page failure --- */

function renderFailure(id, err){
  var page = document.getElementById("page-" + id);
  if (!page) return;
  var wrap = page.querySelector(".wrap") || page;
  var box = document.createElement("div");
  box.className = "notice";
  box.style.cssText = "border-color:rgba(255,95,69,.45);margin:20px 0";
  box.innerHTML = "<b>This section didn’t load.</b> Something went wrong " +
    "rendering it. Reloading the page usually clears it." +
    '<div style="margin-top:11px"><button class="btn" type="button" ' +
    'onclick="location.reload()">Reload</button></div>';
  wrap.appendChild(box);
  if (window.console && console.error) console.error("[cosmicatlas] " + id, err);
}

function go(id, opt){
  opt = opt || {};
  var known = !!document.getElementById("page-" + id);
  if (!known){
    if (id) notFound(id);
    id = "start";
  }
  /* remember where we were before leaving */
  if (current && current !== id) scrollMemory[current] = window.scrollY;
  current = id;
  visited[id] = true; store("visited", visited);

  $$(".page").forEach(function(p){ p.classList.toggle("on", p.id === "page-" + id); });
  $$(".navlink").forEach(function(b){
    if (b.dataset.go === id) b.setAttribute("aria-current", "page");
    else b.removeAttribute("aria-current");
    b.classList.toggle("seen", !!visited[b.dataset.go]);
  });
  if (typeof syncTabs === "function") syncTabs(id);
  if (typeof closeMore === "function") closeMore();
  document.body.classList.remove("head-hidden");

  if (!pageInit[id] && pageRender[id]){
    try { pageRender[id](); pageInit[id] = true; }
    catch (err){ pageInit[id] = true; renderFailure(id, err); }
  }
  if (opt.then){
    try { opt.then(); } catch (err){ renderFailure(id, err); }
  }
  renderPager(id);

  if (!opt.keepHash){
    var h = "#/" + id + (opt.sub ? "/" + encodeURIComponent(opt.sub) : "");
    if (location.hash !== h) writeHash(h, opt.replace);
  }
  if (!opt.noScroll){
    var restoreTo = opt.restore && scrollMemory[id] ? scrollMemory[id] : 0;
    window.scrollTo({ top: restoreTo,
      behavior: (opt.smooth && !REDUCE_MOTION) ? "smooth" : "auto" });
  }
  var link = $('.navlink[data-go="' + id + '"]');
  if (link && link.scrollIntoView) link.scrollIntoView({ block:"nearest", inline:"center" });
}

/* A deep link that points at nothing should say so rather than silently
   redirecting to the start page. */
function notFound(what){
  var t = $("#toast");
  if (!t) return;
  t.textContent = "“" + what + "” isn’t a section on this site — showing the start page.";
  t.classList.add("on");
  clearTimeout(notFound._t);
  notFound._t = setTimeout(function(){ t.classList.remove("on"); }, 5200);
}

function subNotFound(sub){
  var t = $("#toast");
  if (!t) return;
  t.textContent = "Couldn’t find “" + sub + "” on this page.";
  t.classList.add("on");
  clearTimeout(notFound._t);
  notFound._t = setTimeout(function(){ t.classList.remove("on"); }, 5200);
}

function routeFromHash(opt){
  opt = opt || {};
  var m = /^#\/([a-z]+)(?:\/(.+))?$/.exec(location.hash || "");
  if (!m) return go("start", { keepHash:true, restore:opt.restore });
  var page = m[1], sub = m[2] ? decodeURIComponent(m[2]) : null;
  go(page, { keepHash:true, restore:opt.restore,
    then: function(){ if (sub) applySub(page, sub); } });
}

function applySub(page, sub){
  var ok = true;
  if (page === "planets" && typeof showBody === "function") ok = showBody(sub);
  else if (page === "houses" && typeof showHouse === "function") ok = showHouse(+sub);
  else if (page === "glossary" && typeof focusTerm === "function") ok = focusTerm(sub);
  else if (page === "wheel" && typeof selectSignById === "function") ok = selectSignById(sub);
  else if (page === "chart" && typeof applyChartSub === "function") ok = applyChartSub(sub);
  if (ok === false) subNotFound(sub);
}

function buildNav(){
  buildTabs();
  var n = $("#mainnav");
  n.innerHTML = PAGES.map(function(p){
    return '<button class="navlink' + (visited[p.id] ? " seen" : "") +
      '" data-go="' + p.id + '">' + E(p.label) + "</button>";
  }).join("");
}

/* ----------------------------------------------------------- section pager - */

function renderPager(id){
  var page = document.getElementById("page-" + id);
  if (!page) return;
  var host = page.querySelector(".pager");
  if (!host){
    host = document.createElement("nav");
    host.className = "pager";
    host.setAttribute("aria-label", "Section navigation");
    (page.querySelector(".wrap") || page).appendChild(host);
  }
  var i = PAGES.map(function(p){ return p.id; }).indexOf(id);
  if (i < 0){ host.innerHTML = ""; return; }
  var prev = PAGES[i - 1], next = PAGES[i + 1];
  host.innerHTML =
    (prev ? '<button class="pager-btn prev" data-go="' + prev.id + '">' +
       '<span class="pl">← Previous</span><span class="pn">' + E(prev.label) + "</span></button>"
     : '<span class="pager-btn empty" aria-hidden="true"></span>') +
    (next ? '<button class="pager-btn next" data-go="' + next.id + '">' +
       '<span class="pl">Next →</span><span class="pn">' + E(next.label) + "</span></button>"
     : '<span class="pager-btn empty" aria-hidden="true"></span>');
}

document.addEventListener("click", function(e){
  var b = e.target.closest("[data-go]");
  if (b){
    e.preventDefault();
    go(b.dataset.go, { sub: b.dataset.sub || null, smooth:false });
    if (b.dataset.sub) applySub(b.dataset.go, b.dataset.sub);
  }
});

/* Back/Forward across sections. Both hashchange and popstate can fire for a
   hash URL depending on the browser, so both route without writing history. */
window.addEventListener("popstate", function(){ routeFromHash({ restore:true }); });
window.addEventListener("hashchange", function(){ routeFromHash({ restore:true }); });

/* -------------------------------------------------------------- tooltips --- */

var AUTOTERMS = ["semi-sextile","void of course","mutual reception","whole sign houses",
  "aspect pattern","grand trine","t-square","chart ruler","natal chart","lunar node",
  "lunar nodes","dwarf planet","personal planets","angular houses","house system",
  "precession of the equinoxes","precession","tropical zodiac","sidereal zodiac",
  "conjunction","opposition","quincunx","sextile","trine","square aspect",
  "retrograde","stationary","exaltation","detriment","dignity","decan","benefic",
  "malefic","luminary","luminaries","ephemeris","geocentric","heliocentric",
  "obliquity","ecliptic","ascendant","rising sign","midheaven","descendant",
  "stellium","synastry","transit","ingress","lunation","placidus","sect","orb",
  "modality","modalities","cardinal","mutable","cusp","equinox","solstice"];

var TERM_LOOKUP = {};
(function(){
  var byName = {};
  GLOSSARY.forEach(function(g){ byName[g.term.toLowerCase()] = g.id; });
  AUTOTERMS.forEach(function(t){
    var id = byName[t] || byName[t.replace(/s$/, "")] ||
             (GMAP[t.replace(/[^a-z]+/g, "-")] ? t.replace(/[^a-z]+/g, "-") : null);
    if (!id){
      var cand = GLOSSARY.filter(function(g){
        return g.term.toLowerCase() === t || g.id === t.replace(/[^a-z]+/g, "-");
      })[0];
      id = cand ? cand.id : null;
    }
    if (id) TERM_LOOKUP[t] = id;
  });
})();

var AUTO_RE = new RegExp("\\b(" + Object.keys(TERM_LOOKUP)
  .sort(function(a, b){ return b.length - a.length; })
  .map(function(t){ return t.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&"); })
  .join("|") + ")\\b", "i");

var NOAUTO = /\b(term|no-auto|mini|eyebrow|crumb|fl|tm|ph|ty|tp|gc|sk|qmeta|pmeta|k|u|l|aorb|pos|axis-lab|tstep|ctl-label|controls-title|sect-h|mini-h)\b/;

function autolink(root){
  if (!root) return;
  var used = {};
  var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: function(n){
      if (!n.nodeValue || n.nodeValue.length < 3) return NodeFilter.FILTER_REJECT;
      var p = n.parentElement;
      while (p && p !== root){
        var t = p.tagName;
        if (t === "BUTTON" || t === "A" || t === "SUMMARY" || t === "H1" || t === "H2" ||
            t === "H3" || t === "H4" || t === "TH" || t === "LABEL" ||
            NOAUTO.test(p.className || "")) return NodeFilter.FILTER_REJECT;
        p = p.parentElement;
      }
      return NodeFilter.FILTER_ACCEPT;
    }
  });
  var nodes = [], n;
  while ((n = walker.nextNode())) nodes.push(n);
  nodes.forEach(function(node){
    var m = AUTO_RE.exec(node.nodeValue);
    if (!m) return;
    var key = m[1].toLowerCase();
    if (used[TERM_LOOKUP[key]]) return;
    used[TERM_LOOKUP[key]] = 1;
    var before = node.nodeValue.slice(0, m.index);
    var after  = node.nodeValue.slice(m.index + m[1].length);
    var span = document.createElement("span");
    span.className = "term";
    span.setAttribute("role", "button");
    span.setAttribute("tabindex", "0");
    span.dataset.t = TERM_LOOKUP[key];
    span.textContent = m[1];
    var frag = document.createDocumentFragment();
    if (before) frag.appendChild(document.createTextNode(before));
    frag.appendChild(span);
    if (after) frag.appendChild(document.createTextNode(after));
    node.parentNode.replaceChild(frag, node);
  });
}

var tipEl, tipFor = null;
function showTip(el, id){
  var g = GMAP[id];
  if (!g) return;
  tipEl.innerHTML =
    '<p class="tt">' + E(g.term) + "</p>" +
    "<div>" + E(g.short) + "</div>" +
    '<button class="tmore" data-go="glossary" data-sub="' + E(g.id) + '">Full definition →</button>';
  tipEl.classList.add("on");
  tipFor = el;
  placeTip(el);
}
function hideTip(){ tipEl.classList.remove("on"); tipFor = null; }

document.addEventListener("click", function(e){
  var t = e.target.closest(".term");
  if (t){ e.preventDefault(); e.stopPropagation();
    showTip(t, t.dataset.t); return; }
  if (!e.target.closest("#tip")) hideTip();
});
document.addEventListener("mouseover", function(e){
  var t = e.target.closest(".term");
  if (t && !("ontouchstart" in window)) showTip(t, t.dataset.t);
});
document.addEventListener("mouseout", function(e){
  var t = e.target.closest(".term");
  if (t && !("ontouchstart" in window) && !e.relatedTarget?.closest?.("#tip")) hideTip();
});
function placeTip(el){
  var r = el.getBoundingClientRect();
  var w = tipEl.offsetWidth, h = tipEl.offsetHeight;
  var left = Math.min(Math.max(8, r.left + r.width / 2 - w / 2), innerWidth - w - 8);
  var top = r.top - h - 10;
  if (top < 8) top = r.bottom + 10;
  tipEl.style.left = left + "px";
  tipEl.style.top = top + "px";
}
window.addEventListener("scroll", function(){
  if (!tipFor) return;
  var r = tipFor.getBoundingClientRect();
  if (r.bottom < 0 || r.top > innerHeight) hideTip();
  else placeTip(tipFor);
}, true);
window.addEventListener("resize", function(){ if (tipFor) placeTip(tipFor); });

/* --------------------------------------------------------- deeper blocks --- */

function deeper(label, html){
  if (!html) return "";
  return '<details class="deeper"><summary>' + E(label || "Go deeper") + "</summary>" +
         '<div class="dbody">' + html + "</div></details>";
}
function paras(t){
  return String(t || "").split(/\n\n+/).map(function(p){ return "<p>" + E(p) + "</p>"; }).join("");
}

/* ---------------------------------------------------------------- search --- */

var SEARCH_INDEX = [];
function buildSearch(){
  SEARCH_INDEX = [];
  SIGNS.forEach(function(s){
    var p = SIGNS_PLAIN[s.id] || {};
    SEARCH_INDEX.push({ t:s.name, d:(p.oneLine || s.drive), g:s.glyph, k:"Sign",
      c:ELEMENTS[s.element].hex, page:"wheel", sub:s.id,
      q:(s.name + " " + s.symbol + " " + s.element + " " + s.modality + " " +
         s.keywords.join(" ") + " " + s.dates).toLowerCase() });
  });
  BODIES_DATA.forEach(function(b){
    SEARCH_INDEX.push({ t:b.name, d:b.oneLine, g:b.glyph, k:"Body", c:b.color,
      page:"planets", sub:b.id,
      q:(b.name + " " + b.keywords.join(" ") + " planet body").toLowerCase() });
  });
  HOUSES_DATA.forEach(function(h){
    SEARCH_INDEX.push({ t:h.name + " · " + h.title, d:h.oneLine, g:h.glyph, k:"House",
      c:h.color, page:"houses", sub:String(h.n),
      q:(h.name + " " + h.title + " house " + h.n + " " + h.covers.join(" ")).toLowerCase() });
  });
  GLOSSARY.forEach(function(g){
    SEARCH_INDEX.push({ t:g.term, d:g.short, g:"◈", k:"Term", c:"#a78bfa",
      page:"glossary", sub:g.id, q:(g.term + " " + g.short + " " + g.cat).toLowerCase() });
  });
  PAGES.forEach(function(p){
    SEARCH_INDEX.push({ t:p.label, d:"Go to this section", g:"→", k:"Page", c:"#63d3ff",
      page:p.id, sub:null, q:p.label.toLowerCase() });
  });
  HISTORY.forEach(function(h){
    SEARCH_INDEX.push({ t:h.title, d:"Sky & Story", g:"✦", k:"Story", c:"#63d3ff",
      page:"history", sub:null, q:(h.title + " " + h.plain).toLowerCase().slice(0, 400) });
  });
}

var sHi = 0, sMatches = [];
function runSearch(q){
  q = q.trim().toLowerCase();
  var res = $("#sRes");
  if (!q){ res.innerHTML = '<div class="sempty">Type to search all 12 signs, 16 bodies, ' +
    '12 houses and ' + GLOSSARY.length + " glossary terms.</div>"; sMatches = []; return; }
  var scored = [];
  SEARCH_INDEX.forEach(function(it){
    var i = it.q.indexOf(q);
    if (i < 0) return;
    var score = (it.t.toLowerCase().indexOf(q) === 0 ? 0 : (i === 0 ? 1 : 2)) +
                (it.k === "Page" ? 0.5 : 0) + i / 1000;
    scored.push({ it:it, s:score });
  });
  scored.sort(function(a, b){ return a.s - b.s; });
  sMatches = scored.slice(0, 40).map(function(x){ return x.it; });
  sHi = 0;
  if (!sMatches.length){
    res.innerHTML = '<div class="sempty">Nothing matches “' + E(q) + "”.</div>"; return;
  }
  res.innerHTML = sMatches.map(function(m, i){
    return '<button data-i="' + i + '" class="' + (i === 0 ? "hi" : "") + '">' +
      '<span class="sg" style="--c:' + m.c + '">' + E(m.g) + "</span>" +
      "<span><span class=\"st\">" + E(m.t) + '</span><span class="sd">' + E(m.d) + "</span></span>" +
      '<span class="sk">' + E(m.k) + "</span></button>";
  }).join("");
}
function pickSearch(i){
  var m = sMatches[i];
  if (!m) return;
  closeSearch();
  go(m.page, { sub:m.sub });
  if (m.sub) applySub(m.page, m.sub);
}
var searchOpener = null;

function openSearch(){
  searchOpener = document.activeElement;
  $("#searchOverlay").classList.add("on");
  var inp = $("#sInput"); inp.value = ""; runSearch(""); setTimeout(function(){ inp.focus(); }, 30);
}
function closeSearch(){
  var ov = $("#searchOverlay");
  if (!ov.classList.contains("on")) return;
  ov.classList.remove("on");
  /* hand focus back to whatever opened it, not to the top of the document */
  if (searchOpener && document.contains(searchOpener)){
    try { searchOpener.focus(); } catch (e){}
  }
  searchOpener = null;
}

/* ------------------------------------------------------- keyboard sheet --- */

var keysOpener = null;

function openKeys(){
  keysOpener = document.activeElement;
  $("#keysOverlay").classList.add("on");
  var b = $("#keysClose");
  if (b) setTimeout(function(){ b.focus(); }, 30);
}
function closeKeys(){
  var ov = $("#keysOverlay");
  if (!ov || !ov.classList.contains("on")) return;
  ov.classList.remove("on");
  if (keysOpener && document.contains(keysOpener)){
    try { keysOpener.focus(); } catch (e){}
  }
  keysOpener = null;
}

/* Keep Tab inside whichever dialog is open — both are aria-modal, which is a
   promise the browser does not keep on its own. */
function trapFocus(e){
  if (e.key !== "Tab") return;
  var ov = $("#searchOverlay").classList.contains("on") ? $("#searchOverlay")
         : ($("#keysOverlay") && $("#keysOverlay").classList.contains("on") ? $("#keysOverlay") : null);
  if (!ov) return;
  /* No offsetParent/getBoundingClientRect check here: inside a fixed-position
     dialog those are unreliable, and the dialog is only queried while open. */
  var f = $$('a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])', ov)
    .filter(function(el){ return !el.hasAttribute("hidden"); });
  if (!f.length) return;
  var first = f[0], last = f[f.length - 1];
  if (f.indexOf(document.activeElement) === -1){
    /* focus drifted outside the dialog entirely — pull it back */
    e.preventDefault(); first.focus(); return;
  }
  if (e.shiftKey && document.activeElement === first){ e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && document.activeElement === last){ e.preventDefault(); first.focus(); }
}

/* ------------------------------------------------------------ start page --- */

var FORMULA = [
  { k:"The planet", v:"What is happening", c:"#ffd35e",
    d:"Mars = drive and conflict. Venus = attraction and value. The planet is the verb of the sentence." },
  { k:"The sign",   v:"How it happens", c:"#ff5f45",
    d:"Mars in Taurus is slow and immovable. Mars in Gemini is fast and verbal. Same drive, different style." },
  { k:"The house",  v:"Where it happens", c:"#4fb6ff",
    d:"The 6th house is work and health. The 7th is partnership. The house says which part of life it lands in." }
];

var START_CARDS = [
  { go:"wheel",   g:"◉", c:"#ff5f45", t:"The Wheel",
    d:"All twelve signs, and the geometry that groups them. Tap two to compare." },
  { go:"planets", g:"☉", c:"#ffd35e", t:"Planets & Bodies",
    d:"Sixteen celestial bodies — the real astronomy and the symbolism side by side." },
  { go:"houses",  g:"⌂", c:"#4fb6ff", t:"The Twelve Houses",
    d:"The other wheel. Twelve areas of life, fixed to the horizon at your birth." },
  { go:"aspects", g:"△", c:"#a78bfa", t:"Angles & Aspects",
    d:"Drag two points around a circle and watch the angle acquire a name." },
  { go:"chart",   g:"✧", c:"#3fdc8b", t:"Chart the Real Sky",
    d:"Where the planets actually were, computed live. Real astronomy, no forecasting." },
  { go:"history", g:"✦", c:"#63d3ff", t:"Sky & Story",
    d:"Babylon to Ptolemy to the newspaper column — and why the signs have drifted." }
];

var START_FACTS = [
  { t:"Your “sign” is a date range, not a star pattern",
    d:"A sign is a 30° slice of the Sun's yearly path. Because Earth's axis wobbles, those slices have drifted about a full sign away from the constellations they were named after, roughly 2,000 years ago. Both facts are true at once: the tropical zodiac still tracks the seasons exactly, and it no longer tracks the stars." },
  { t:"There is far more to a chart than the Sun",
    d:"The Sun sign is one of roughly forty pieces of information in a birth chart. The Moon, the Ascendant, the other eight bodies, twelve houses and the angles between them all carry weight in the tradition. Reading only the Sun is like describing a novel by its title." },
  { t:"The angles are the interesting part",
    d:"Most of what astrology actually claims lives in the relationships between points — 120° apart, 90° apart, opposite. Those relationships are pure circle geometry and they are where the system stops being a list and starts being a structure." },
  { t:"This site computes real sky positions",
    d:"The chart section runs genuine positional astronomy in your browser, fitted to NASA/JPL's DE421 ephemeris and checked against it to better than 20 arcseconds. Where the planets were is a matter of fact. What it means is a matter of tradition — and the site keeps those two things clearly separate." }
];

/* ------------------------------------------------- sign-from-date tool --- *
   The single most common question anyone brings to a zodiac site, which until
   now needed the full chart form and a city. Uses the real Sun position rather
   than a table of date ranges, so cusp dates come out right for the year in
   question instead of off by a day.                                          */

function sunSignOn(dateStr){
  var p = dateStr.split("-").map(Number);
  if (p.length !== 3 || !p[0] || !p[1] || !p[2]) return null;
  /* noon UTC — the Sun moves ~1°/day, so midday minimises the error for a
     date carrying no time of day */
  var jdUT = Astro.julianDay(p[0], p[1], p[2], 12);
  /* sunApparent() wants Julian centuries of TT, not a Julian day */
  var jdTT = jdUT + Astro.deltaT(p[0], p[1]) / 86400;
  var T = (jdTT - 2451545.0) / 36525;
  var lon = Astro.norm360(Astro.sunApparent(T));
  var idx = Math.floor(lon / 30) % 12;
  if (!SIGNS[idx]) return null;
  return { sign: SIGNS[idx], lon: lon, deg: lon % 30 };
}

/* how close is this date to a sign boundary? */
function cuspNote(r){
  var d = r.deg;
  if (d < 1) return "This is right at the start of " + r.sign.name +
    " — a few hours earlier and it would be " + SIGNS[(SIGNS.indexOf(r.sign) + 11) % 12].name + ".";
  if (d > 29) return "This is right at the end of " + r.sign.name +
    " — a few hours later and it would be " + SIGNS[(SIGNS.indexOf(r.sign) + 1) % 12].name + ".";
  return "";
}

function runSignTool(){
  var v = $("#mDate").value;
  var out = $("#mOut");
  if (!v){
    out.innerHTML = '<p class="micro-empty">Pick a date above.</p>';
    return;
  }
  var r = sunSignOn(v);
  if (!r){ out.innerHTML = '<p class="micro-empty">That date didn’t parse.</p>'; return; }
  var s = r.sign, plain = SIGNS_PLAIN[s.id] || {};
  var note = cuspNote(r);
  out.innerHTML =
    '<div class="micro-card" style="--c:' + ELEMENTS[s.element].hex + '">' +
      '<div class="mc-head">' +
        '<span class="mc-g">' + E(s.glyph) + "</span>" +
        "<div>" +
          '<div class="mc-n">' + E(s.name) + "</div>" +
          '<div class="mc-m">' + E(s.element) + " · " + E(s.modality) +
            " · ruled by " + E(s.rulers.map(function(x){ return x.body; }).join(" and ")) + "</div>" +
        "</div>" +
        '<div class="mc-pos">Sun at ' + E(fmtDeg(r.deg)) + " " + E(s.name) + "</div>" +
      "</div>" +
      '<p class="mc-d">' + E(plain.oneLine || s.drive) + "</p>" +
      (note ? '<p class="mc-cusp">' + E(note) + "</p>" : "") +
      '<div class="mc-acts">' +
        '<button class="btn" data-go="wheel" data-sub="' + E(s.id) + '">Open ' + E(s.name) + " on the wheel</button>" +
        '<button class="btn" data-go="chart">Chart the whole sky for this date</button>' +
      "</div>" +
      '<p class="mc-fine">That is the Sun’s actual position at noon UTC, not a lookup ' +
        "table — so dates on a cusp come out right for the year you asked about. " +
        "It is also one of about forty things in a full chart.</p>" +
    "</div>";
  autolink(out);
}

function fmtDeg(d){
  var deg = Math.floor(d), min = Math.round((d - deg) * 60);
  if (min === 60){ deg++; min = 0; }
  return deg + "° " + (min < 10 ? "0" : "") + min + "′";
}

function wireSignTool(){
  var inp = $("#mDate"), btn = $("#mGo");
  if (!inp || !btn) return;
  var saved = load("signToolDate", null);
  if (saved) inp.value = saved;
  btn.addEventListener("click", function(){
    store("signToolDate", inp.value);
    runSignTool();
  });
  inp.addEventListener("keydown", function(e){
    if (e.key === "Enter"){ e.preventDefault(); btn.click(); }
  });
  if (saved) runSignTool();
}

function renderStart(){
  $("#formula").innerHTML = FORMULA.map(function(f, i){
    return (i ? '<div class="fjoin">+</div>' : "") +
      '<div class="fpart" style="--fc:' + f.c + '">' +
        '<div class="fk">' + E(f.k) + "</div>" +
        '<div class="fv">' + E(f.v) + "</div>" +
        '<div class="fd">' + E(f.d) + "</div></div>";
  }).join("");
  $("#startCards").innerHTML = START_CARDS.map(function(c){
    return '<button class="tile" data-go="' + c.go + '" style="--c:' + c.c + '">' +
      '<span class="tg">' + E(c.g) + "</span>" +
      '<span class="tn">' + E(c.t) + "</span>" +
      '<span class="td">' + E(c.d) + "</span></button>";
  }).join("");
  $("#startFacts").innerHTML = START_FACTS.map(function(f){
    return '<div class="tile" style="--c:#a78bfa;cursor:default">' +
      '<span class="tn">' + E(f.t) + "</span>" +
      '<span class="td">' + E(f.d) + "</span></div>";
  }).join("");
  autolink($("#startFacts"));
  wireSignTool();
}
pageRender.start = renderStart;

/* ------------------------------------------------------------ about page --- */

var LIMITS = [
  { t:"Placidus near the poles",
    d:"Placidus houses are mathematically undefined above roughly 66° latitude — the " +
      "required semi-arc does not exist. The chart detects this, falls back to Whole " +
      "Sign, and says so in the result rather than printing a silent approximation." },
  { t:"Daylight saving before ~1970",
    d:"Time zone databases are thin and inconsistent that far back. British Double " +
      "Summer Time and pre-1966 US state-by-state rules are the usual traps. Dates " +
      "before 1970 raise a warning, and a ±1 hour correction is offered." },
  { t:"Clock times that are ambiguous or never happened",
    d:"On the night clocks go back, a local time occurs twice; on the night they go " +
      "forward, an hour of local time does not exist. Both are detected and flagged." },
  { t:"Dates far from the present",
    d:"The series is fitted for the modern era. Inside 1900–2100 expect agreement with " +
      "DE421 to better than 20 arcseconds. Outside it, expect arcminutes — sign " +
      "placements hold, precise degrees drift." },
  { t:"No birth time",
    d:"The Ascendant moves a degree every four minutes and the houses move with it. " +
      "Without a time they are withheld entirely rather than computed from a guessed " +
      "noon, because a plausible-looking wrong answer is worse than none." }
];

var CHOICES = [
  { t:"Tropical by default, sidereal available",
    d:"The tropical zodiac measures from the March equinox and tracks the seasons; the " +
      "sidereal measures from the stars. Precession has pulled them about a sign apart. " +
      "Western astrology uses tropical, most Indian astrology uses sidereal, and the " +
      "chart page will show you either." },
  { t:"Whole Sign offered first",
    d:"It is the oldest house system and the simplest to reason about. Placidus is " +
      "offered because it is the modern default, and Equal because it is the obvious " +
      "compromise. None of them is more correct than the others; they are different " +
      "conventions for slicing the same sky." },
  { t:"Classical rulerships after Ptolemy",
    d:"Where traditional and modern rulerships disagree, both are shown rather than " +
      "one being quietly picked." },
  { t:"Tight orbs for named figures",
    d:"Aspect patterns use 7° for major aspects and 3° for minor ones — tighter than " +
      "single aspects, because a figure assembled from three loose angles is mostly a " +
      "coincidence of orbs." },
  { t:"Generational clusters labelled as such",
    d:"Uranus, Neptune and Pluto take years to cross a sign, so a stellium made only of " +
      "them is shared by everyone born across a long stretch. Those are marked " +
      "generational and sorted below anything personal." }
];

function renderAbout(){
  $("#limitsList").innerHTML = LIMITS.map(function(x){
    return '<div class="limit"><h4>' + E(x.t) + "</h4><p>" + E(x.d) + "</p></div>";
  }).join("");
  $("#choicesList").innerHTML = CHOICES.map(function(x){
    return '<div class="limit choice"><h4>' + E(x.t) + "</h4><p>" + E(x.d) + "</p></div>";
  }).join("");
  autolink($("#limitsList"));
  autolink($("#choicesList"));
}
pageRender.about = renderAbout;

/* --------------------------------------------------------------- theme --- *
   Stored choice wins; otherwise follow the OS. The palette is all custom
   properties, so switching is a single attribute on <html>.                  */

function currentTheme(){
  var saved = load("theme", null);
  if (saved === "light" || saved === "dark") return saved;
  try {
    return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
  } catch (e){ return "dark"; }
}

function applyTheme(t){
  document.documentElement.setAttribute("data-theme", t);
  var meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", t === "light" ? "#f7f8fc" : "#03040c");
  var btn = $("#btnTheme"), g = $("#themeGlyph"), l = $("#themeLbl");
  if (btn) btn.setAttribute("aria-label",
    t === "light" ? "Switch to dark theme" : "Switch to light theme");
  if (g) g.textContent = t === "light" ? "◑" : "◐";
  if (l) l.textContent = t === "light" ? "Dark" : "Light";
}

function wireTheme(){
  applyTheme(currentTheme());
  var btn = $("#btnTheme");
  if (btn) btn.addEventListener("click", function(){
    var next = document.documentElement.getAttribute("data-theme") === "light" ? "dark" : "light";
    store("theme", next);
    applyTheme(next);
    announce(next === "light" ? "Light theme." : "Dark theme.");
  });
  /* follow the OS if the user has never chosen explicitly */
  try {
    window.matchMedia("(prefers-color-scheme: light)").addEventListener("change", function(e){
      if (load("theme", null) === null) applyTheme(e.matches ? "light" : "dark");
    });
  } catch (e){}
}

/* ------------------------------------------------------- read progress --- */

function wireReadBar(){
  var fill = $("#readbar i");
  if (!fill) return;
  var ticking = false;
  function update(){
    var h = document.documentElement.scrollHeight - window.innerHeight;
    var p = h > 40 ? Math.min(1, Math.max(0, window.scrollY / h)) : 0;
    fill.style.width = (p * 100).toFixed(2) + "%";
    ticking = false;
  }
  window.addEventListener("scroll", function(){
    if (!ticking){ ticking = true; requestAnimationFrame(update); }
  }, { passive:true });
  window.addEventListener("resize", update);
  update();
}

/* ═══════════════════════════════════════════════════════════════════════════
   MOBILE APP SHELL
   ═══════════════════════════════════════════════════════════════════════════ */

/* Four tabs plus More. Chosen because they're the four things people actually
   come for; the rest live one tap away rather than in a scroll strip whose
   end nobody could see. */
var TABS = [
  { id:"start",   glyph:"✶", label:"Start" },
  { id:"wheel",   glyph:"◉", label:"Wheel" },
  { id:"chart",   glyph:"✧", label:"Your Sky" },
  { id:"quiz",    glyph:"◈", label:"Quiz" }
];
var TAB_GLYPH = { start:"✶", wheel:"◉", planets:"☉", houses:"⌂", aspects:"△",
                  chart:"✧", history:"✦", quiz:"◈", glossary:"❖", about:"⚖" };

function buildTabs(){
  var bar = $("#tabbar");
  if (!bar) return;
  bar.innerHTML = TABS.map(function(t){
    return '<button class="tab" data-go="' + t.id + '" aria-label="' + E(t.label) + '">' +
      '<span class="tg" aria-hidden="true">' + t.glyph + "</span>" +
      '<span class="tl">' + E(t.label) + "</span></button>";
  }).join("") +
  '<button class="tab more" id="tabMore" aria-expanded="false" aria-label="All sections">' +
    '<span class="tg" aria-hidden="true">☰</span><span class="tl">More</span></button>';

  $("#moreList").innerHTML = PAGES.map(function(p){
    return '<button class="sheet-item" data-go="' + p.id + '">' +
      '<span class="sg" aria-hidden="true">' + (TAB_GLYPH[p.id] || "•") + "</span>" +
      '<span class="sl">' + E(p.label) + "</span></button>";
  }).join("");
}

function syncTabs(id){
  $$("#tabbar .tab[data-go]").forEach(function(b){
    if (b.dataset.go === id) b.setAttribute("aria-current", "page");
    else b.removeAttribute("aria-current");
  });
  $$("#moreList .sheet-item").forEach(function(b){
    if (b.dataset.go === id) b.setAttribute("aria-current", "page");
    else b.removeAttribute("aria-current");
  });
  /* if the active section isn't one of the four tabs, light up More instead */
  var inTabs = TABS.some(function(t){ return t.id === id; });
  var more = $("#tabMore");
  if (more){
    if (inTabs) more.removeAttribute("aria-current");
    else more.setAttribute("aria-current", "page");
  }
}

var moreOpen = false;
function openMore(){
  moreOpen = true;
  $("#moreSheet").classList.add("on");
  $("#moreSheet").setAttribute("aria-hidden", "false");
  $("#moreBackdrop").classList.add("on");
  $("#tabMore").setAttribute("aria-expanded", "true");
}
function closeMore(){
  if (!moreOpen) return;
  moreOpen = false;
  $("#moreSheet").classList.remove("on");
  $("#moreSheet").setAttribute("aria-hidden", "true");
  $("#moreBackdrop").classList.remove("on");
  $("#tabMore").setAttribute("aria-expanded", "false");
}

/* ------------------------------------------------------ header behaviour --- *
   Scrolling down is reading; the top bar isn't needed then. Scrolling up is
   navigating, so bring it back. Only below the mobile breakpoint.            */

function wireHeaderAutoHide(){
  var lastY = 0, ticking = false;
  window.addEventListener("scroll", function(){
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function(){
      var y = window.scrollY;
      if (window.innerWidth <= 820 && !moreOpen){
        if (y > lastY + 6 && y > 90) document.body.classList.add("head-hidden");
        else if (y < lastY - 6) document.body.classList.remove("head-hidden");
      } else {
        document.body.classList.remove("head-hidden");
      }
      lastY = y;
      ticking = false;
    });
  }, { passive:true });
}

/* ------------------------------------------------------------- swiping --- *
   Horizontal swipe pages between sections, the way a tabbed app does.
   Deliberately conservative: it ignores anything that started on a control
   that owns horizontal drag (the wheel, the aspect dial, a scroller), and
   requires a mostly-horizontal, fast-enough gesture so it never fights a
   vertical scroll.                                                           */

var SWIPE_MIN = 62, SWIPE_RATIO = 1.7, SWIPE_MAX_MS = 700;

function wireSwipe(){
  var x0 = 0, y0 = 0, t0 = 0, tracking = false;

  function noSwipeZone(el){
    return !!(el.closest && el.closest(
      "svg, .mx-wrap, .ac-list, #searchOverlay, #keysOverlay, #moreSheet, " +
      "#tourBox, input, select, textarea, .plist, .presets-row, .chips"));
  }

  document.addEventListener("touchstart", function(e){
    if (e.touches.length !== 1 || moreOpen) return;
    if (noSwipeZone(e.target)) return;
    tracking = true;
    x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; t0 = Date.now();
  }, { passive:true });

  document.addEventListener("touchend", function(e){
    if (!tracking) return;
    tracking = false;
    if (window.innerWidth > 820) return;
    var t = e.changedTouches[0];
    var dx = t.clientX - x0, dy = t.clientY - y0, dt = Date.now() - t0;
    if (dt > SWIPE_MAX_MS) return;
    if (Math.abs(dx) < SWIPE_MIN) return;
    if (Math.abs(dx) < Math.abs(dy) * SWIPE_RATIO) return;
    var ids = PAGES.map(function(p){ return p.id; });
    var i = ids.indexOf(current);
    if (i < 0) return;
    var next = i + (dx < 0 ? 1 : -1);
    if (next < 0 || next >= ids.length) return;
    go(ids[next]);
  }, { passive:true });
}

/* --------------------------------------------------------------- install --- */

var deferredPrompt = null;

function wireInstall(){
  var bar = $("#installBar");
  if (!bar) return;

  window.addEventListener("beforeinstallprompt", function(e){
    e.preventDefault();
    deferredPrompt = e;
    if (!load("installDismissed", false)) bar.classList.add("on");
  });

  $("#installGo").addEventListener("click", function(){
    bar.classList.remove("on");
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then(function(){ deferredPrompt = null; });
  });

  $("#installNo").addEventListener("click", function(){
    bar.classList.remove("on");
    store("installDismissed", true);
  });

  window.addEventListener("appinstalled", function(){
    bar.classList.remove("on");
    store("installDismissed", true);
    announce("Cosmic Atlas installed.");
  });
}

function registerSW(){
  if (!("serviceWorker" in navigator)) return;
  /* file:// has no service worker support and registering there throws */
  if (location.protocol === "file:") return;
  window.addEventListener("load", function(){
    navigator.serviceWorker.register("sw.js").catch(function(){
      /* not fatal — the site works without it, just without offline caching */
    });
  });
}

/* ------------------------------------------------------------------ boot --- */

function bootSite(){
  tipEl = $("#tip");
  buildNav();
  buildSearch();

  $("#btnSearch").addEventListener("click", openSearch);
  $("#searchOverlay").addEventListener("click", function(e){
    if (e.target.id === "searchOverlay") closeSearch();
  });
  $("#sInput").addEventListener("input", function(){ runSearch(this.value); });
  $("#sRes").addEventListener("click", function(e){
    var b = e.target.closest("button[data-i]");
    if (b) pickSearch(+b.dataset.i);
  });
  $("#sInput").addEventListener("keydown", function(e){
    if (e.key === "ArrowDown" || e.key === "ArrowUp"){
      e.preventDefault();
      sHi = Math.max(0, Math.min(sMatches.length - 1, sHi + (e.key === "ArrowDown" ? 1 : -1)));
      $$("#sRes button").forEach(function(b, i){ b.classList.toggle("hi", i === sHi); });
      var el = $$("#sRes button")[sHi];
      if (el) el.scrollIntoView({ block:"nearest" });
    } else if (e.key === "Enter"){ e.preventDefault(); pickSearch(sHi); }
    else if (e.key === "Escape") closeSearch();
  });

  $("#tabMore").addEventListener("click", function(){
    moreOpen ? closeMore() : openMore();
  });
  $("#moreBackdrop").addEventListener("click", closeMore);
  wireTheme();
  wireReadBar();
  wireHeaderAutoHide();
  wireSwipe();
  wireInstall();
  registerSW();

  $("#btnKeys").addEventListener("click", openKeys);
  $("#keysClose").addEventListener("click", closeKeys);
  $("#keysOverlay").addEventListener("click", function(e){
    if (e.target.id === "keysOverlay") closeKeys();
  });

  var gPending = false;

  document.addEventListener("keydown", function(e){
    trapFocus(e);

    if (e.key === "Escape"){
      closeMore(); closeKeys(); closeSearch(); hideTip();
      /* on the wheel, Escape also clears the current selection */
      if (current === "wheel" && typeof state === "object" &&
          state.selection && state.selection.length){
        state.selection = []; state.matrix = false; syncAll();
      }
    }
    var typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName);
    if (typing) return;

    if (e.key === "/" || ((e.metaKey || e.ctrlKey) && e.key === "k")){
      e.preventDefault(); openSearch(); return;
    }
    if (e.key === "?"){ e.preventDefault(); openKeys(); return; }

    /* g then a digit jumps to a section */
    if (gPending){
      gPending = false;
      var n = parseInt(e.key, 10);
      if (n >= 1 && n <= PAGES.length){ e.preventDefault(); go(PAGES[n - 1].id); return; }
    }
    if (e.key === "g"){ gPending = true; setTimeout(function(){ gPending = false; }, 1200); return; }

    /* arrows page through sections, unless something else is using them */
    if ((e.key === "ArrowLeft" || e.key === "ArrowRight") &&
        !e.metaKey && !e.ctrlKey && !e.altKey &&
        typeof tourIdx !== "undefined" && tourIdx < 0 &&
        !$("#searchOverlay").classList.contains("on") &&
        current !== "aspects"){
      var idx = PAGES.map(function(p){ return p.id; }).indexOf(current);
      var next = idx + (e.key === "ArrowRight" ? 1 : -1);
      if (idx > -1 && next >= 0 && next < PAGES.length){
        e.preventDefault();
        go(PAGES[next].id);
      }
    }
  });

  /* the initial route replaces rather than pushes, so Back from the first
     screen leaves the site instead of cycling inside it */
  routeFromHash({ replace:true });
  if (typeof restoreWheelState === "function") restoreWheelState();
}
