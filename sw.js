/* Cosmic Atlas service worker.
 *
 * The site has no backend and its content never changes at runtime, so the
 * strategy is deliberately simple: precache the shell on install, serve
 * cache-first, refresh in the background, and let anything else join the cache
 * the first time it is asked for. That makes the app work with no network at
 * all — which is the point, since none of the astronomy needs one.
 *
 * The one deliberate exception to precaching is data/cities.js; see PRECACHE.
 *
 * Bump CACHE when you ship; the old cache is dropped on activate.
 */
/* Bump on ship. It matters more than usual here: this worker serves
   cache-first and revalidates each file on its own schedule, so without a bump
   a returning visitor could pair a new js/11-chart.js with a cached
   data/cities.js from an older schema. js/11-chart.js checks CITIES_FORMAT for
   the same reason. */
const CACHE = "cosmic-atlas-v4";

/* Everything the site needs to start and run — EXCEPT data/cities.js.
 *
 * That file is 2 MB, and only the Chart section wants it. Precaching it meant
 * every visitor downloaded it on the very first page load, including the many
 * who never open Chart at all, which is the opposite of the lazy loading the
 * page itself goes to some trouble to arrange. It is left out here and picked
 * up by the runtime cache below the first time Chart actually asks for it —
 * after which it is available offline like anything else.
 *
 * The honest cost: install no longer guarantees the chart works offline. A
 * visitor who installs the app and goes offline without ever opening Chart
 * will find the place list missing, and gets the existing recoverable message
 * rather than a dead form. One visit to Chart, online, fixes that for good.
 */
const PRECACHE = [
  "./",
  "./index.html",
  "./css/atlas.css",
  "./js/01-astro.js",
  "./js/02-signs-plain.js",
  "./js/03-bodies.js",
  "./js/04-houses.js",
  "./js/05-glossary.js",
  "./js/06-history.js",
  "./js/07-quiz.js",
  "./js/08-signs-wheel.js",
  "./js/09-site-core.js",
  "./js/10-planets-houses-aspects.js",
  "./js/10b-place-web.js",
  "./js/11-chart.js",
  "./js/12-history-quiz-glossary-tour.js",
  "./js/13-boot.js",
  "./manifest.json",
  "./icon.svg",
  "./icon-maskable.svg",
  "./og.svg"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE)
      // addAll rejects the whole batch if any single request 404s, and "./"
      // may not resolve depending on how the site is served — so add
      // individually and tolerate misses.
      .then((cache) => Promise.all(
        PRECACHE.map((url) => cache.add(url).catch(() => null))
      ))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  // Cross-origin requests are left entirely alone. That is deliberate and
  // worth keeping: the opt-in web place lookup in js/10b-place-web.js is the
  // only one there is, and its responses must never be cached or replayed.
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(req).then((hit) => {
      // Cache-first. Revalidate in the background so an updated deploy is
      // picked up on the visit after next, without ever blocking on network.
      const fresh = fetch(req)
        .then((res) => {
          // This is also what puts data/cities.js in the cache: it is not
          // precached, so the first Chart visit is what makes it available
          // offline from then on.
          if (res && res.status === 200 && res.type === "basic") {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
          }
          return res;
        })
        .catch(() => null);

      if (hit) return hit;

      return fresh.then((res) => {
        if (res) return res;
        // Offline and never cached: for a navigation, fall back to the shell.
        if (req.mode === "navigate") return caches.match("./index.html");
        return new Response("Offline and not cached.", {
          status: 503,
          headers: { "Content-Type": "text/plain; charset=utf-8" }
        });
      });
    })
  );
});

self.addEventListener("message", (event) => {
  if (event.data === "skipWaiting") self.skipWaiting();
});
