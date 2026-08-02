/* ============================================================================
   PLANETS · HOUSES · ASPECTS
   ==========================================================================*/

var SVGNS = "http://www.w3.org/2000/svg";
function mk(n, a){
  var e = document.createElementNS(SVGNS, n);
  for (var k in a) if (a[k] != null) e.setAttribute(k, a[k]);
  return e;
}
function polar(cx, cy, r, thetaDeg){
  var t = thetaDeg * Math.PI / 180;
  return [cx + r * Math.cos(t), cy + r * Math.sin(t)];
}
function arcPath(cx, cy, r1, r2, a1, a2){
  /* wedge between screen angles a1 -> a2 (a2 < a1, going anticlockwise visually) */
  var p1 = polar(cx, cy, r2, a1), p2 = polar(cx, cy, r2, a2),
      p3 = polar(cx, cy, r1, a2), p4 = polar(cx, cy, r1, a1);
  var large = Math.abs(a1 - a2) > 180 ? 1 : 0;
  return "M" + p1[0] + "," + p1[1] +
         "A" + r2 + "," + r2 + " 0 " + large + " 0 " + p2[0] + "," + p2[1] +
         "L" + p3[0] + "," + p3[1] +
         "A" + r1 + "," + r1 + " 0 " + large + " 1 " + p4[0] + "," + p4[1] + "Z";
}

/* ═══════════════════════════════════ PLANETS ═══════════════════════════════ */

var BMAP = {};
BODIES_DATA.forEach(function(b){ BMAP[b.id] = b; });

var CLS_LABEL = {
  luminary:"Luminaries", personal:"Personal", social:"Social",
  outer:"Outer / generational", minor:"Minor bodies"
};
var CLS_NOTE = {
  luminary:"The Sun and Moon. Not planets astronomically — the tradition calls them lights, and gives them the most weight.",
  personal:"Fast movers. They change sign within weeks, so they differ from person to person even among people born the same year.",
  social:"Jupiter and Saturn sit between the personal and the generational — roughly a year and two-and-a-half years per sign.",
  outer:"Uranus, Neptune and Pluto take 7 to 20 years to cross a single sign, so everyone born in the same stretch shares them. The tradition reads them as generational rather than personal.",
  minor:"Asteroids and other small bodies added to the tradition in the last two centuries. None has a universally agreed rulership; different schools use them differently."
};
var plFilter = "all";
var plCurrent = "sun";

function renderPlanets(){
  var cats = ["all","luminary","personal","social","outer","minor"];
  $("#plFilter").innerHTML = cats.map(function(c){
    return '<button class="chip ghost' + (c === plFilter ? " on" : "") + '" data-plf="' + c +
      '" aria-pressed="' + (c === plFilter) + '">' +
      E(c === "all" ? "All 16" : CLS_LABEL[c]) + "</button>";
  }).join("");
  var list = BODIES_DATA.filter(function(b){ return plFilter === "all" || b.cls === plFilter; });
  $("#plGrid").innerHTML = list.map(function(b){
    return '<button class="tile" data-plb="' + b.id + '" style="--c:' + b.color + '">' +
      '<span class="tg">' + E(b.glyph) + "</span>" +
      '<span class="tn">' + E(b.name) + "</span>" +
      '<span class="tm">' + E(CLS_LABEL[b.cls].split(" ")[0]) + "</span>" +
      '<span class="td">' + E(b.oneLine) + "</span></button>";
  }).join("");
  showBody(plCurrent, true);
}

function digRow(label, val, note){
  if (!val || (val.length === 0)) return "";
  var v = Array.isArray(val) ? val.join(", ") : val;
  return "<tr><th>" + E(label) + "</th><td><b>" + E(v) + "</b>" +
         (note ? ' <span style="opacity:.7">— ' + E(note) + "</span>" : "") + "</td></tr>";
}

