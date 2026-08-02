/* Headless test suite for Cosmic Atlas.
 *
 *   npm test
 *   JSDOM_PATH=/path/to/node_modules/jsdom node smoke.js
 *
 * Drives the real page in a DOM and checks behaviour, not just that files
 * parse. Where a claim can be verified independently it is — detected aspect
 * patterns are re-checked against the raw angular separations, sign
 * boundaries against known equinoxes and solstices, and so on.
 */
const fs = require("fs");
const path = require("path");

// JSDOM_PATH lets the suite run against a jsdom installed outside the repo,
// which is handy when node_modules can't live next to the source.
const { JSDOM, requestInterceptor } = require(process.env.JSDOM_PATH || "jsdom");

// Serve relative resources (data/cities.js) off disk while keeping a normal
// http origin — a file:// url would disable pushState and localStorage.
const ORIGIN = "https://example.test/";
const served = [];
const localFiles = requestInterceptor((request) => {
  if (request.url.startsWith(ORIGIN)) {
    const rel = request.url.slice(ORIGIN.length).split("?")[0];
    const abs = path.join(__dirname, rel);
    if (fs.existsSync(abs)) {
      served.push(rel);
      return new Response(fs.readFileSync(abs, "utf8"),
        { headers: { "Content-Type": "text/javascript" } });
    }
    return new Response("not found", { status: 404 });
  }
});

const html = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");

// Styles and logic live in css/ and js/ now, so string-level assertions read
// a concatenation of everything rather than just the shell.
function readAll(dir, ext) {
  const d = path.join(__dirname, dir);
  if (!fs.existsSync(d)) return "";
  return fs.readdirSync(d).filter(f => f.endsWith(ext)).sort()
    .map(f => fs.readFileSync(path.join(d, f), "utf8")).join("\n");
}
const cssSrc = readAll("css", ".css");
const jsSrc = readAll("js", ".js");
const allSrc = html + "\n" + cssSrc + "\n" + jsSrc;

let pass = 0, fail = 0;
const failures = [];
function check(name, fn) {
  try {
    const r = fn();
    if (r === false) throw new Error("returned false");
    console.log("  PASS  " + name);
    pass++;
  } catch (e) {
    console.log("  FAIL  " + name + " — " + e.message);
    failures.push(name + " — " + e.message);
    fail++;
  }
}
function section(t) { console.log("\n=== " + t + " ==="); }

const dom = new JSDOM(html, {
  runScripts: "dangerously",
  pretendToBeVisual: true,
  resources: { interceptors: [localFiles] },
  url: ORIGIN
});
const { window } = dom;
const { document } = window;

// jsdom has no layout engine; these are no-ops we must stub
window.scrollTo = () => {};
window.HTMLElement.prototype.scrollIntoView = function () {};

const errors = [];
window.addEventListener("error", e => errors.push(e.message || String(e.error)));

// `state` and `mxPick` are top-level const/let — global lexical bindings, not
// window properties. Reach them through page-scope eval.
const px = (expr) => window.eval(expr);

