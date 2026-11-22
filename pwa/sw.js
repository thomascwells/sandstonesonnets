// Sandstone Sonnets offline helper (service worker).
//
// This is a template: pwa/build_offline.py copies it to the site's sw.js
// after every render and fills in PRECACHE with the list of every file in
// the site plus a fingerprint for each one. Don't edit the generated sw.js.
//
// How it works:
// - On the first visit (with signal) it downloads and saves every page and
//   image. When the site changes, it re-downloads only the changed files.
// - Every request is answered from the saved copy first, so pages open
//   instantly and work with no signal. Anything not saved goes to the network.

const PRECACHE = self.__PRECACHE__;
const CACHE = "sandstone-sonnets";
const REVS = "/__offline-revs__"; // which fingerprint of each file is saved

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(saveSite());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("message", (event) => {
  if (event.data === "status") {
    savedStatus().then((status) => event.source.postMessage(status));
  }
});

async function tell(message) {
  const pages = await self.clients.matchAll({ includeUncontrolled: true });
  pages.forEach((page) => page.postMessage(message));
}

async function savedRevs(cache) {
  const saved = await cache.match(REVS);
  return saved ? saved.json() : {};
}

async function savedStatus() {
  const revs = await savedRevs(await caches.open(CACHE));
  const total = Object.keys(PRECACHE.files).length;
  const done = Object.entries(PRECACHE.files)
    .filter(([url, rev]) => revs[url] === rev).length;
  return { type: done === total ? "ready" : "progress", done, total };
}

async function saveSite() {
  const cache = await caches.open(CACHE);
  const old = await savedRevs(cache);
  const files = Object.entries(PRECACHE.files);
  const todo = files.filter(([url, rev]) => old[url] !== rev);
  const revs = {};
  files.forEach(([url, rev]) => { if (old[url] === rev) revs[url] = rev; });

  let done = files.length - todo.length;
  let failed = 0;
  const total = files.length;
  tell({ type: "progress", done, total });

  // Download a few files at a time.
  const queue = todo.slice();
  async function worker() {
    while (queue.length) {
      const [url, rev] = queue.shift();
      try {
        const response = await fetch(url, { cache: "no-cache" });
        if (!response.ok) throw new Error(response.status);
        await cache.put(url, response);
        revs[url] = rev;
      } catch (err) {
        failed++;
      }
      done++;
      if (done % 5 === 0 || done === total) {
        // Record progress so an interrupted download resumes where it stopped.
        await cache.put(REVS, new Response(JSON.stringify(revs)));
        tell({ type: "progress", done, total });
      }
    }
  }
  await Promise.all([1, 2, 3, 4, 5, 6].map(worker));

  // Forget files that are no longer part of the site.
  for (const url of Object.keys(old)) {
    if (!(url in PRECACHE.files)) await cache.delete(url);
  }
  await cache.put(REVS, new Response(JSON.stringify(revs)));
  tell(failed ? { type: "partial", failed, total } : { type: "ready", done: total, total });
}

// Pretty URLs: /faq should find /faq.html, /poems/ should find /poems/index.html
function candidates(path) {
  if (path.endsWith("/")) return [path + "index.html"];
  const last = path.split("/").pop();
  return last.includes(".") ? [path] : [path, path + ".html", path + "/index.html"];
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // e.g. OpenStreetMap links

  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    for (const path of candidates(url.pathname)) {
      const saved = await cache.match(path);
      if (saved) return saved;
    }
    try {
      return await fetch(request);
    } catch (err) {
      if (request.mode === "navigate") {
        const notFound = await cache.match("/404.html");
        if (notFound) return notFound;
      }
      throw err;
    }
  })());
});