function showBody(id, keep){
  var b = BMAP[id];
  if (!b) return false;
  plCurrent = id;
  var modern = b.rules.length ? b.rules.join(" and ") : null;
  var trad = b.rulesTrad.length ? b.rulesTrad.join(" and ") : null;
  var ruleLine = "";
  if (!modern && !trad) ruleLine = "No agreed rulership — this body was added to the tradition too recently for one.";
  else if (modern && trad && modern === trad) ruleLine = "Rules " + modern + " in both the traditional and the modern system.";
  else ruleLine = (modern ? "Modern ruler of " + modern + ". " : "") +
                  (trad ? "Traditional ruler of " + trad + "." : "");

  if (!keep) announce(b.name + " details shown.");
  $("#plDetail").innerHTML =
    '<div class="pl-detail" style="--c:' + b.color + '">' +
      '<div class="pl-head">' +
        '<div class="pg">' + E(b.glyph) + "</div>" +
        "<div style=\"min-width:0\">" +
          "<h2>" + E(b.name) + "</h2>" +
          '<p class="pone">' + E(b.oneLine) + "</p>" +
          '<div class="chiprow">' +
            '<span class="mini on" style="--c:' + b.color + '">' + E(CLS_LABEL[b.cls]) + "</span>" +
            '<span class="mini">' + E(b.speed) + " mover</span>" +
            '<span class="mini">' + E(b.perSign) + " per sign</span>" +
          "</div>" +
        "</div>" +
      "</div>" +
      '<div class="pl-body">' +
        '<div class="plainbox">' + paras(b.plain) + "</div>" +
        deeper("Go deeper", paras(b.deep)) +

        '<div class="factgrid">' +
          '<div class="fact"><div class="fl">Full circuit</div><div class="fv">' + E(b.cycle) + "</div></div>" +
          '<div class="fact"><div class="fl">Time per sign</div><div class="fv">' + E(b.perSign) + "</div></div>" +
          '<div class="fact"><div class="fl">Discovered</div><div class="fv">' + E(b.discovered) + "</div></div>" +
          '<div class="fact"><div class="fl">Retrograde</div><div class="fv"><small>' + E(b.retro) + "</small></div></div>" +
        "</div>" +

        "<h3 class=\"sec\" style=\"margin-top:22px\">What it governs</h3>" +
        '<div class="chiprow" style="margin-bottom:12px">' +
          b.keywords.map(function(k){ return '<span class="mini">' + E(k) + "</span>"; }).join("") +
        "</div>" +
        "<p style=\"font-size:13.8px;color:var(--text-2);line-height:1.68;margin:0 0 4px\">" +
          E(b.inChart) + "</p>" +

        "<h3 class=\"sec\">Rulership &amp; dignity</h3>" +
        "<p style=\"font-size:13.5px;color:var(--text-2);margin:0 0 10px;line-height:1.6\">" +
          E(ruleLine) + "</p>" +
        (b.exalt || b.detriment.length || b.fall.length ?
          '<table class="dig-table">' +
            digRow("Exaltation", b.exalt, "where the tradition says it works at its best") +
            digRow("Detriment", b.detriment, "the sign opposite the one it rules") +
            digRow("Fall", b.fall, "opposite its exaltation") +
          "</table>" : "") +

        "<h3 class=\"sec\">The actual astronomy</h3>" +
        '<ul class="astro-list" style="--c:' + b.color + '">' +
          b.astronomy.map(function(a){ return "<li><span>" + E(a) + "</span></li>"; }).join("") +
        "</ul>" +

        '<div class="notice calm" style="margin-top:20px">' + E(CLS_NOTE[b.cls]) + "</div>" +
      "</div>" +
    "</div>";
  autolink($("#plDetail"));
  $$("[data-plb]").forEach(function(t){ t.style.outline = t.dataset.plb === id ? "1px solid " + b.color : ""; });
  if (!keep){
    var d = $("#plDetail");
    if (d) d.scrollIntoView({ behavior:scrollBehavior(), block:"start" });
    writeHash("#/planets/" + id, true);
  }
}