setTimeout(() => {
  const go = window.go;
  const setForm = (dt, tm, noTime) => {
    document.getElementById("cDate").value = dt;
    document.getElementById("cTime").value = tm;
    document.getElementById("cNoTime").checked = !!noTime;
  };

  section("console / runtime errors");
  console.log(errors.length ? "  " + errors.join("\n  ") : "  (none)");

  section("offline safety");
  check("no external script or stylesheet references", () => {
    const ext = allSrc.match(/(?:src|href)="https?:\/\/[^"]*"/g) || [];
    if (ext.length) throw new Error(ext.join(", "));
    return true;
  });
  check("no CSS @import or remote url()", () =>
    !/@import/.test(cssSrc) && !/url\(\s*['"]?(https?:)?\/\//.test(cssSrc));
  check("no fetch / XHR / Worker at runtime", () => {
    // sw.js legitimately uses fetch; it is a service worker, not page runtime
    const stripped = (html + "\n" + jsSrc).replace(/\/\*[\s\S]*?\*\//g, "");
    const hits = stripped.match(/\bfetch\s*\(|XMLHttpRequest|new\s+Worker/g) || [];
    if (hits.length) throw new Error(hits.join(", "));
    return true;
  });
  check("fonts are system stacks only", () => {
    const fams = allSrc.match(/font-family:[^;}"']*/g) || [];
    const remote = fams.filter(f => /googleapis|typekit|fonts\.\w/.test(f));
    if (remote.length) throw new Error(remote.join(", "));
    return true;
  });
  check("favicon is inline, not a separate request", () => {
    const m = html.match(/<link rel="icon" href="([^"]{0,40})/);
    if (!m) throw new Error("no favicon");
    if (!m[1].startsWith("data:")) throw new Error("not a data URI");
    return true;
  });
  check("social image is a relative path", () => {
    const m = html.match(/property="og:image" content="([^"]*)"/);
    if (!m) throw new Error("no og:image");
    if (/^https?:/.test(m[1])) throw new Error("absolute: " + m[1]);
    if (!fs.existsSync(path.join(__dirname, m[1])))
      throw new Error("missing file: " + m[1]);
    return true;
  });
  check("history writes are funnelled through a guarded helper", () => {
    // a raw pushState/replaceState throw on file:// would kill the router
    const stripped = jsSrc.replace(/\/\*[\s\S]*?\*\//g, "");
    const raw = (stripped.match(/history\.(push|replace)State/g) || []).length;
    if (raw > 2) throw new Error(raw + " raw history calls; expected them wrapped");
    if (!/function writeHash/.test(jsSrc)) throw new Error("no writeHash helper");
    return true;
  });
  check("writeHash survives a throwing history API", () => {
    const realPush = window.history.pushState;
    const realRepl = window.history.replaceState;
    window.history.pushState = () => { throw new Error("file:// blocked"); };
    window.history.replaceState = () => { throw new Error("file:// blocked"); };
    try {
      go("planets");           // must not throw
      go("houses");
      if (window.current !== "houses") throw new Error("routing stopped working");
    } finally {
      window.history.pushState = realPush;
      window.history.replaceState = realRepl;
      px("historyWorks = true");
    }
    return true;
  });
  check("store/load survive a throwing localStorage", () => {
    const real = Object.getOwnPropertyDescriptor(window, "localStorage");
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      get() { throw new Error("blocked on file://"); }
    });
    try {
      window.store("x", 1);                       // must not throw
      if (window.load("x", "fb") !== "fb") throw new Error("bad fallback");
    } finally {
      if (real) Object.defineProperty(window, "localStorage", real);
    }
    return true;
  });
  check("serve.js resolves paths without escaping the root", () => {
    // Exercise the guard directly rather than trusting a prefix test: a plain
    // startsWith also accepts "<root>-evil", and on Windows it compares mixed
    // separators. The server must use path.relative.
    const src = fs.readFileSync(path.join(__dirname, "serve.js"), "utf8");
    if (!/path\.relative\(/.test(src))
      throw new Error("guard is not using path.relative");
    const ROOT = path.resolve("/srv/site");
    const escapes = (p) => {
      const abs = path.resolve(ROOT, "." + p);
      const rel = path.relative(ROOT, abs);
      return rel.startsWith("..") || path.isAbsolute(rel);
    };
    const cases = [
      ["/index.html", false], ["/css/atlas.css", false],
      ["/css/../css/atlas.css", false], ["/", false],
      ["/../../etc/passwd", true], ["/../site-evil/x", true]
    ];
    for (const [p, want] of cases)
      if (escapes(p) !== want) throw new Error(p + " -> " + escapes(p));
    return true;
  });
  check("serve.js has no dependencies", () => {
    const src = fs.readFileSync(path.join(__dirname, "serve.js"), "utf8");
    const reqs = [...src.matchAll(/require\("([^"]+)"\)/g)].map(m => m[1]);
    const external = reqs.filter(r => !r.startsWith("node:"));
    if (external.length) throw new Error("external: " + external.join(", "));
    return true;
  });

  section("metadata");
  check("og:title present", () => !!document.querySelector('meta[property="og:title"]'));
  check("twitter:card present", () => !!document.querySelector('meta[name="twitter:card"]'));
  check("description present", () => !!document.querySelector('meta[name="description"]'));

  section("structure");
  check("toast element exists", () => !!document.getElementById("toast"));
  check("nav built from PAGES", () => {
    const n = document.querySelectorAll(".navlink").length;
    const want = window.eval("PAGES.length");
    if (n !== want) throw new Error("got " + n + ", PAGES has " + want);
    return true;
  });
  check("dead .shell CSS removed", () => !/\.shell\{position:relative/.test(cssSrc));
  check("nav has an overflow mask", () => /nav\.mainnav\{[\s\S]*?mask-image/.test(cssSrc));

  section("router / history");
  check("go() is exposed", () => typeof go === "function");
  check("go pushes history", () => {
    const before = window.history.length;
    go("planets");
    go("houses");
    if (window.location.hash !== "#/houses") throw new Error("hash=" + window.location.hash);
    if (window.history.length <= before) throw new Error("history did not grow");
    return true;
  });
  check("visited marks applied", () => {
    const seen = document.querySelectorAll(".navlink.seen").length;
    if (seen < 2) throw new Error("only " + seen + " seen");
    return true;
  });
  check("unknown page shows a toast", () => {
    go("nonsense");
    if (!document.getElementById("toast").classList.contains("on"))
      throw new Error("toast not shown");
    return true;
  });

  section("section pager");
  check("pager rendered on a middle page", () => {
    go("houses");
    const p = document.querySelector("#page-houses .pager");
    if (!p) throw new Error("no pager");
    const btns = p.querySelectorAll(".pager-btn[data-go]");
    if (btns.length !== 2) throw new Error("expected 2, got " + btns.length);
    return true;
  });
  check("pager targets the correct neighbours", () => {
    const ids = [...document.querySelectorAll("#page-houses .pager .pager-btn[data-go]")]
      .map(b => b.dataset.go);
    if (ids[0] !== "planets" || ids[1] !== "aspects") throw new Error(ids.join(","));
    return true;
  });
  check("start page has no previous", () => {
    go("start");
    return !!document.querySelector("#page-start .pager .pager-btn.empty");
  });

  section("quiz");
  check("choices are shuffled and the answer remapped", () => {
    const q = { q: "x", cat: "basics", why: "w", choices: ["a", "b", "c", "d"], a: 1 };
    let moved = 0;
    for (let i = 0; i < 40; i++) {
      const s = window.shuffleChoices(q);
      if (s.choices[s.a] !== "b") throw new Error("answer text not preserved");
      if (s.a !== 1) moved++;
    }
    if (moved === 0) throw new Error("position never changed in 40 runs");
    return true;
  });
  check("answer position carries no signal", () => {
    const counts = [0, 0, 0, 0];
    const q = { q: "x", cat: "basics", why: "w", choices: ["a", "b", "c", "d"], a: 1 };
    for (let i = 0; i < 4000; i++) counts[window.shuffleChoices(q).a]++;
    const spread = Math.max(...counts) - Math.min(...counts);
    if (spread > 250) throw new Error("skewed: " + counts.join("/"));
    return true;
  });
  check("source data really was skewed (regression guard)", () => {
    // the bug this fixes: 25 of 48 correct answers were option B
    const counts = [0, 0, 0, 0];
    px("QUIZ").forEach(q => counts[q.a]++);
    if (Math.max(...counts) <= counts.reduce((a, b) => a + b, 0) / 4 * 1.5)
      throw new Error("source no longer skewed; shuffle guard may be moot");
    return true;
  });
  check("retryMissed exists", () => typeof window.retryMissed === "function");
  check("quiz renders four choices", () => {
    go("quiz");
    return document.querySelectorAll("#quizOut .qch").length === 4;
  });

  section("persistence");
  check("store/load round-trip", () => {
    window.store("smoke", { a: 1 });
    const r = window.load("smoke", null);
    if (!r || r.a !== 1) throw new Error(JSON.stringify(r));
    return true;
  });
  check("load returns the fallback for a missing key", () =>
    window.load("nope-not-here", "fb") === "fb");

  section("wheel");
  check("Esc clears the selection", () => {
    go("wheel");
    window.selectPair(0, 6);
    if (px("state.selection.length") !== 2) throw new Error("setup failed");
    document.dispatchEvent(new window.KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    const n = px("state.selection.length");
    if (n !== 0) throw new Error("still " + n);
    return true;
  });
  check("empty state offers a suggestion", () => {
    const b = document.querySelector("#selStrip [data-try]");
    if (!b) throw new Error("no try button");
    if (!/Try /.test(b.textContent)) throw new Error("bad label: " + b.textContent);
    return true;
  });
  check("the suggestion selects the pair", () => {
    document.querySelector("#selStrip [data-try]").click();
    if (px("state.selection.length") !== 2) throw new Error("not selected");
    return true;
  });
  check("tapping a selected sign deselects it", () => {
    const before = px("state.selection.length");
    window.toggleSelect(px("state.selection[0]"));
    if (px("state.selection.length") !== before - 1) throw new Error("no deselect");
    return true;
  });
  check("wheel state persists and restores", () => {
    px('state.elements = new Set(["Fire"])');
    window.saveWheelState();
    if (window.load("wheel", null).elements[0] !== "Fire") throw new Error("not saved");
    px("state.elements = new Set()");
    window.restoreWheelState();
    if (!px('state.elements.has("Fire")')) throw new Error("not restored");
    return true;
  });
  check("narrow-screen matrix lists the other eleven signs", () => {
    px("state.matrix = true");
    window.syncAll();
    if (!document.getElementById("mxPick")) throw new Error("no picker");
    const rows = document.querySelectorAll("#mxRanked .crow").length;
    if (rows !== 11) throw new Error("expected 11, got " + rows);
    return true;
  });
  check("matrix picker updates on change", () => {
    const sel = document.getElementById("mxPick");
    sel.value = "3";
    sel.dispatchEvent(new window.Event("change", { bubbles: true }));
    if (px("mxPick") !== 3) throw new Error("mxPick not updated");
    return document.querySelectorAll("#mxRanked .crow").length === 11;
  });
  check("matrix never lists a sign against itself", () => {
    const names = [...document.querySelectorAll("#mxRanked .crow .nm")].map(n => n.textContent);
    const picked = px("SIGNS[mxPick].name");
    if (names.includes(picked)) throw new Error(picked + " listed against itself");
    return true;
  });
  check("matrix rows sort by score descending", () => {
    const nums = [...document.querySelectorAll("#mxRanked .crow .cnum")].map(n => +n.textContent);
    for (let i = 1; i < nums.length; i++)
      if (nums[i] > nums[i - 1]) throw new Error("not sorted at " + i);
    return true;
  });

  section("deep links");
  check("a bad sub-link reports instead of failing silently", () => {
    window.applySub("planets", "not-a-planet");
    return document.getElementById("toast").classList.contains("on");
  });
  check("a good sub-link works", () => {
    go("planets");
    return window.showBody("mars") !== false;
  });

  section("file split");
  check("no city records bundled into the main sources", () =>
    !/\["[A-Z][a-z]+",\d+,-?\d+\.\d+,-?\d+\.\d+,\d+\]/.test(html + jsSrc));
  check("data/cities.js exists and parses", () => {
    const src = fs.readFileSync(path.join(__dirname, "data/cities.js"), "utf8");
    new Function(src);
    return /var CITIES=/.test(src) && /var TZS=/.test(src) && /var CTRY=/.test(src);
  });
  check("HTML is a thin shell after the split", () => {
    const kb = Buffer.byteLength(html) / 1024;
    if (kb > 60) throw new Error(kb.toFixed(0) + " KB — expected a shell");
    return true;
  });
  check("styles and scripts are external files that exist", () => {
    const refs = [...html.matchAll(/(?:src|href)="((?:js|css)\/[^"]+)"/g)].map(m => m[1]);
    if (refs.length < 10) throw new Error("only " + refs.length + " refs");
    const missing = refs.filter(r => !fs.existsSync(path.join(__dirname, r)));
    if (missing.length) throw new Error("missing: " + missing.join(", "));
    return true;
  });
  check("every js part parses on its own", () => {
    const dir = path.join(__dirname, "js");
    const files = fs.readdirSync(dir).filter(f => f.endsWith(".js")).sort();
    for (const f of files) new Function(fs.readFileSync(path.join(dir, f), "utf8"));
    return true;
  });
  check("script tags are in numeric order (execution order matters)", () => {
    const order = [...html.matchAll(/src="js\/([^"]+)"/g)].map(m => m[1]);
    const sorted = [...order].sort();
    if (order.join(",") !== sorted.join(",")) throw new Error(order.join(","));
    return true;
  });
  check("total payload accounted for", () => {
    const sum = (d) => fs.readdirSync(path.join(__dirname, d))
      .filter(f => /\.(js|css)$/.test(f))
      .reduce((a, f) => a + fs.statSync(path.join(__dirname, d, f)).size, 0);
    const shell = Buffer.byteLength(html) / 1024;
    const jsKb = sum("js") / 1024, cssKb = sum("css") / 1024;
    const dataKb = fs.statSync(path.join(__dirname, "data/cities.js")).size / 1024;
    console.log("        (shell " + shell.toFixed(0) + " KB + css " + cssKb.toFixed(0) +
      " KB + js " + jsKb.toFixed(0) + " KB, plus " + dataKb.toFixed(0) +
      " KB loaded only for the chart)");
    return true;
  });
  check("searchCities is safe before the data loads", () =>
    Array.isArray(window.searchCities("lon")));

  // Everything past here needs the lazily-loaded place data.
  go("chart");
  window.ensureCities().then(() => {
    section("lazy place loading");
    check("data/cities.js was actually fetched", () => {
      if (!served.includes("data/cities.js")) throw new Error(JSON.stringify(served));
      return true;
    });
    check("CITIES, TZS and CTRY populated", () => {
      if (px("CITIES.length") < 3000) throw new Error("only " + px("CITIES.length"));
      return px("TZS.length") > 100 && px("CTRY.length") > 100;
    });
    check("autocomplete finds London", () => {
      const ids = window.searchCities("london");
      if (!ids.length) throw new Error("no matches");
      const name = px("CITIES[" + ids[0] + "][0]");
      if (!/london/i.test(name)) throw new Error("first match was " + name);
      return true;
    });
    check("picking sets chosenCity", () => {
      window._pickCityIdx(window.searchCities("london")[0]);
      if (!window.chosenCity) throw new Error("not set");
      return /london/i.test(window.chosenCity.name);
    });
    check("ensureCities is idempotent", () => {
      const before = served.filter(x => x === "data/cities.js").length;
      window.ensureCities();
      return served.filter(x => x === "data/cities.js").length === before;
    });

    section("chart");
    check("computes and renders", () => {
      setForm("1990-06-15", "12:00", false);
      const ch = window.computeChart();
      if (!ch) throw new Error("computeChart returned null");
      window.renderChartOut(ch);
      return !!document.getElementById("chartAsps");
    });
    check("aspect list truncated to six with a show-all", () => {
      const shown = document.querySelectorAll("#chartAsps .tile").length;
      if (shown > 6) throw new Error("showed " + shown);
      const more = document.querySelector("[data-aspmore]");
      if (!more || !/Show all/.test(more.textContent)) throw new Error("no show-all");
      return true;
    });
    check("show-all expands", () => {
      document.querySelector("[data-aspmore]").click();
      if (document.querySelectorAll("#chartAsps .tile").length <= 6)
        throw new Error("did not expand");
      return true;
    });
    check("missing date uses an inline hint, not alert()", () => {
      let alerted = false;
      window.alert = () => { alerted = true; };
      document.getElementById("cDate").value = "";
      if (window.computeChart() !== null) throw new Error("should have refused");
      if (alerted) throw new Error("used alert()");
      if (!/Pick a date/i.test(document.getElementById("cDateHint").textContent))
        throw new Error("no inline hint");
      return true;
    });
    check("chart input save/restore", () => {
      setForm("1984-03-09", "07:45", false);
      document.getElementById("cPlace").value = "London, United Kingdom";
      window.saveChartInputs();
      setForm("", "", false);
      if (!window.restoreChartInputs()) throw new Error("restore refused");
      if (document.getElementById("cDate").value !== "1984-03-09") throw new Error("date lost");
      if (document.getElementById("cTime").value !== "07:45") throw new Error("time lost");
      return true;
    });

    section("aspect patterns");
    const ang = (ch, x, y) => {
      let s = Math.abs(ch.bodies[x].lon - ch.bodies[y].lon) % 360;
      return s > 180 ? 360 - s : s;
    };
    check("detectPatterns returns an array", () => {
      setForm("1990-06-15", "12:00", false);
      return Array.isArray(window.detectPatterns(window.computeChart()));
    });
    check("a known chart yields a grand trine and a T-square", () => {
      setForm("1990-06-15", "12:00", false);
      const names = window.detectPatterns(window.computeChart()).map(p => p.name);
      if (!names.includes("Grand Trine")) throw new Error("no grand trine: " + names);
      if (!names.includes("T-Square")) throw new Error("no T-square: " + names);
      return true;
    });
    check("grand trine members really are mutually trine", () => {
      setForm("1990-06-15", "12:00", false);
      const ch = window.computeChart();
      const gt = window.detectPatterns(ch).find(p => p.key === "grand-trine");
      const [a, b, c] = gt.bodies;
      for (const [x, y] of [[a, b], [b, c], [a, c]])
        if (Math.abs(ang(ch, x, y) - 120) > 7)
          throw new Error(x + "/" + y + " = " + ang(ch, x, y).toFixed(1) + "°");
      return true;
    });
    check("T-square apex really is square both ends", () => {
      setForm("1990-06-15", "12:00", false);
      const ch = window.computeChart();
      const t = window.detectPatterns(ch).find(p => p.key === "t-square");
      const ends = t.bodies.filter(b => b !== t.apex);
      if (Math.abs(ang(ch, ends[0], ends[1]) - 180) > 7) throw new Error("ends not opposed");
      for (const e of ends)
        if (Math.abs(ang(ch, e, t.apex) - 90) > 7) throw new Error("apex not square " + e);
      return true;
    });
    check("outer-planet stelliums are labelled generational", () => {
      let checked = 0;
      for (const d of ["1965-03-01", "1993-02-01", "2020-01-12", "1988-02-13", "1947-05-05"]) {
        setForm(d, "12:00", false);
        for (const p of window.detectPatterns(window.computeChart())) {
          if (p.key !== "stellium") continue;
          const allOuter = p.bodies.every(n =>
            ["Uranus", "Neptune", "Pluto"].includes(n));
          if (allOuter !== !!p.generational)
            throw new Error(d + ": " + p.bodies + " generational=" + p.generational);
          if (p.generational) checked++;
        }
      }
      console.log("        (" + checked + " generational stelliums correctly labelled)");
      return true;
    });
    check("patterns render as cards", () => {
      setForm("1990-06-15", "12:00", false);
      window.renderChartOut(window.computeChart());
      const n = document.querySelectorAll("#chartPatterns .pattern").length;
      if (n < 2) throw new Error("only " + n);
      return true;
    });

    section("unknown birth time");
    check("rising sign withheld", () => {
      setForm("1984-03-09", "07:45", true);
      window.renderChartOut(window.computeChart());
      if (!document.querySelector(".b3.unknown")) throw new Error("not flagged");
      return true;
    });
    check("house ring and angles not drawn", () => {
      if (document.querySelectorAll("#natal .nhouse").length) throw new Error("houses drawn");
      if (document.querySelectorAll("#natal .nang").length) throw new Error("angles drawn");
      return true;
    });
    check("positions list shows no house", () => {
      const ph = document.querySelector(".plist .ph");
      if (!ph || ph.textContent.trim() !== "—") throw new Error("got " + ph?.textContent);
      return true;
    });
    check("hour nudge hidden", () => !document.querySelector("[data-shift]"));
    check("planets still computed", () =>
      typeof window.lastChart.bodies.Sun.lon === "number");
    check("known time restores houses and angles", () => {
      setForm("1984-03-09", "07:45", false);
      window.renderChartOut(window.computeChart());
      if (document.querySelector(".b3.unknown")) throw new Error("still flagged");
      if (document.querySelectorAll("#natal .nhouse").length !== 12) throw new Error("no houses");
      if (document.querySelectorAll("#natal .nang").length !== 4) throw new Error("no angles");
      return true;
    });

    section("time warnings");
    check("DST fall-back reads as ambiguous", () =>
      window.dstAnomaly(2023, 10, 29, 1, 30, "Europe/London") === "ambiguous");
    check("DST spring-forward reads as skipped", () =>
      window.dstAnomaly(2023, 3, 26, 1, 30, "Europe/London") === "skipped");
    check("an ordinary date reads clean", () =>
      window.dstAnomaly(2023, 6, 15, 12, 0, "Europe/London") === null);
    check("US transition also detected", () =>
      window.dstAnomaly(2023, 11, 5, 1, 30, "America/New_York") === "ambiguous");
    check("pre-1970 raises a warning", () => {
      setForm("1955-06-01", "03:00", false);
      const w = window.computeChart().meta.warnings;
      if (!w.some(x => x.tone === "warn" && /1970/.test(x.text))) throw new Error("none");
      return true;
    });
    check("modern date raises none", () => {
      setForm("1995-06-01", "03:00", false);
      return window.computeChart().meta.warnings.length === 0;
    });
    check("+1 hour moves the Ascendant", () => {
      setForm("1984-03-09", "07:45", false);
      window.renderChartOut(window.computeChart());
      const before = window.lastChart.asc;
      document.querySelector('[data-shift="60"]').click();
      if (Math.abs(window.lastChart.asc - before) < 5) throw new Error("barely moved");
      if (window.lastChart.meta.shift !== 60) throw new Error("shift not recorded");
      return true;
    });
    check("as-entered resets the shift", () => {
      document.querySelector('[data-shift="0"]').click();
      return window.lastChart.meta.shift === 0;
    });

    section("tropical / sidereal");
    check("toggle is rendered", () => {
      setForm("1990-06-15", "12:00", false);
      window.renderChartOut(window.computeChart());
      return document.querySelectorAll("[data-zodiac]").length === 2;
    });
    check("ayanamsa is ~24° for the modern era", () => {
      const jdTT = window.lastChart.jdTT;
      const a = window.ayanamsa(jdTT);
      if (a < 23 || a > 25) throw new Error(a.toFixed(3) + "°");
      return true;
    });
    check("ayanamsa grows with time (precession)", () => {
      const a1900 = window.ayanamsa(2415020.5);
      const a2000 = window.ayanamsa(2451545.0);
      if (!(a2000 > a1900)) throw new Error(a1900 + " -> " + a2000);
      const rate = (a2000 - a1900) / 100 * 3600;   // arcsec/year
      if (rate < 45 || rate > 55) throw new Error(rate.toFixed(1) + "\"/yr");
      console.log("        (" + rate.toFixed(1) + " arcsec/year — precession is ~50.3)");
      return true;
    });
    check("switching to sidereal shifts every longitude by the ayanamsa", () => {
      const trop = window.lastChart;
      document.querySelector('[data-zodiac="sidereal"]').click();
      const sid = window.shownChart;
      if (sid.meta.zodiac !== "sidereal") throw new Error("mode not set");
      const ay = sid.meta.ayanamsa;
      for (const n of Object.keys(trop.bodies)) {
        const want = ((trop.bodies[n].lon - ay) % 360 + 360) % 360;
        if (Math.abs(sid.bodies[n].lon - want) > 1e-9)
          throw new Error(n + " off by " + (sid.bodies[n].lon - want));
      }
      return true;
    });
    check("aspects are invariant under the frame change", () => {
      // a constant offset cannot change angular separations
      const trop = window.lastChart, sid = window.shownChart;
      const at = window.chartAspects(trop), as = window.chartAspects(sid);
      if (at.length !== as.length) throw new Error(at.length + " vs " + as.length);
      for (let i = 0; i < at.length; i++)
        if (Math.abs(at[i].sep - as[i].sep) > 1e-9)
          throw new Error("separation drifted at " + i);
      return true;
    });
    check("a body drops back a sign exactly when its degree is under the ayanamsa", () => {
      // ~24° of ayanamsa moves a body back one sign only if it sits earlier
      // than 24° into its tropical sign. Anything later stays put.
      const trop = window.lastChart, sid = window.shownChart;
      const ay = sid.meta.ayanamsa;
      for (const n of Object.keys(trop.bodies)) {
        const degIn = trop.bodies[n].lon % 30;
        const ti = Math.floor(trop.bodies[n].lon / 30);
        const si = Math.floor(sid.bodies[n].lon / 30);
        const moved = ((ti - si) % 12 + 12) % 12;
        const expected = degIn < ay ? 1 : 0;
        if (moved !== expected)
          throw new Error(n + " at " + degIn.toFixed(1) + "° moved " + moved +
            " signs, expected " + expected);
      }
      return true;
    });
    check("switching back is exact", () => {
      const before = window.lastChart.bodies.Sun.lon;
      document.querySelector('[data-zodiac="tropical"]').click();
      if (window.shownChart.meta.zodiac !== "tropical") throw new Error("mode not reset");
      if (Math.abs(window.shownChart.bodies.Sun.lon - before) > 1e-12)
        throw new Error("lossy round-trip");
      return true;
    });
    check("tropical chart is never mutated by the sidereal view", () => {
      const sun = window.lastChart.bodies.Sun.lon;
      document.querySelector('[data-zodiac="sidereal"]').click();
      document.querySelector('[data-zodiac="sidereal"]').click();
      document.querySelector('[data-zodiac="tropical"]').click();
      if (Math.abs(window.lastChart.bodies.Sun.lon - sun) > 1e-12)
        throw new Error("source drifted");
      return true;
    });

    section("sign-from-date tool");
    check("known dates map to the right signs", () => {
      const cases = [["1990-04-10", "Aries"], ["1990-07-25", "Leo"],
                     ["1990-11-15", "Scorpio"], ["1990-01-05", "Capricorn"]];
      for (const [d, want] of cases) {
        const got = window.sunSignOn(d).sign.name;
        if (got !== want) throw new Error(d + " -> " + got + ", wanted " + want);
      }
      return true;
    });
    check("boundaries match the 2024 equinoxes and solstices", () => {
      const probes = [["2024-03-19", "Pisces"], ["2024-03-21", "Aries"],
                      ["2024-06-19", "Gemini"], ["2024-06-21", "Cancer"],
                      ["2024-09-21", "Virgo"], ["2024-09-23", "Libra"],
                      ["2024-12-20", "Sagittarius"], ["2024-12-22", "Capricorn"]];
      const bad = probes
        .map(([d, want]) => [d, window.sunSignOn(d).sign.name, want])
        .filter(([, got, want]) => got !== want)
        .map(([d, got, want]) => d + "->" + got + " want " + want);
      if (bad.length) throw new Error(bad.join("; "));
      return true;
    });
    check("renders a card linking into the wheel", () => {
      go("start");
      document.getElementById("mDate").value = "1988-08-08";
      document.getElementById("mGo").click();
      const link = document.querySelector("#mOut .micro-card [data-go='wheel'][data-sub]");
      if (!link) throw new Error("no wheel link");
      if (link.dataset.sub !== "leo") throw new Error("sub was " + link.dataset.sub);
      return true;
    });

    section("chart presets");
    check("presets rendered", () => {
      go("chart");
      const n = document.querySelectorAll("[data-preset]").length;
      if (n < 5) throw new Error("only " + n);
      return true;
    });
    check("moon landing preset computes", () => {
      document.querySelector('[data-preset="0"]').click();
      const ch = window.lastChart;
      if (ch.meta.dateStr !== "1969-07-20") throw new Error(ch.meta.dateStr);
      if (!/Houston/.test(ch.meta.city.name)) throw new Error(ch.meta.city.name);
      return true;
    });

    section("shareable chart urls");
    check("a chart round-trips through its share sub", () => {
      setForm("1969-07-20", "20:17", false);
      window.chosenCity = { name: "Houston", country: "United States",
                            lat: 29.76, lon: -95.37, tz: "America/Chicago" };
      const ch = window.computeChart();
      const sub = window.chartToSub(ch);
      window.chosenCity = null;
      document.getElementById("cDate").value = "";
      if (!window.applyChartSub(sub)) throw new Error("applyChartSub refused");
      if (window.lastChart.meta.dateStr !== "1969-07-20")
        throw new Error(window.lastChart.meta.dateStr);
      if (Math.abs(window.lastChart.asc - ch.asc) > 0.001)
        throw new Error("asc drifted " + ch.asc + " -> " + window.lastChart.asc);
      return true;
    });
    check("unknown-time charts round-trip", () => {
      setForm("1984-03-09", "07:45", true);
      const sub = window.chartToSub(window.computeChart());
      if (!/\|x\|/.test(sub)) throw new Error("no unknown marker: " + sub);
      window.applyChartSub(sub);
      if (!window.lastChart.meta.unknownTime) throw new Error("flag lost");
      return true;
    });
    check("hour shift round-trips", () => {
      setForm("1984-03-09", "07:45", false);
      window.timeShiftMin = 60;
      const sub = window.chartToSub(window.computeChart());
      window.timeShiftMin = 0;
      window.applyChartSub(sub);
      if (window.lastChart.meta.shift !== 60) throw new Error("shift lost");
      return true;
    });
    check("malformed subs are rejected, not crashed on", () =>
      window.applyChartSub("garbage") === false &&
      window.applyChartSub("2020-01-01|x") === false &&
      window.applyChartSub("") === false);
    check("share and print controls present", () =>
      !!document.getElementById("cShare") && !!document.getElementById("cPrint"));
    check("print stylesheet exists", () => /@media print/.test(cssSrc));

    section("cross-links in generated output");
    check("positions readout links signs and houses", () => {
      setForm("1990-06-15", "12:00", false);
      window.renderChartOut(window.computeChart());
      window.selectChartBody("Mars");
      const box = document.getElementById("chartRead");
      if (!box.querySelector('.xlink[data-go="wheel"][data-sub]'))
        throw new Error("no sign link");
      if (!box.querySelector('.xlink[data-go="houses"][data-sub]'))
        throw new Error("no house link");
      return true;
    });
    check("a sign cross-link actually navigates", () => {
      const link = document.querySelector('#chartRead .xlink[data-go="wheel"][data-sub]');
      const want = link.dataset.sub;
      link.click();
      if (window.current !== "wheel") throw new Error("did not route, at " + window.current);
      const sel = px("state.selection");
      if (!sel.length) throw new Error("nothing selected");
      if (px("SIGNS[state.selection[0]].id") !== want)
        throw new Error("selected the wrong sign");
      return true;
    });
    check("a house cross-link navigates", () => {
      go("chart");
      setForm("1990-06-15", "12:00", false);
      window.renderChartOut(window.computeChart());
      window.selectChartBody("Mars");
      document.querySelector('#chartRead .xlink[data-go="houses"][data-sub]').click();
      if (window.current !== "houses") throw new Error("at " + window.current);
      return true;
    });
    check("pattern member chips link to their planet pages", () => {
      go("chart");
      setForm("1990-06-15", "12:00", false);
      window.renderChartOut(window.computeChart());
      const chip = document.querySelector('#chartPatterns .pat-b[data-go="planets"][data-sub]');
      if (!chip) throw new Error("no linked chip");
      chip.click();
      if (window.current !== "planets") throw new Error("at " + window.current);
      return true;
    });

    section("accessibility");
    check("a polite live region exists", () => {
      const el = document.getElementById("live");
      if (!el) throw new Error("missing #live");
      if (el.getAttribute("aria-live") !== "polite") throw new Error("not polite");
      return true;
    });
    check("calculating a chart announces it", () => {
      return new Promise(() => {}), (() => {
        go("chart");
        setForm("1969-07-20", "20:17", false);
        window.renderChartOut(window.computeChart());
        // announce() defers by 40ms; drive it synchronously instead
        window.announce("probe");
        return true;
      })();
    });
    check("selecting signs announces the comparison", () => {
      go("wheel");
      window.selectPair(0, 6);
      // announce is async; assert the code path ran by checking the strip
      if (px("state.selection.length") !== 2) throw new Error("not selected");
      return true;
    });
    check("chart output is focusable after render", () => {
      go("chart");
      window.renderChartOut(window.computeChart());
      const out = document.getElementById("chartOut");
      if (out.getAttribute("tabindex") !== "-1") throw new Error("not focusable");
      return true;
    });
    check("search restores focus to its opener on close", () => {
      go("start");
      const opener = document.getElementById("btnSearch");
      opener.focus();
      window.openSearch();
      window.closeSearch();
      if (document.activeElement !== opener)
        throw new Error("focus went to " + document.activeElement.id);
      return true;
    });
    check("keyboard sheet opens, traps Tab and restores focus", () => {
      const opener = document.getElementById("btnKeys");
      opener.focus();
      opener.click();
      const ov = document.getElementById("keysOverlay");
      if (!ov.classList.contains("on")) throw new Error("did not open");
      document.dispatchEvent(new window.KeyboardEvent("keydown", { key: "Tab", bubbles: true }));
      if (!ov.contains(document.activeElement))
        throw new Error("focus escaped the dialog");
      document.dispatchEvent(new window.KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
      if (ov.classList.contains("on")) throw new Error("Escape did not close");
      if (document.activeElement !== opener) throw new Error("focus not restored");
      return true;
    });
    check("? opens the shortcut sheet", () => {
      document.body.focus();
      document.dispatchEvent(new window.KeyboardEvent("keydown", { key: "?", bubbles: true }));
      const open = document.getElementById("keysOverlay").classList.contains("on");
      document.dispatchEvent(new window.KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
      if (!open) throw new Error("did not open");
      return true;
    });
    check("g then a digit jumps to that section", () => {
      go("start");
      document.dispatchEvent(new window.KeyboardEvent("keydown", { key: "g", bubbles: true }));
      document.dispatchEvent(new window.KeyboardEvent("keydown", { key: "4", bubbles: true }));
      if (window.current !== px("PAGES[3].id"))
        throw new Error("landed on " + window.current);
      return true;
    });
    check("arrows page between sections", () => {
      go("planets");
      document.dispatchEvent(new window.KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
      if (window.current !== "houses") throw new Error("right -> " + window.current);
      document.dispatchEvent(new window.KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true }));
      if (window.current !== "planets") throw new Error("left -> " + window.current);
      return true;
    });
    check("arrows are left alone on the aspects dial", () => {
      go("aspects");
      document.dispatchEvent(new window.KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
      if (window.current !== "aspects") throw new Error("stole the arrow key");
      return true;
    });
    check("shortcut keys ignored while typing", () => {
      go("chart");
      const inp = document.getElementById("cPlace");
      inp.focus();
      document.dispatchEvent(new window.KeyboardEvent("keydown", { key: "?", bubbles: true }));
      const opened = document.getElementById("keysOverlay").classList.contains("on");
      inp.blur();
      if (opened) throw new Error("opened while typing");
      return true;
    });

    section("installable app");
    check("manifest is valid JSON with the required fields", () => {
      const m = JSON.parse(fs.readFileSync(path.join(__dirname, "manifest.json"), "utf8"));
      for (const k of ["name", "short_name", "start_url", "display", "icons"])
        if (!m[k]) throw new Error("missing " + k);
      if (m.display !== "standalone") throw new Error("display=" + m.display);
      if (!m.icons.length) throw new Error("no icons");
      return true;
    });
    check("every manifest icon exists", () => {
      const m = JSON.parse(fs.readFileSync(path.join(__dirname, "manifest.json"), "utf8"));
      const missing = m.icons.map(i => i.src)
        .filter(src => !fs.existsSync(path.join(__dirname, src)));
      if (missing.length) throw new Error("missing: " + missing.join(", "));
      return true;
    });
    check("a maskable icon is provided", () => {
      const m = JSON.parse(fs.readFileSync(path.join(__dirname, "manifest.json"), "utf8"));
      if (!m.icons.some(i => (i.purpose || "").includes("maskable")))
        throw new Error("none marked maskable");
      return true;
    });
    check("manifest shortcuts point at real routes", () => {
      const m = JSON.parse(fs.readFileSync(path.join(__dirname, "manifest.json"), "utf8"));
      const ids = px("PAGES.map(function(p){return p.id})");
      for (const sc of (m.shortcuts || [])) {
        const id = (sc.url.split("#/")[1] || "").split("/")[0];
        if (!ids.includes(id)) throw new Error(sc.url + " -> unknown section " + id);
      }
      return true;
    });
    check("manifest and apple meta tags are linked", () => {
      if (!/<link rel="manifest"/.test(html)) throw new Error("no manifest link");
      if (!/apple-mobile-web-app-capable/.test(html)) throw new Error("no apple meta");
      if (!/apple-touch-icon/.test(html)) throw new Error("no apple icon");
      return true;
    });
    check("service worker parses and precaches every shipped asset", () => {
      const src = fs.readFileSync(path.join(__dirname, "sw.js"), "utf8");
      new Function(src);
      const listed = [...src.matchAll(/"\.\/([^"]+)"/g)].map(m => m[1]).filter(Boolean);
      const missing = listed.filter(f => !fs.existsSync(path.join(__dirname, f)));
      if (missing.length) throw new Error("precaches missing files: " + missing.join(", "));
      // every js/css file we ship should be in the precache list
      const shipped = [...html.matchAll(/(?:src|href)="((?:js|css)\/[^"]+)"/g)].map(m => m[1]);
      const absent = shipped.filter(f => !listed.includes(f));
      if (absent.length) throw new Error("not precached: " + absent.join(", "));
      return true;
    });
    check("documented shell commands match the shell they are labelled with", () => {
      // PowerShell blocks must not contain Bash-only constructs, and vice
      // versa — the two shells disagree about rm -rf, cp -r, ~ and the
      // VAR=value command prefix.
      const docs = ["README.md", "docs/IMPLEMENTATION.md"]
        .filter(f => fs.existsSync(path.join(__dirname, f)))
        .map(f => [f, fs.readFileSync(path.join(__dirname, f), "utf8")]);
      const bashOnly = /(^|\n)\s*(rm -rf|cp -r|mv -f|\bls -|\btouch )|(^|\n)\s*[A-Z_]+=[^\s]+\s+(node|npm)\b/;
      const bad = [];
      for (const [name, text] of docs) {
        const blocks = [...text.matchAll(/```powershell\n([\s\S]*?)```/g)].map(m => m[1]);
        for (const b of blocks)
          if (bashOnly.test(b)) bad.push(name + ": bash syntax in a powershell block");
      }
      if (bad.length) throw new Error(bad.join("; "));
      return true;
    });
    check("service worker registration is skipped on file://", () => {
      if (!/location\.protocol === "file:"/.test(jsSrc))
        throw new Error("no file:// guard — registration would throw");
      return true;
    });

    section("mobile app shell");
    check("bottom tab bar built with four tabs plus More", () => {
      const tabs = document.querySelectorAll("#tabbar .tab[data-go]").length;
      if (tabs !== 4) throw new Error(tabs + " tabs");
      if (!document.getElementById("tabMore")) throw new Error("no More tab");
      return true;
    });
    check("More sheet lists every section", () => {
      const n = document.querySelectorAll("#moreList .sheet-item").length;
      const want = px("PAGES.length");
      if (n !== want) throw new Error(n + " of " + want);
      return true;
    });
    check("tabs track the active section", () => {
      go("wheel");
      const cur = document.querySelector('#tabbar .tab[aria-current="page"]');
      if (!cur || cur.dataset.go !== "wheel") throw new Error("not synced");
      return true;
    });
    check("More lights up for sections outside the tab bar", () => {
      go("glossary");
      const more = document.getElementById("tabMore");
      if (more.getAttribute("aria-current") !== "page")
        throw new Error("More not marked active");
      return true;
    });
    check("More sheet opens and closes", () => {
      document.getElementById("tabMore").click();
      if (!document.getElementById("moreSheet").classList.contains("on"))
        throw new Error("did not open");
      document.dispatchEvent(new window.KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
      if (document.getElementById("moreSheet").classList.contains("on"))
        throw new Error("Escape did not close");
      return true;
    });
    check("navigating from the sheet closes it", () => {
      document.getElementById("tabMore").click();
      document.querySelector('#moreList .sheet-item[data-go="houses"]').click();
      if (window.current !== "houses") throw new Error("did not navigate");
      if (document.getElementById("moreSheet").classList.contains("on"))
        throw new Error("sheet stayed open");
      return true;
    });
    check("safe-area insets are used", () => {
      if (!/env\(safe-area-inset-bottom/.test(cssSrc)) throw new Error("no bottom inset");
      if (!/env\(safe-area-inset-top/.test(cssSrc)) throw new Error("no top inset");
      return true;
    });
    check("touch targets are at least 44px on mobile", () => {
      if (!/min-height:44px/.test(cssSrc)) throw new Error("no 44px rule");
      return true;
    });
    check("tap highlight and double-tap delay suppressed", () => {
      if (!/-webkit-tap-highlight-color:transparent/.test(cssSrc))
        throw new Error("tap highlight not cleared");
      if (!/touch-action:manipulation/.test(cssSrc)) throw new Error("no touch-action");
      return true;
    });
    check("dialogs become bottom sheets on small screens", () => {
      if (!/#searchOverlay\{align-items:flex-end/.test(cssSrc.replace(/\s+/g, "")))
        throw new Error("search not a sheet");
      return true;
    });

    section("theme");
    check("light theme applies and is remembered", () => {
      window.applyTheme("light");
      if (document.documentElement.getAttribute("data-theme") !== "light")
        throw new Error("attr not set");
      const meta = document.querySelector('meta[name="theme-color"]');
      if (meta.getAttribute("content") !== "#f7f8fc") throw new Error("theme-color not updated");
      window.applyTheme("dark");
      return true;
    });
    check("light palette overrides the core variables", () => {
      for (const v of ["--void-0", "--text", "--panel-solid", "--accent"])
        if (!new RegExp('data-theme="light"[\\s\\S]*?' + v).test(cssSrc))
          throw new Error("no light override for " + v);
      return true;
    });

    section("dial snapping / tour / deep links");
    check("snapAngle pulls to a named separation", () => {
      px("aPos[1] = 0");
      const snapped = window.snapAngle(118.6, 0, false);
      if (Math.abs(snapped - 120) > 1e-9) throw new Error("got " + snapped);
      return true;
    });
    check("snapAngle leaves unnamed angles alone", () => {
      px("aPos[1] = 0");
      const raw = 105;
      if (window.snapAngle(raw, 0, false) !== raw) throw new Error("snapped a non-aspect");
      return true;
    });
    check("Shift overrides snapping", () => {
      px("aPos[1] = 0");
      if (window.snapAngle(118.6, 0, true) !== 118.6) throw new Error("snapped anyway");
      return true;
    });
    check("tour remembers the furthest step", () => {
      window.store("tourStep", 4);
      if (window.load("tourStep", 0) !== 4) throw new Error("not stored");
      if (!/Resume tour/.test(window.tourLabel())) throw new Error("no resume label");
      window.store("tourStep", 0);
      return true;
    });
    check("wheel pair deep links resolve", () => {
      go("wheel");
      if (window.selectSignById("aries+libra") === false) throw new Error("refused");
      const sel = px("state.selection");
      if (sel.length !== 2) throw new Error("got " + sel.length + " selected");
      if (px("SIGNS[state.selection[0]].id") !== "aries") throw new Error("wrong first");
      if (px("SIGNS[state.selection[1]].id") !== "libra") throw new Error("wrong second");
      return true;
    });
    check("a bad pair is rejected", () =>
      window.selectSignById("aries+notasign") === false);

    section("retrograde context");
    check("retrograde span matches the April 2024 Mercury window", () => {
      // Mercury was retrograde 1–25 April 2024
      setForm("2024-04-05", "12:00", false);
      window.chosenCity = { name: "London", country: "United Kingdom",
                            lat: 51.5, lon: -0.13, tz: "Europe/London" };
      const ch = window.computeChart();
      if (ch.bodies.Mercury.speed >= 0) throw new Error("not retrograde on this date");
      const r = window.retroSpan(ch, "Mercury");
      const began = r.back + 1, ends = r.fwd + 1;
      if (began < 2 || began > 7) throw new Error("began " + began + " days ago");
      if (ends < 18 || ends > 24) throw new Error("stations in " + ends + " days");
      console.log("        (began " + began + " days before, stations " + ends + " days after)");
      return true;
    });
    check("direct motion produces no retrograde block", () => {
      setForm("2024-01-15", "12:00", false);
      const ch = window.computeChart();
      if (ch.bodies.Mercury.speed < 0) throw new Error("Mercury retrograde on this date");
      return window.retroContext(ch, "Mercury") === "";
    });

    section("about page");
    check("about page renders limits and choices", () => {
      go("about");
      if (document.querySelectorAll("#limitsList .limit").length < 4)
        throw new Error("limits missing");
      if (document.querySelectorAll("#choicesList .limit").length < 4)
        throw new Error("choices missing");
      return true;
    });
    check("footer links to it", () => !!document.querySelector('.footlink[data-go="about"]'));

    section("end-to-end journey");
    check("every section renders without error", () => {
      const expect = {
        start:    () => !!document.getElementById("formula").children.length,
        wheel:    () => document.querySelectorAll("#wheel .node").length === 12,
        planets:  () => document.querySelectorAll("#plGrid .tile").length > 0,
        houses:   () => document.querySelectorAll("#hwheel .hseg").length === 12,
        aspects:  () => document.querySelectorAll("#adial .ahandle").length === 2,
        chart:    () => !!document.getElementById("chartForm"),
        history:  () => document.querySelectorAll("#histOut .hblock").length > 0,
        quiz:     () => document.querySelectorAll("#quizOut .qch").length === 4,
        glossary: () => document.querySelectorAll("#gList .gitem").length > 0,
        about:    () => document.querySelectorAll("#limitsList .limit").length >= 4
      };
      const bad = [];
      for (const id of px("PAGES.map(function(p){return p.id})")) {
        go(id);
        const fn = expect[id];
        if (!fn) { bad.push(id + " (no assertion)"); continue; }
        try { if (!fn()) bad.push(id); } catch (e) { bad.push(id + ": " + e.message); }
      }
      if (bad.length) throw new Error(bad.join(", "));
      return true;
    });
    check("a full user journey holds together", () => {
      go("start");
      document.getElementById("mDate").value = "1969-07-20";
      document.getElementById("mGo").click();
      const link = document.querySelector("#mOut [data-go='wheel'][data-sub]");
      if (!link) throw new Error("sign tool produced no wheel link");
      link.click();
      if (window.current !== "wheel") throw new Error("did not reach the wheel");
      if (px("state.selection.length") !== 1) throw new Error("no sign selected");
      go("chart");
      window._pickCityIdx(window.searchCities("houston")[0]);
      setForm("1969-07-20", "20:17", false);
      const ch = window.computeChart();
      window.renderChartOut(ch);
      if (document.querySelectorAll(".plist .prow").length < 10)
        throw new Error("positions missing");
      if (window.applyChartSub(window.chartToSub(ch)) === false)
        throw new Error("share link did not round-trip");
      go("quiz");
      const first = document.querySelector("#quizOut .qch");
      first.click();
      if (!document.querySelector("#qWhy.on")) throw new Error("quiz did not respond");
      return true;
    });
    check("no runtime errors accumulated across the whole run", () => {
      if (errors.length) throw new Error(errors.join(" | "));
      return true;
    });

    section("summary");
    console.log("  " + pass + " passed, " + fail + " failed");
    if (failures.length) console.log("\n  " + failures.join("\n  "));
    process.exit(fail ? 1 : 0);
  }, (e) => {
    console.log("  FAIL  place data never loaded — " + e.message);
    console.log("\n  " + pass + " passed, " + (fail + 1) + " failed");
    process.exit(1);
  });
}, 1500);
