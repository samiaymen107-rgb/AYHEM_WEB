self.addEventListener("install",e=>{
  e.waitUntil(
    caches.open("ayhem").then(c=>c.addAll(["./"]))
  );
});

self.addEventListener("fetch",e=>{
  e.respondWith(
    fetch(e.request).catch(()=>caches.match(e.request))
  );
});
