/* ============================================================================
   HISTORY · PRECESSION DEMO · QUIZ · GLOSSARY · GUIDED TOUR
   ==========================================================================*/

/* ═══════════════════════════════════ HISTORY ═══════════════════════════════ */

function renderHistory(){
  var out = HISTORY.map(function(h){
    var body = "";
    if (h.kind === "timeline"){
      body = '<div class="timeline">' + h.events.map(function(e){
        return '<div class="tev"><div class="ty">' + E(e.year) + "</div>" +
          '<p class="tw">' + E(e.what) + "</p>" +
          '<div class="tp">' + E(e.where) + "</div></div>";
      }).join("") + "</div>";
    } else if (h.kind === "compare"){
      body = '<table class="cmp2"><thead><tr><th></th><th>' + E(h.aLabel) +
        "</th><th>" + E(h.bLabel) + "</th></tr></thead><tbody>" +
        h.rows.map(function(r){
          return "<tr><td>" + E(r.label) + "</td><td>" + E(r.a) + "</td><td>" + E(r.b) + "</td></tr>";
        }).join("") + "</tbody></table>";
    } else if (h.kind === "fact"){
      body = '<div class="statrow">' + h.stats.map(function(s){
        return '<div class="stat"><div class="v">' + E(s.v) + "</div>" +
          '<div class="u">' + E(s.u) + "</div><div class=\"l\">" + E(s.l) + "</div></div>";
      }).join("") + "</div>";
    }
    return '<section class="hblock' + (h.kind === "note" ? " hnote" : "") + '" id="h-' + E(h.id) + '">' +
      "<h2>" + E(h.title) + "</h2>" +
      '<div class="plainbox">' + paras(h.plain) + "</div>" +
      (h.aside ? '<div class="aside">' + E(h.aside) + "</div>" : "") +
      body +
      (h.deep ? deeper("Go deeper", paras(h.deep)) : "") +
      (h.id === "precession" ? precessionDemoHTML() : "") +
      "</section>";
  }).join("");
  $("#histOut").innerHTML = out;
  wirePrecession();
  autolink($("#histOut"));
}
pageRender.history = renderHistory;

/* ---- interactive precession demo ---- */

var CONSTEL = [
  ["Pisces", 351.6, 388.7], ["Aries", 28.7, 53.4], ["Taurus", 53.4, 90.4],
  ["Gemini", 90.4, 117.9], ["Cancer", 117.9, 138.0], ["Leo", 138.0, 173.9],
  ["Virgo", 173.9, 217.8], ["Libra", 217.8, 241.1], ["Scorpius", 241.1, 247.7],
  ["Ophiuchus", 247.7, 266.6], ["Sagittarius", 266.6, 299.7],
  ["Capricornus", 299.7, 327.8], ["Aquarius", 327.8, 351.6]
];
var POLESTARS = [
  [-14000, -11000, "Vega"], [-11000, -4500, "no bright pole star"],
  [-4500, -2000, "Thuban (α Draconis)"], [-2000, -300, "Kochab (β Ursae Minoris)"],
  [-300, 3000, "Polaris (α Ursae Minoris)"], [3000, 6000, "Alrai (γ Cephei)"],
  [6000, 10000, "Alderamin (α Cephei)"], [10000, 16000, "Vega (α Lyrae)"]
];

function precessionDemoHTML(){
  return '<div class="precdemo">' +
    '<div style="font-size:11px;letter-spacing:.18em;text-transform:uppercase;' +
      'color:var(--accent);font-weight:700;margin-bottom:10px">Try it — drag the year</div>' +
    '<svg id="precSvg" viewBox="0 0 620 200" aria-label="Where the March equinox point sits among the constellations"></svg>' +
    '<label class="sr-only" for="precYear">Year, from 3000 BCE to 6000 CE</label>' +
    '<input type="range" class="slider" id="precYear" min="-3000" max="6000" step="50" ' +
      'value="2026" aria-valuetext="2026 CE">' +
    '<div class="precread">' +
      "<span>Year <b id=\"precY\">2026</b></span>" +
      "<span>March equinox in front of <b id=\"precC\">Pisces</b></span>" +
      "<span>Pole star: <b id=\"precP\">Polaris</b></span>" +
    "</div>" +
    '<p style="font-size:12.5px;color:var(--muted);line-height:1.6;margin:12px 0 0">' +
      "The <b style=\"color:#fff\">tropical sign</b> of Aries always starts at the March equinox — " +
      "that is its definition, so it never drifts. The <b style=\"color:#fff\">constellation</b> " +
      "behind it does drift, by one full sign roughly every 2,150 years. Both statements are " +
      "true; they are simply about two different things. Constellation spans are the modern " +
      "IAU boundaries and are approximate here.</p>" +
    "</div>";
}

