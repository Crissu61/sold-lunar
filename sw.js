/* Sold Lunar - service worker */
var V = "sold-lunar-v3";
var ASSETS = ["./", "./index.html", "./manifest.webmanifest",
              "./icon-192.png", "./icon-512.png", "./icon-512-maskable.png", "./apple-touch-icon.png"];

self.addEventListener("install", function(e){
  e.waitUntil(caches.open(V).then(function(c){ return c.addAll(ASSETS); }).then(function(){ return self.skipWaiting(); }));
});

self.addEventListener("activate", function(e){
  e.waitUntil(caches.keys().then(function(keys){
    return Promise.all(keys.map(function(k){ return k === V ? null : caches.delete(k); }));
  }).then(function(){ return self.clients.claim(); }));
});

function putInCache(req, res){
  var copy = res.clone();
  caches.open(V).then(function(c){ c.put(req, copy); });
  return res;
}

self.addEventListener("fetch", function(e){
  var req = e.request;
  if(req.method !== "GET") return;
  var url = new URL(req.url);
  var sameOrigin = url.origin === location.origin;
  var isFont = url.host === "fonts.googleapis.com" || url.host === "fonts.gstatic.com";
  if(!sameOrigin && !isFont) return;

  /* pagina: intai reteaua (ca sa primesti versiunea noua), cache la nevoie */
  if(req.mode === "navigate" || req.destination === "document"){
    e.respondWith(
      fetch(req).then(function(r){ return putInCache(req, r); })
        .catch(function(){ return caches.match(req).then(function(m){ return m || caches.match("./index.html"); }); })
    );
    return;
  }

  /* restul: intai cache, apoi reteaua */
  e.respondWith(
    caches.match(req).then(function(m){
      return m || fetch(req).then(function(r){ return putInCache(req, r); }).catch(function(){ return m; });
    })
  );
});