document.addEventListener("click", function(e){
  var f = e.target.closest("[data-plf]");
  if (f){ plFilter = f.dataset.plf; renderPlanets(); return; }
  var b = e.target.closest("[data-plb]");
  if (b) showBody(b.dataset.plb);
});
pageRender.planets = renderPlanets;

/* ═══════════════════════════════════ HOUSES ════════════════════════════════ */

var HMAP = {};
HOUSES_DATA.forEach(function(h){ HMAP[h.n] = h; });
var hCurrent = 1;

var SVH = [
  { g:"☉", c:"#ffd35e", t:"A planet is WHAT", p:"The actor. Mars is drive, Venus is attraction, Mercury is thinking. Ten of them, each a different kind of energy.",
    ex:"“Mars” — the part of you that pushes." },
  { g:"♈", c:"#ff5f45", t:"A sign is HOW", p:"The style the planet acts in. Twelve of them, each a 30° slice of the Sun's yearly path. Signs modify; they do not act.",
    ex:"“Mars in Libra” — pushing, but politely." },
  { g:"⌂", c:"#4fb6ff", t:"A house is WHERE", p:"The area of life it plays out in. Twelve of them, set by the horizon at your exact birth time and place — which is why the time matters so much.",
    ex:"“Mars in Libra in the 6th” — at work." }
];

function renderHouses(){
  $("#svhGrid").innerHTML = SVH.map(function(v){
    return '<div class="vs" style="--c:' + v.c + '">' +
      "<h4><span>" + E(v.g) + "</span>" + E(v.t) + "</h4>" +
      "<p>" + E(v.p) + "</p>" +
      '<div class="ex">' + E(v.ex) + "</div></div>";
  }).join("");
  drawHouseWheel();
  showHouse(hCurrent, true);
  autolink($("#svhGrid"));
}