function wirePrecession(){
  var sl = $("#precYear");
  if (!sl) return;
  function draw(){
    var year = +sl.value;
    var T = (year - 2000) / 100;
    var lon = ((-(5028.796195 * T + 1.1054348 * T * T) / 3600) % 360 + 360) % 360;
    var svg = $("#precSvg");
    svg.innerHTML = "";
    var W = 620, y0 = 58, h = 46;
    /* band: 360 degrees mapped across the width, starting at 0 Aries J2000 */
    CONSTEL.forEach(function(c, i){
      var a = c[1] % 360, b = c[2];
      var segs = (b > 360) ? [[a, 360], [0, b - 360]] : [[a, b]];
      segs.forEach(function(s){
        var x = s[0] / 360 * W, w = (s[1] - s[0]) / 360 * W;
        svg.appendChild(mk("rect", { x:x, y:y0, width:w, height:h, rx:3,
          fill:i % 2 ? "rgba(167,139,250,.15)" : "rgba(99,211,255,.13)",
          stroke:"rgba(160,175,255,.22)" }));
        if (w > 34){
          var t = mk("text", { x:x + w / 2, y:y0 + h / 2 + 4, "text-anchor":"middle",
            "font-size":"9.4", fill:"var(--text-2)", "letter-spacing":".5" });
          t.textContent = c[0].length > 9 && w < 62 ? c[0].slice(0, 7) + "…" : c[0];
          svg.appendChild(t);
        }
      });
    });
    var px = lon / 360 * W;
    svg.appendChild(mk("line", { x1:px, y1:y0 - 22, x2:px, y2:y0 + h + 22,
      stroke:"#ffd35e", "stroke-width":2.4 }));
    svg.appendChild(mk("polygon", { points:(px - 7) + "," + (y0 - 22) + " " + (px + 7) + "," +
      (y0 - 22) + " " + px + "," + (y0 - 8), fill:"#ffd35e" }));
    var lab = mk("text", { x:Math.min(Math.max(px, 60), W - 60), y:y0 - 30,
      "text-anchor":"middle", "font-size":"10.5", fill:"#ffd35e", "font-weight":"700",
      "letter-spacing":"1.4" });
    lab.textContent = "MARCH EQUINOX";
    svg.appendChild(lab);
    var t2 = mk("text", { x:4, y:y0 + h + 40, "font-size":"9.6", fill:"var(--faint)",
      "letter-spacing":"1.2" });
    t2.textContent = "THE THIRTEEN CONSTELLATIONS THE SUN ACTUALLY CROSSES — WIDTHS ARE REAL";
    svg.appendChild(t2);
    var t3 = mk("text", { x:4, y:y0 + h + 58, "font-size":"9.6", fill:"var(--faint)",
      "letter-spacing":"1.2" });
    t3.textContent = "TROPICAL SIGNS, BY CONTRAST, ARE TWELVE EXACTLY EQUAL 30° SLICES";
    svg.appendChild(t3);
    for (var k = 0; k < 12; k++){
      var x = k * 30 / 360 * W;
      svg.appendChild(mk("rect", { x:x, y:y0 + h + 66, width:W / 12 - 1.6, height:13, rx:2,
        fill:ELEMENTS[SIGNS[k].element].hex, opacity:".3" }));
      var g = mk("text", { x:x + W / 24, y:y0 + h + 76, "text-anchor":"middle",
        "font-size":"9", fill:"#fff", opacity:".8",
        "font-family":'"Segoe UI Symbol","Apple Symbols","Noto Sans Symbols 2",serif' });
      g.textContent = SIGNS[k].glyph;
      svg.appendChild(g);
    }
    var name = "Pisces";
    CONSTEL.forEach(function(c){
      var a = c[1], b = c[2], L = lon;
      if (b > 360 && L < b - 360) L += 360;
      if (L >= a && L < b) name = c[0];
    });
    var ps = "—";
    POLESTARS.forEach(function(p){ if (year >= p[0] && year < p[1]) ps = p[2]; });
    $("#precY").textContent = (year < 0 ? Math.abs(year) + " BCE" : year + " CE");
    $("#precC").textContent = name;
    $("#precP").textContent = ps;
    sl.setAttribute("aria-valuetext", (year < 0 ? Math.abs(year) + " BCE" : year + " CE") +
      ", equinox in " + name);
  }
  sl.addEventListener("input", draw);
  draw();
}

