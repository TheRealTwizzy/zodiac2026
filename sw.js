/* Cosmic Atlas service worker.
 *
 * The site has no backend and its content never changes at runtime, so the
 * strategy is deliberately simple: precache everything on install, serve
 * cache-first, and refresh in the background. That makes the app work with no
 * network at all — which is the point, since none of the astronomy needs one.
 *
 * Bump CACHE when you ship; the old cache is dropped on activate.
 */
/* v2: the place table grew from 3,000 records to 50,000 and changed shape.
   The version bump matters — this worker serves cache-first and revalidates
   each file on its own schedule, so without it a returning visitor could pair
   a new js/11-chart.js with a cached cities.js from the old schema. */
const CACHE = "cosmic-atlas-v3";

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
  "./data/cities.js",
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