function drawHouseWheel(){
  var svg = $("#hwheel");
  svg.innerHTML = "";
  var cx = 350, cy = 350, R1 = 128, R2 = 292, R3 = 238;

  svg.appendChild(mk("circle", { cx:cx, cy:cy, r:R2, fill:"url(#voidGrad)", stroke:"rgba(160,175,255,.14)" }));

  HOUSES_DATA.forEach(function(h){
    var a1 = 180 - (h.n - 1) * 30, a2 = 180 - h.n * 30;
    var g = mk("g", { class:"hseg", "data-h":h.n, style:"--c:" + h.color,
      tabindex:"0", role:"button", "aria-label":"House " + h.n + ", " + h.title });
    g.appendChild(mk("path", { class:"hs-fill", d:arcPath(cx, cy, R1, R2, a1, a2) }));
    var e1 = polar(cx, cy, R1, a1), e2 = polar(cx, cy, R2, a1);
    g.appendChild(mk("line", { class:"hs-line", x1:e1[0], y1:e1[1], x2:e2[0], y2:e2[1] }));
    var mid = 180 - (h.n - 0.5) * 30;
    var pn = polar(cx, cy, R3, mid);
    var t1 = mk("text", { class:"hs-num", x:pn[0], y:pn[1] + 6 }); t1.textContent = h.n;
    g.appendChild(t1);
    var pl = polar(cx, cy, R3 - 32, mid);
    var t2 = mk("text", { class:"hs-lab", x:pl[0], y:pl[1] + 3 });
    t2.textContent = h.title.length > 14 ? h.title.split(" ")[0] : h.title;
    g.appendChild(t2);
    var pg = polar(cx, cy, R1 + 24, mid);
    var t3 = mk("text", { class:"hs-gl", x:pg[0], y:pg[1] + 5 });
    t3.textContent = SIGNS.filter(function(s){ return s.name === h.naturalSign; })[0].glyph;
    g.appendChild(t3);
    svg.appendChild(g);
  });

  svg.appendChild(mk("circle", { cx:cx, cy:cy, r:R1, fill:"rgba(6,8,22,.72)", stroke:"rgba(160,175,255,.18)" }));

  [[180, "ASC", 0, -8], [270, "MC", 0, -12], [0, "DSC", 0, -8], [90, "IC", 0, 16]].forEach(function(a){
    var p = polar(cx, cy, R2 + 20, a[0]);
    var t = mk("text", { class:"axis-lab", x:p[0] + a[2], y:p[1] + a[3] });
    t.textContent = a[1];
    svg.appendChild(t);
  });
  var hz = mk("line", { x1:cx - R2 - 6, y1:cy, x2:cx + R2 + 6, y2:cy,
    stroke:"rgba(231,235,255,.4)", "stroke-width":1.2, "stroke-dasharray":"5 6" });
  svg.appendChild(hz);
  var mr = mk("line", { x1:cx, y1:cy - R2 - 6, x2:cx, y2:cy + R2 + 6,
    stroke:"rgba(231,235,255,.22)", "stroke-width":1, "stroke-dasharray":"5 6" });
  svg.appendChild(mr);

  var lbl = mk("text", { x:cx, y:cy - 8, "text-anchor":"middle",
    fill:"#fff", "font-size":"13", "font-weight":"640", "letter-spacing":"2" });
  lbl.textContent = "HOUSES";
  svg.appendChild(lbl);
  var lbl2 = mk("text", { x:cx, y:cy + 12, "text-anchor":"middle",
    fill:"var(--muted)", "font-size":"9.5", "letter-spacing":"2.4" });
  lbl2.textContent = "TAP A SECTOR";
  svg.appendChild(lbl2);
  var lbl3 = mk("text", { x:cx, y:cy + 34, "text-anchor":"middle",
    fill:"var(--faint)", "font-size":"8.6", "letter-spacing":"1.6" });
  lbl3.textContent = "horizon = the dashed line";
  svg.appendChild(lbl3);
}

function showHouse(n, keep){
  var h = HMAP[n];
  if (!h) return false;
  hCurrent = n;
  $$(".hseg").forEach(function(g){ g.classList.toggle("sel", +g.dataset.h === n); });
  var sign = SIGNS.filter(function(s){ return s.name === h.naturalSign; })[0];
  $("#hDetail").innerHTML =
    '<div class="pl-detail" style="--c:' + h.color + '">' +
      '<div class="pl-head">' +
        '<div class="pg" style="font-size:26px">' + E(h.glyph) + "</div>" +
        "<div><h2>" + E(h.name) + "</h2>" +
        '<p class="pone">' + E(h.oneLine) + "</p>" +
        '<div class="chiprow">' +
          '<span class="mini on" style="--c:' + h.color + '">' + E(h.title) + "</span>" +
          '<span class="mini">' + E(h.angular) + "</span>" +
          '<span class="mini">natural sign ' + E(sign.glyph + " " + h.naturalSign) + "</span>" +
        "</div></div>" +
      "</div>" +
      '<div class="pl-body">' +
        '<div class="plainbox">' + paras(h.plain) + "</div>" +
        deeper("Go deeper", paras(h.deep)) +
        '<div class="notice calm" style="font-style:italic">' + E(h.question) + "</div>" +
        "<h3 class=\"sec\">What lands here</h3>" +
        '<div class="chiprow">' + h.covers.map(function(c){
          return '<span class="mini">' + E(c) + "</span>"; }).join("") + "</div>" +
        (h.cusp ? "<h3 class=\"sec\">The cusp has a name</h3><p style=\"font-size:13.6px;" +
          "color:var(--text-2);line-height:1.65;margin:0\">" + E(h.cusp) + "</p>" : "") +
        '<div style="margin-top:20px;display:flex;gap:8px;flex-wrap:wrap">' +
          '<button class="btn" style="padding:8px 14px;font-size:12.5px" data-h="' +
            (n === 1 ? 12 : n - 1) + '">← House ' + (n === 1 ? 12 : n - 1) + "</button>" +
          '<button class="btn" style="padding:8px 14px;font-size:12.5px" data-h="' +
            (n === 12 ? 1 : n + 1) + '">House ' + (n === 12 ? 1 : n + 1) + " →</button>" +
          '<button class="btn" style="padding:8px 14px;font-size:12.5px" data-go="wheel" data-sub="' +
            sign.id + '">' + E(sign.glyph) + " " + E(h.naturalSign) + " profile</button>" +
        "</div>" +
      "</div></div>";
  autolink($("#hDetail"));
  if (!keep) writeHash("#/houses/" + n, true);
}