/* ═══════════════════════════════════ QUIZ ══════════════════════════════════ */

var QCATS = [
  ["all","Everything"], ["basics","Basics"], ["elements","Elements"],
  ["modalities","Modalities"], ["rulers","Rulers"], ["aspects","Aspects"],
  ["houses","Houses"], ["astronomy","Astronomy"]
];
var qCat = "all", qSet = [], qIdx = 0, qScore = 0, qAnswered = false, qWrong = [];
var QLEN = 10;

function shuffle(a){
  a = a.slice();
  for (var i = a.length - 1; i > 0; i--){
    var j = Math.floor(Math.random() * (i + 1));
    var t = a[i]; a[i] = a[j]; a[j] = t;
  }
  return a;
}

/* Shuffle a question's choices and remap the answer index, so answer POSITION
   carries no information. The source data is 52% option B; without this a
   player who always picks B scores above half knowing nothing. */
function shuffleChoices(q){
  var order = shuffle(q.choices.map(function(_, i){ return i; }));
  return {
    q: q.q, cat: q.cat, why: q.why,
    choices: order.map(function(i){ return q.choices[i]; }),
    a: order.indexOf(q.a)
  };
}

var qBest = load("quizBest", {});   /* cat -> best percentage */

function startQuiz(){
  var pool = QUIZ.filter(function(q){ return qCat === "all" || q.cat === qCat; });
  qSet = shuffle(pool).slice(0, Math.min(QLEN, pool.length)).map(shuffleChoices);
  qIdx = 0; qScore = 0; qWrong = []; qAnswered = false;
  drawQuiz();
}

/* Replay only the ones that were missed — qWrong was already collected, it
   just had nowhere to go. */
function retryMissed(){
  if (!qWrong.length) return;
  qSet = shuffle(qWrong).map(shuffleChoices);
  qIdx = 0; qScore = 0; qWrong = []; qAnswered = false;
  drawQuiz();
}

function recordBest(){
  if (!qSet.length) return;
  var pct = Math.round(qScore / qSet.length * 100);
  if (!(qCat in qBest) || pct > qBest[qCat]){
    qBest[qCat] = pct;
    store("quizBest", qBest);
  }
}

