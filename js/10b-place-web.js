/* ============================================================================
   WEB PLACE LOOKUP — the only network call in this application
   ============================================================================

   Everything else here works with no network at all: the astronomy is computed
   in the browser, the place table ships with the site, and the service worker
   precaches the lot. That is the point of the project, and it stays true by
   default — this file does nothing unless somebody clicks the button that asks
   it to.

   Why it exists: the built-in table holds about fifty thousand places, down to
   a population of five thousand. That covers the overwhelming majority of
   birthplaces, but not a village, and someone born in a village should not be
   told their birthplace does not exist.

   Why it is click-only, and never fires on typing:

     A birthplace is one of the most identifying things a person will ever type
     into a form, and here it arrives alongside a date of birth. Searching as
     you type would send every prefix of it to a third party — a keystroke-level
     transcript of a stranger's personal data. One deliberate click sends one
     string, once. There is no setting that changes this; "always allow" only
     skips the explanation, it does not arm the keyboard.

   The endpoint is Open-Meteo's public geocoder. It needs no API key and no
   account, it is CORS-enabled so no proxy or backend is required, and it
   returns coordinates and an IANA time zone in a single response — which is
   exactly, and only, what a chart needs. Nothing about the chart is sent: not
   the date, not the time, not a previous result.

   Kept in its own file so that "the only network call lives here" is a claim a
   reviewer can check in ten seconds, and so smoke.js can assert it by
   filename. See the "offline safety" section there.
   ==========================================================================*/

var GEO_ENDPOINT = "https://geocoding-api.open-meteo.com/v1/search";
var GEO_TIMEOUT = 8000;
var GEO_COUNT = 10;

/* Consent, remembered across visits: "" (never asked), "always" or "never".
   store()/load() swallow a blocked localStorage, in which case this reads ""
   every session and the explanation appears again — the safe direction to
   fail. */
var WEB_CONSENT_KEY = "placeWebLookup";

function webConsent(){ return load(WEB_CONSENT_KEY, ""); }
function setWebConsent(v){ store(WEB_CONSENT_KEY, v); }

/* The transport seam. Tests install a stub through _setPlaceTransport; jsdom
   has no fetch of its own, so under test this resolves to null and the whole
   web path stays inert unless a test deliberately arms it. */
var _placeTransport = null;

function placeTransport(){
  if (_placeTransport) return _placeTransport;
  return (typeof fetch === "function") ? fetch : null;
}

function webLookupAvailable(){
  if (webConsent() === "never") return false;
  /* Opened off disk there is no origin to make a CORS request from, and the
     built-in table is the whole offering. */
  if (typeof location !== "undefined" && location.protocol === "file:") return false;
  if (typeof navigator !== "undefined" && navigator.onLine === false) return false;
  return !!placeTransport();
}

/* One request at a time. Typing again abandons the one in flight rather than
   racing it, so a slow response can never overwrite a newer query's results. */
var webAbort = null;

function webPlaceSearch(query, onOk, onErr){
  var send = placeTransport();
  if (!send) return onErr(new Error("no transport"));

  if (webAbort) webAbort.abort();
  var ctrl = new AbortController();
  webAbort = ctrl;
  var timedOut = false;
  var timer = setTimeout(function(){ timedOut = true; ctrl.abort(); }, GEO_TIMEOUT);

  var url = GEO_ENDPOINT + "?name=" + encodeURIComponent(query) +
    "&count=" + GEO_COUNT + "&language=en&format=json";

  /* No credentials, no referrer, no caching. A shared chart link carries the
     birth data in its URL, and there is no reason for the geocoder to learn
     even the page it was called from. */
  send(url, {
    method: "GET",
    signal: ctrl.signal,
    credentials: "omit",
    referrerPolicy: "no-referrer",
    cache: "no-store",
    mode: "cors"
  }).then(function(res){
    if (!res || !res.ok) throw new Error("HTTP " + (res && res.status));
    return res.json();
  }).then(function(json){
    clearTimeout(timer);
    if (webAbort === ctrl) webAbort = null;
    onOk(webPlaceRows(json));
  }).catch(function(err){
    clearTimeout(timer);
    if (webAbort === ctrl) webAbort = null;
    /* An abort raised by the person typing is not a failure and says nothing.
       An abort we raised ourselves on the timeout very much is: reporting it as
       a user action left the caller believing a request was still in flight,
       and the feature stayed wedged for the rest of the session. */
    if (err && err.name === "AbortError" && !timedOut) return;
    onErr(err);
  });
}

/* A result we cannot time-zone correctly would produce a wrong Ascendant, and
   a chart that is quietly wrong is worse than one place fewer in the list. The
   same judgement the place table itself is built on. */
function mapGeoResult(r){
  if (!r) return null;
  if (typeof r.latitude !== "number" || typeof r.longitude !== "number") return null;
  if (r.latitude < -90 || r.latitude > 90) return null;
  if (r.longitude < -180 || r.longitude > 180) return null;
  if (typeof r.timezone !== "string" || !r.timezone) return null;
  try { new Intl.DateTimeFormat("en", { timeZone: r.timezone }); }
  catch (e){ return null; }
  if (typeof r.name !== "string" || !r.name) return null;

  return {
    name: r.name,
    region: typeof r.admin1 === "string" ? r.admin1 : "",
    country: typeof r.country === "string" ? r.country : "",
    lat: Math.round(r.latitude * 100) / 100,
    lon: Math.round(r.longitude * 100) / 100,
    tz: r.timezone
  };
}

function webPlaceRows(json){
  var list = (json && json.results) || [];
  var out = [];
  for (var i = 0; i < list.length; i++){
    var row = mapGeoResult(list[i]);
    if (row) out.push(row);
  }
  return out;
}

/* Exposed for smoke.js: install a transport, and read consent state back. */
window._setPlaceTransport = function(fn){ _placeTransport = fn || null; };
window._webConsent = webConsent;