document.addEventListener("click", function(e){
  var g = e.target.closest("[data-h]");
  if (g) showHouse(+g.dataset.h);
});
document.addEventListener("keydown", function(e){
  if ((e.key === "Enter" || e.key === " ") && document.activeElement &&
      document.activeElement.classList && document.activeElement.classList.contains("hseg")){
    e.preventDefault(); showHouse(+document.activeElement.dataset.h);
  }
});
pageRender.houses = renderHouses;

/* ═══════════════════════════════════ ASPECTS ═══════════════════════════════ */

var ASPECT_LIST = [
  { deg:0,   name:"Conjunction",  sym:"☌", c:"#ffffff", orb:8,
    d:"Same place. The two bodies fuse — you cannot separate their effects.", div:"—" },
  { deg:30,  name:"Semi-sextile", sym:"⚺", c:"#8b93c4", orb:2,
    d:"Neighbouring signs, which share nothing. Mild friction, easy to miss.", div:"circle ÷ 12" },
  { deg:60,  name:"Sextile",      sym:"⚹", c:"#4fe6d0", orb:4,
    d:"Complementary elements. Opportunity — but somebody has to act on it.", div:"circle ÷ 6" },
  { deg:90,  name:"Square",       sym:"□", c:"#ff6fc4", orb:8,
    d:"Same modality, incompatible elements. Tension that forces movement.", div:"circle ÷ 4" },
  { deg:120, name:"Trine",        sym:"△", c:"#3fdc8b", orb:8,
    d:"Same element. The easiest aspect — and the one most likely to be wasted.", div:"circle ÷ 3" },
  { deg:150, name:"Quincunx",     sym:"⚻", c:"#a988ff", orb:3,
    d:"Nothing in common at all. Requires conscious translation.", div:"circle ÷ 2.4" },
  { deg:180, name:"Opposition",   sym:"☍", c:"#ff5f45", orb:8,
    d:"Facing each other across the wheel. Two halves of one function.", div:"circle ÷ 2" }
];

var aPos = [12, 132], aDrag = -1;

function aTheta(lon){ return 180 - lon; }