function drawQuiz(){
  var wrap = $("#quizOut");
  var cats = '<div class="gcats">' + QCATS.map(function(c){
    var best = qBest[c[0]];
    return '<button class="chip ghost' + (qCat === c[0] ? " on" : "") + '" data-qc="' + c[0] +
      '" aria-pressed="' + (qCat === c[0]) + '">' + E(c[1]) +
      (best != null ? '<span class="qbest">' + best + "%</span>" : "") + "</button>";
  }).join("") + "</div>";

  if (qIdx >= qSet.length){
    var pct = qSet.length ? Math.round(qScore / qSet.length * 100) : 0;
    var prevBest = qBest[qCat];
    var beat = prevBest != null && pct > prevBest;
    recordBest();
    var msg = pct === 100 ? "Perfect. You know the structure."
      : pct >= 80 ? "Strong. The framework is in place."
      : pct >= 50 ? "Solid start — the misses below are the ones worth re-reading."
      : "Early days. Everything here is on the other pages.";
    wrap.innerHTML = cats +
      '<div class="qcard qdone">' +
        '<div class="big">' + qScore + "<span style=\"font-size:26px;opacity:.5\">/" +
          qSet.length + "</span></div>" +
        '<div class="sub">' + E(msg) + "</div>" +
        (beat ? '<div class="sub" style="color:var(--ok);font-weight:600">' +
                "New best for this category — was " + prevBest + "%.</div>" : "") +
        '<div style="display:flex;gap:9px;flex-wrap:wrap;justify-content:center">' +
          '<button class="btn primary" data-qgo="again">Play again</button>' +
          (qWrong.length
            ? '<button class="btn" data-qgo="missed">Retry the ' + qWrong.length +
              " missed</button>" : "") +
        "</div>" +
      "</div>" +
      (qWrong.length
        ? "<h3 class=\"sec\">Worth another look</h3>" + qWrong.map(function(q){
            return '<div class="qcard"><p class="qq" style="font-size:15.5px">' + E(q.q) + "</p>" +
              "<p style=\"font-size:14px;color:var(--ok);font-weight:600;margin:0 0 8px\">" +
              E(q.choices[q.a]) + "</p>" +
              "<p style=\"font-size:13.4px;color:var(--text-2);line-height:1.65;margin:0\">" +
              E(q.why) + "</p></div>";
          }).join("")
        : "");
    autolink(wrap);
    return;
  }

  var q = qSet[qIdx];
  wrap.innerHTML = cats +
    '<div class="qcard">' +
      '<div class="qmeta">' +
        '<div class="qscore"><b>' + (qIdx + 1) + "</b> of " + qSet.length +
          ' &nbsp;·&nbsp; score <b>' + qScore + "</b></div>" +
        '<div class="qbar"><i style="width:' + (qIdx / qSet.length * 100) + '%"></i></div>' +
        '<span class="mini">' + E(q.cat) + "</span>" +
      "</div>" +
      '<p class="qq">' + E(q.q) + "</p>" +
      '<div class="qchoices">' + q.choices.map(function(c, i){
        return '<button class="qch" data-qa="' + i + '">' +
          '<span class="ix">' + "ABCD"[i] + "</span><span>" + E(c) + "</span></button>";
      }).join("") + "</div>" +
      '<div class="qwhy" id="qWhy"></div>' +
    "</div>";
}

function answerQuiz(i){
  if (qAnswered) return;
  qAnswered = true;
  var q = qSet[qIdx];
  var right = i === q.a;
  if (right) qScore++; else qWrong.push(q);
  $$(".qch").forEach(function(b, k){
    b.disabled = true;
    if (k === q.a) b.classList.add("right");
    else if (k === i) b.classList.add("wrong");
  });
  announce(right ? "Correct." : "Not quite. The answer is " + q.choices[q.a] + ".");
  var w = $("#qWhy");
  w.innerHTML = "<b>" + (right ? "Correct. " : "Not quite — the answer is " +
    E(q.choices[q.a]) + ". ") + "</b>" + E(q.why) +
    '<div style="margin-top:13px"><button class="btn primary" data-qgo="next" ' +
    'style="padding:9px 18px;font-size:13px">' +
    (qIdx + 1 >= qSet.length ? "See results" : "Next question") + " →</button></div>";
  w.classList.add("on");
  autolink(w);
  var nb = w.querySelector("[data-qgo]");
  if (nb) nb.focus();
}

document.addEventListener("click", function(e){
  var c = e.target.closest("[data-qc]");
  if (c){ qCat = c.dataset.qc; startQuiz(); return; }
  var a = e.target.closest("[data-qa]");
  if (a){ answerQuiz(+a.dataset.qa); return; }
  var g = e.target.closest("[data-qgo]");
  if (g){
    if (g.dataset.qgo === "again") startQuiz();
    else if (g.dataset.qgo === "missed") retryMissed();
    else { qIdx++; qAnswered = false; drawQuiz(); }
  }
});
pageRender.quiz = startQuiz;

/* ═══════════════════════════════════ GLOSSARY ══════════════════════════════ */

var GCATS = [["all","All"], ["basic","Basics"], ["aspect","Aspects"], ["chart","Chart"],
             ["body","Bodies"], ["house","Houses"], ["technique","Technique"],
             ["astronomy","Astronomy"]];
var gCat = "all", gQuery = "";

function renderGlossary(){
  $("#gCats").innerHTML = GCATS.map(function(c){
    return '<button class="chip ghost' + (gCat === c[0] ? " on" : "") + '" data-gc="' + c[0] +
      '" aria-pressed="' + (gCat === c[0]) + '">' + E(c[1]) + "</button>";
  }).join("");
  var q = gQuery.trim().toLowerCase();
  var list = GLOSSARY.filter(function(g){
    if (gCat !== "all" && g.cat !== gCat) return false;
    if (!q) return true;
    return (g.term + " " + g.short + " " + g.full).toLowerCase().indexOf(q) > -1;
  });
  $("#gList").innerHTML = list.length ? list.map(function(g){
    return '<div class="gitem" id="g-' + E(g.id) + '">' +
      "<h4>" + E(g.term) + '<span class="gc">' + E(g.cat) + "</span></h4>" +
      '<p class="gs">' + E(g.short) + "</p>" +
      '<p class="gf">' + E(g.full) + "</p>" +
      ((g.see && g.see.length)
        ? '<div class="gsee">' + g.see.filter(function(s){ return GMAP[s]; }).map(function(s){
            return '<button data-gsee="' + E(s) + '">' + E(GMAP[s].term) + "</button>";
          }).join("") + "</div>"
        : "") +
      "</div>";
  }).join("") : '<p style="color:var(--muted)">No terms match that.</p>';
}
pageRender.glossary = renderGlossary;

function focusTerm(id){
  if (!GMAP[id]) return false;
  gCat = "all"; gQuery = "";
  var gq = $("#gq"); if (gq) gq.value = "";
  renderGlossary();
  setTimeout(function(){
    var el = document.getElementById("g-" + id);
    if (!el) return;
    el.scrollIntoView({ behavior:scrollBehavior(), block:"center" });
    el.classList.add("flash");
    setTimeout(function(){ el.classList.remove("flash"); }, 2200);
  }, 60);
}

document.addEventListener("click", function(e){
  var c = e.target.closest("[data-gc]");
  if (c){ gCat = c.dataset.gc; renderGlossary(); return; }
  var s = e.target.closest("[data-gsee]");
  if (s) focusTerm(s.dataset.gsee);
});
document.addEventListener("input", function(e){
  if (e.target.id === "gq"){ gQuery = e.target.value; renderGlossary(); }
});

/* ═══════════════════════════════════ TOUR ═════════════════════════════════ */

var TOUR = [
  { page:"start", sel:"#formula", title:"Three parts, one sentence",
    text:"Everything astrology says is built from a planet, a sign and a house. Planet = what. Sign = how. House = where. That is the entire grammar." },
  { page:"wheel", sel:"#wheelCard", title:"Twelve signs on a circle",
    text:"The wheel is a 360° circle cut into twelve equal 30° slices. Order matters — each sign is a deliberate correction of the one before it. Tap any sign to open its profile." },
  { page:"wheel", sel:"#wheelControls", title:"The groupings are geometry",
    text:"Turn on an element and watch a triangle appear: signs of the same element sit exactly 120° apart. Modalities make squares at 90°. Polarity pairs sit opposite at 180°. The categories are not arbitrary labels — they are shapes.",
    run:function(){ state.elements = new Set(["Fire"]); state.modalities = new Set();
      state.oppositions = new Set(); state.selection = []; state.rays = false;
      syncChips(); renderAspects(); syncAll(); } },
  { page:"planets", sel:"#plDetail", title:"Planets are the verbs",
    text:"A sign on its own does nothing. The planets are what act — and each one has real astronomy attached, listed right alongside the symbolism so you can see which is which.",
    run:function(){ showBody("mars", true); } },
  { page:"houses", sel:"#hwheel", title:"Houses are the second wheel",
    text:"Signs are slices of the sky; houses are slices of your day, fixed to the horizon where and when you were born. The dashed line is the horizon. The left-hand point is the Ascendant — the sign coming up as you arrived.",
    run:function(){ showHouse(1, true); } },
  { page:"aspects", sel:"#adial", title:"Aspects are just angles",
    text:"Drag the two markers. When the gap hits 120° it is a trine, 90° a square, 180° an opposition. Every named aspect divides the circle by a small whole number, and everything else has no name at all." },
  { page:"chart", sel:"#chartForm", title:"Now the real sky",
    text:"Put in a date, a time and a place and this computes where the planets actually were — genuine positional astronomy, verified against NASA's DE421 ephemeris. It labels the positions in astrological language, and never predicts anything." },
  { page:"history", sel:"#h-precession", title:"Why the signs drifted",
    text:"Earth's axis wobbles over about 25,772 years, so the equinox slides backwards through the constellations. Drag the year slider to watch it move. This is why your tropical sign and the constellation behind it no longer agree." },
  { page:"quiz", sel:".quizwrap", title:"Check it stuck",
    text:"Ten questions at a time, with an explanation on every answer. Getting one wrong is the fastest way to find the page you should re-read." },
  { page:"glossary", sel:"#gList", title:"Every term, defined",
    text:"Any dotted-underlined word on this site opens its definition where you stand. The full list lives here. Press / anywhere to search the whole site. That is the tour — go and poke at things." }
];