function drawDial(){
  var svg = $("#adial");
  svg.innerHTML = "";
  var cx = 320, cy = 320, R = 232, RI = 196;

  svg.appendChild(mk("circle", { cx:cx, cy:cy, r:R, fill:"url(#voidGrad)",
    stroke:"rgba(160,175,255,.16)" }));
  SIGNS.forEach(function(s, i){
    svg.appendChild(mk("path", { d:arcPath(cx, cy, RI, R, aTheta(i * 30), aTheta(i * 30 + 30)),
      fill:ELEMENTS[s.element].hex, opacity:".1" }));
  });
  svg.appendChild(mk("circle", { cx:cx, cy:cy, r:RI, fill:"none", stroke:"rgba(160,175,255,.09)" }));

  for (var d = 0; d < 360; d += 5){
    var p1 = polar(cx, cy, R, aTheta(d));
    var p2 = polar(cx, cy, R - (d % 30 === 0 ? 15 : 6), aTheta(d));
    svg.appendChild(mk("line", { x1:p1[0], y1:p1[1], x2:p2[0], y2:p2[1],
      stroke:"rgba(160,175,255," + (d % 30 === 0 ? ".34" : ".13") + ")",
      "stroke-width":d % 30 === 0 ? 1.3 : 0.8 }));
  }
  SIGNS.forEach(function(s, i){
    var p = polar(cx, cy, (R + RI) / 2, aTheta(i * 30 + 15));
    var t = mk("text", { x:p[0], y:p[1] + 6, "text-anchor":"middle", "font-size":"17",
      fill:ELEMENTS[s.element].hex, opacity:".85",
      "font-family":'"Segoe UI Symbol","Apple Symbols","Noto Sans Symbols 2",serif' });
    t.textContent = s.glyph;
    svg.appendChild(t);
  });

  var g = mk("g", { id:"aLine" });
  svg.appendChild(g);
  [0, 1].forEach(function(i){
    var hg = mk("g", { class:"ahandle", "data-i":i, tabindex:"0", role:"slider",
      style:"--c:" + (i ? "#63d3ff" : "#ffd35e"),
      "aria-label":(i ? "Second" : "First") + " point, degree " + Math.round(aPos[i]),
      "aria-valuenow":Math.round(aPos[i]), "aria-valuemin":"0", "aria-valuemax":"359" });
    hg.appendChild(mk("circle", { r:23, cx:0, cy:0 }));
    var t = mk("text", { x:0, y:7 });
    t.textContent = i ? "B" : "A";
    hg.appendChild(t);
    svg.appendChild(hg);
  });
  updateDial();
}

/* Magnetic snapping. The payoff of this widget is watching the angle acquire
   a name, so landing exactly on 120° should be easy rather than fiddly. Pull
   the dragged marker to a named separation when it comes within SNAP_PULL of
   one. Hold Shift to drag freely. */
var SNAP_PULL = 2.5;
var snapOn = true;

function snapAngle(raw, which, freeDrag){
  if (!snapOn || freeDrag) return raw;
  var other = aPos[which === 0 ? 1 : 0];
  var best = null;
  ASPECT_LIST.forEach(function(a){
    /* the target sits at ±a.deg from the other marker */
    [other + a.deg, other - a.deg].forEach(function(target){
      target = (target % 360 + 360) % 360;
      /* shortest angular distance between raw and the target */
      var d = Math.abs(((raw - target + 540) % 360) - 180);
      if (d <= SNAP_PULL && (!best || d < best.d)) best = { d:d, target:target };
    });
  });
  return best ? best.target : raw;
}

document.addEventListener("change", function(e){
  if (e.target && e.target.id === "aSnap"){
    snapOn = e.target.checked;
    store("snapAngles", snapOn);
  }
});

function nearestAspect(sep){
  var best = null;
  ASPECT_LIST.forEach(function(a){
    var o = Math.abs(sep - a.deg);
    if (o <= a.orb && (!best || o < best.orb)) best = { a:a, orb:o };
  });
  return best;
}