var tourIdx = -1;

function tourGo(i){
  if (i < 0 || i >= TOUR.length) return endTour();
  tourIdx = i;
  store("tourStep", i);
  var s = TOUR[i];
  go(s.page, { noScroll:false });
  setTimeout(function(){
    if (s.run) try { s.run(); } catch (err){}
    $("#tStep").textContent = "Step " + (i + 1) + " of " + TOUR.length;
    $("#tTitle").textContent = s.title;
    $("#tText").textContent = s.text;
    $("#tDots").innerHTML = TOUR.map(function(_, k){
      return "<i class=\"" + (k === i ? "on" : "") + "\"></i>"; }).join("");
    $("#tPrev").disabled = i === 0;
    $("#tNext").textContent = i === TOUR.length - 1 ? "Finish" : "Next";
    $("#tourBox").classList.add("on");
    spot(s.sel);
  }, 90);
}
/* Measure after the scroll actually settles rather than guessing with a
   timeout — on a slow device the old 340ms could measure a stale rect and
   drop the highlight in the wrong place. */
function spot(sel){
  var el = document.querySelector(sel), sp = $("#tourSpot");
  if (!el){ sp.classList.remove("on"); return; }
  el.scrollIntoView({ behavior:scrollBehavior(), block:"center" });

  var lastTop = null, still = 0, frames = 0;
  function place(){
    var r = el.getBoundingClientRect(), pad = 8;
    sp.style.left = (r.left - pad) + "px";
    sp.style.top = (r.top - pad) + "px";
    sp.style.width = (r.width + pad * 2) + "px";
    sp.style.height = (r.height + pad * 2) + "px";
    sp.classList.add("on");
  }
  function settle(){
    var top = el.getBoundingClientRect().top;
    if (lastTop !== null && Math.abs(top - lastTop) < 0.5) still++;
    else still = 0;
    lastTop = top;
    frames++;
    place();                                  /* track it the whole way down */
    if (still < 3 && frames < 90) requestAnimationFrame(settle);
  }
  requestAnimationFrame(settle);
}
function endTour(){
  if (tourIdx >= 0 && tourIdx < TOUR.length - 1) store("tourStep", tourIdx);
  else store("tourStep", 0);
  tourIdx = -1;
  $("#tourBox").classList.remove("on");
  $("#tourSpot").classList.remove("on");
}

/* Resume where they stopped rather than restarting a ten-step tour. */
function startTour(){
  var saved = load("tourStep", 0);
  tourGo(saved > 0 && saved < TOUR.length ? saved : 0);
}

function tourLabel(){
  var saved = load("tourStep", 0);
  return (saved > 0 && saved < TOUR.length)
    ? "Resume tour · step " + (saved + 1) + " of " + TOUR.length
    : "Start the guided tour";
}

function wireTour(){
  $("#btnTour").addEventListener("click", startTour);
  $("#btnTour").setAttribute("title", tourLabel());
  $$('[data-tour]').forEach(function(b){
    b.addEventListener("click", startTour);
    var saved = load("tourStep", 0);
    if (saved > 0 && saved < TOUR.length)
      b.innerHTML = "✧ &nbsp;Resume the tour · step " + (saved + 1) + " of " + TOUR.length;
  });
  $("#tNext").addEventListener("click", function(){ tourGo(tourIdx + 1); });
  $("#tPrev").addEventListener("click", function(){ tourGo(tourIdx - 1); });
  $("#tEnd").addEventListener("click", endTour);
  window.addEventListener("resize", function(){
    if (tourIdx >= 0) spot(TOUR[tourIdx].sel);
  });
  document.addEventListener("keydown", function(e){
    if (tourIdx < 0) return;
    if (e.key === "ArrowRight") tourGo(tourIdx + 1);
    else if (e.key === "ArrowLeft") tourGo(tourIdx - 1);
    else if (e.key === "Escape") endTour();
  });
}