function updateDial(){
  var cx = 320, cy = 320, RH = 148;
  [0, 1].forEach(function(i){
    var h = $('.ahandle[data-i="' + i + '"]');
    if (!h) return;
    var p = polar(cx, cy, RH, aTheta(aPos[i]));
    h.setAttribute("transform", "translate(" + p[0] + "," + p[1] + ")");
    h.setAttribute("aria-valuenow", Math.round(aPos[i]));
  });
  var sep = Math.abs(aPos[0] - aPos[1]) % 360;
  if (sep > 180) sep = 360 - sep;
  var hit = nearestAspect(sep);
  var col = hit ? hit.a.c : "#5b628f";

  var g = $("#aLine");
  g.innerHTML = "";
  var p1 = polar(cx, cy, RH, aTheta(aPos[0])), p2 = polar(cx, cy, RH, aTheta(aPos[1]));
  var ln = mk("line", { x1:p1[0], y1:p1[1], x2:p2[0], y2:p2[1], stroke:col,
    "stroke-width":hit ? 3.4 : 1.6, "stroke-linecap":"round",
    "stroke-dasharray":hit ? "" : "5 7", opacity:hit ? ".95" : ".5" });
  if (hit) ln.setAttribute("filter", "url(#softGlow)");
  g.appendChild(ln);
  [aPos[0], aPos[1]].forEach(function(L){
    var a = polar(cx, cy, RH, aTheta(L)), b = polar(cx, cy, 232, aTheta(L));
    g.appendChild(mk("line", { x1:a[0], y1:a[1], x2:b[0], y2:b[1], stroke:col,
      "stroke-width":1, opacity:".28", "stroke-dasharray":"3 5" }));
  });
  var mid = (aPos[0] + aPos[1]) / 2;
  if (Math.abs(aPos[0] - aPos[1]) > 180) mid += 180;
  var mp = polar(cx, cy, 62, aTheta(mid));
  var tx = mk("text", { x:cx, y:cy + 8, "text-anchor":"middle", "font-size":"34",
    fill:"#fff", "font-weight":"300" });
  tx.textContent = sep.toFixed(1) + "°";
  g.appendChild(tx);

  var sgn = function(L){ return SIGNS[Math.floor(L / 30)]; };
  $("#aRead").innerHTML =
    '<div class="big">' + sep.toFixed(1) + "°</div>" +
    (hit
      ? '<div class="aname" style="--ac:' + hit.a.c + '">' + E(hit.a.sym + " " + hit.a.name) + "</div>" +
        '<div class="aorb">' + (hit.orb < 0.05 ? "exact" : "orb " + hit.orb.toFixed(1) + "°") +
          " · allowed up to " + hit.a.orb + "°</div>" +
        "<p style=\"font-size:13.4px;color:var(--text-2);line-height:1.65;margin:13px 0 0\">" +
          E(hit.a.d) + "</p>"
      : '<div class="aname" style="--ac:#5b628f">No major aspect</div>' +
        '<div class="aorb">nothing within orb</div>' +
        "<p style=\"font-size:13.4px;color:var(--text-2);line-height:1.65;margin:13px 0 0\">" +
          "Most pairs of points are not in aspect at all. The tradition only counts a handful " +
          "of angles, and only when the two are close enough to that exact angle — that " +
          "tolerance is called the orb.</p>") +
    '<div style="margin-top:15px;padding-top:13px;border-top:1px solid var(--stroke);' +
      'font-size:12.4px;color:var(--muted);line-height:1.6">' +
      "<b style=\"color:#ffd35e\">A</b> " + E(sgn(aPos[0]).glyph + " " + sgn(aPos[0]).name) +
      " " + (aPos[0] % 30).toFixed(1) + "° &nbsp;·&nbsp; " +
      "<b style=\"color:#63d3ff\">B</b> " + E(sgn(aPos[1]).glyph + " " + sgn(aPos[1]).name) +
      " " + (aPos[1] % 30).toFixed(1) + "°</div>";

  $$("#aLegend button").forEach(function(b){
    b.classList.toggle("on", hit && +b.dataset.deg === hit.a.deg);
  });
}

function renderAspectsPage(){
  $("#aLegend").innerHTML = ASPECT_LIST.map(function(a){
    return '<button data-deg="' + a.deg + '" style="--ac:' + a.c + '">' +
      '<span class="sw"></span><span>' + E(a.sym + " " + a.name) + "</span>" +
      '<span class="dg">' + a.deg + "°</span></button>";
  }).join("");
  drawDial();
  $("#aWhy").innerHTML = [
    { t:"They divide the circle evenly", d:"Every classical aspect is 360° divided by a small whole number: 2 gives the opposition, 3 the trine, 4 the square, 6 the sextile. The system is built on simple fractions of a circle, which is why Kepler — an actual astronomer — found it interesting enough to write about." },
    { t:"They line up with the elements", d:"Because there are twelve signs, 120° is exactly four signs, and every fourth sign shares an element. That is why a trine feels harmonious in the tradition: it is a fire sign talking to a fire sign. Squares are three signs apart, which lands on the same modality but a clashing element." },
    { t:"Orb is the tolerance", d:"Two planets are almost never at exactly 120°. The orb is how far off exact the tradition will still count it — usually up to 8° for the major aspects and 2-3° for the minor ones. Tighter orb, stronger the aspect is said to be." },
    { t:"Some angles mean nothing", d:"There is no name for 47°, or 100°. Points at those distances are simply not in aspect. This is worth saying out loud, because it means most pairs in any given chart are doing nothing at all with each other." }
  ].map(function(c){
    return '<div class="tile" style="--c:#a78bfa;cursor:default"><span class="tn">' +
      E(c.t) + '</span><span class="td">' + E(c.d) + "</span></div>";
  }).join("");
  autolink($("#aWhy"));
}

(function wireDial(){
  function pt(e, svg){
    var r = svg.getBoundingClientRect();
    var x = (e.touches ? e.touches[0].clientX : e.clientX) - r.left;
    var y = (e.touches ? e.touches[0].clientY : e.clientY) - r.top;
    return [x / r.width * 640, y / r.height * 640];
  }
  function angleAt(p){
    var th = Math.atan2(p[1] - 320, p[0] - 320) * 180 / Math.PI;
    var lon = (180 - th) % 360;
    return (lon + 360) % 360;
  }
  document.addEventListener("pointerdown", function(e){
    var h = e.target.closest(".ahandle");
    if (!h) return;
    aDrag = +h.dataset.i;
    h.setPointerCapture && h.setPointerCapture(e.pointerId);
    e.preventDefault();
  });
  document.addEventListener("pointermove", function(e){
    if (aDrag < 0) return;
    var svg = $("#adial");
    if (!svg) return;
    aPos[aDrag] = snapAngle(angleAt(pt(e, svg)), aDrag, e.shiftKey);
    updateDial();
    e.preventDefault();
  });
  document.addEventListener("pointerup", function(){ aDrag = -1; });
  document.addEventListener("keydown", function(e){
    var h = document.activeElement;
    if (!h || !h.classList || !h.classList.contains("ahandle")) return;
    var i = +h.dataset.i, step = e.shiftKey ? 5 : 1;
    if (e.key === "ArrowLeft" || e.key === "ArrowDown"){ aPos[i] = (aPos[i] - step + 360) % 360; }
    else if (e.key === "ArrowRight" || e.key === "ArrowUp"){ aPos[i] = (aPos[i] + step) % 360; }
    else return;
    e.preventDefault(); updateDial();
  });
  document.addEventListener("click", function(e){
    var b = e.target.closest("#aLegend button");
    if (!b) return;
    aPos[1] = (aPos[0] + (+b.dataset.deg)) % 360;
    updateDial();
  });
})();
pageRender.aspects = function(){
  renderAspectsPage();
  snapOn = load("snapAngles", true) !== false;
  var box = document.getElementById("aSnap");
  if (box) box.checked = snapOn;
};

/* let the wheel page be addressed by sign id */
/* Accepts "aries" or a pair, "aries+libra" — the wheel's best feature is the
   comparison, and until now it couldn't be linked to. */
function selectSignById(id){
  var parts = String(id).split(/[+,]/).slice(0, 2);
  var idx = parts.map(function(p){
    return SIGNS.findIndex(function(s){ return s.id === p.trim().toLowerCase(); });
  });
  if (idx.some(function(i){ return i < 0; })) return false;
  state.selection = idx;
  state.matrix = false;
  syncAll();
}
