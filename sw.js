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

const PRECACHE = {"version":"3cb236f77683","files":{"/404.html":"b0d3b8c6033d","/faq.html":"f1debd9e3e70","/index.html":"8051ba3c77fb","/listings.json":"6550b15cb522","/manifest.webmanifest":"473a1f854df8","/poems/canyon-secret-grin.html":"4e8c30bd2d35","/poems/cobra.html":"72716475243e","/poems/dapper-duck.html":"a6aec41e3885","/poems/desert-shipwreck.html":"004f1a0b269c","/poems/dragon.html":"f896401ad5c7","/poems/eagle.html":"31dc73ed596c","/poems/elephant-seal.html":"4ab08ed94804","/poems/guardian-of-the-flume.html":"64f31720ac34","/poems/images/d4_duck_answer_annotated.jpg":"5ff4f93d5c3b","/poems/images/d4_duck_hint.jpg":"c069668d6e3f","/poems/images/d4_duck_map.png":"9f0ecd0ae958","/poems/images/d4_duck_map_hint.png":"5f876e9e9f53","/poems/images/d4_duck_thumb.jpg":"9a78bd8cd598","/poems/images/d4_fury_answer.jpg":"7410df9e584c","/poems/images/d4_fury_answer_annotated.jpg":"dff18d329d26","/poems/images/d4_fury_map.png":"078150f621b9","/poems/images/d4_fury_map_hint.png":"4f7d7d515097","/poems/images/d4_fury_thumb.jpg":"edfbbfab231e","/poems/images/d4_grin_answer.jpg":"516e66ef2fe0","/poems/images/d4_grin_answer_annotated.jpg":"9bc027551b39","/poems/images/d4_grin_map.png":"634d2574a413","/poems/images/d4_grin_map_hint.png":"1dee50a960fe","/poems/images/d4_grin_thumb.jpg":"9d759d0ca22c","/poems/images/f1_guardian_answer.jpg":"8351815d8fa5","/poems/images/f1_guardian_answer_annotated.jpg":"78c8cc1c8c11","/poems/images/f1_guardian_map.png":"c497fd24e711","/poems/images/f1_guardian_map_hint.png":"b1ac3132e132","/poems/images/f1_guardian_thumb.jpg":"0e211eecfe98","/poems/images/f1_portrait_answer.jpg":"03ab1cb21359","/poems/images/f1_portrait_answer_annotated.jpg":"92e81541b32c","/poems/images/f1_portrait_map.png":"780b887ec2ff","/poems/images/f1_portrait_map_hint.png":"9301999304fb","/poems/images/f1_portrait_thumb.jpg":"b7f1a36172e7","/poems/images/f1_shipwreck_answer.jpg":"fbb0497bcfbb","/poems/images/f1_shipwreck_answer_annotated.jpg":"be33d322bba1","/poems/images/f1_shipwreck_map.png":"ccf4a8a51242","/poems/images/f1_shipwreck_map_hint.png":"100fff590fe3","/poems/images/f1_shipwreck_thumb.jpg":"484777530e53","/poems/images/favicon.png":"52ad7cc8b20c","/poems/images/icon-192.png":"833da4a58dae","/poems/images/icon-512.png":"f183c449f0e1","/poems/images/k12_eyes_answer_annotated.jpg":"c6a3458b5381","/poems/images/k12_eyes_hint.jpg":"9da0be99a53b","/poems/images/k12_eyes_map.png":"023f7b93fef7","/poems/images/k12_eyes_map_hint.png":"bffe88704d26","/poems/images/k12_eyes_thumb.jpg":"a91035cce378","/poems/images/k1_dragon_answer_annotated.jpg":"50cce1cfc487","/poems/images/k1_dragon_hint.jpg":"5b42d39a0c4c","/poems/images/k1_dragon_map.png":"d9885be55712","/poems/images/k1_dragon_map_hint.png":"6203d40810d2","/poems/images/k1_dragon_thumb.jpg":"34ee50cdbf71","/poems/images/logo.webp":"962141d133c1","/poems/images/monument_seal_answer.jpg":"9a43c4d9f1e3","/poems/images/monument_seal_answer_annotated2.jpg":"18248e1f5895","/poems/images/monument_seal_map.png":"2cc07942258b","/poems/images/monument_seal_map_hint.png":"d73c3875ccbb","/poems/images/monument_seal_thumb.jpg":"51085562e783","/poems/images/p1_backside_answer_annotated.jpg":"7fc768b695ff","/poems/images/p1_backside_hint.jpg":"78eddd23c90b","/poems/images/p1_backside_map.png":"6fc844e9b84f","/poems/images/p1_backside_map_hint.png":"f056b427d235","/poems/images/p1_backside_thumb.jpg":"df9446e89f6d","/poems/images/r1_cobra_answer_annotated.jpg":"2d4eb362ceaa","/poems/images/r1_cobra_hint.jpg":"3ff494f14bfb","/poems/images/r1_cobra_map.png":"25f8ef5321a2","/poems/images/r1_cobra_map_hint.png":"1dd9cf5f8844","/poems/images/r1_cobra_thumb.jpg":"c06f5b7f2d4b","/poems/images/r1_eagle_answer_annotated.jpg":"ba70e6809b6b","/poems/images/r1_eagle_hint.jpg":"52daaddeb02e","/poems/images/r1_eagle_map.png":"e7424a2a6b45","/poems/images/r1_eagle_map_hint.png":"d1282d67d55e","/poems/images/r1_eagle_thumb.jpg":"7ce0676936f5","/poems/images/r1_kiss_answer_annotated.jpg":"21ff9b853ffa","/poems/images/r1_kiss_hint.jpg":"2267b7e5c6e3","/poems/images/r1_kiss_map.png":"3fd940ba1a2e","/poems/images/r1_kiss_map_hint.png":"bd9c53625c1f","/poems/images/r1_kiss_thumb.jpg":"6ea17af60f43","/poems/images/r1_snail_answer_annotated.jpg":"fd83275dc272","/poems/images/r1_snail_hint.jpg":"931ec8940d15","/poems/images/r1_snail_map.png":"9c67e20986f9","/poems/images/r1_snail_map_hint.png":"048d2ea95fc2","/poems/images/r1_snail_thumb.jpg":"3518c0347240","/poems/images/share.jpg":"3f4203714437","/poems/kissy-face.html":"87bc4f475b08","/poems/patina-portrait.html":"85e40d42abf8","/poems/pollocks-backside.html":"4f6432802fc6","/poems/red-rock-fury.html":"8a5e39f9b5e0","/poems/snail.html":"cda068d701f0","/poems/timeless-lookout.html":"f2f25773150f","/pwa/offline.js":"0a7a10a07b78","/search.json":"05ed4e804e97","/site_libs/bootstrap/bootstrap-3ea1d800871f55dbb394c05fc6e71530.min.css":"b73624a68926","/site_libs/bootstrap/bootstrap-icons.css":"01253947f506","/site_libs/bootstrap/bootstrap-icons.woff":"f55513b7b591","/site_libs/bootstrap/bootstrap.min.js":"d2ea6c1e0cab","/site_libs/clipboard/clipboard.min.js":"e17a1d816e13","/site_libs/quarto-contrib/fontawesome6-0.1.0/1e21o67/FontAwesome6Brands-Regular-400.ttf":"42e2c8c09da5","/site_libs/quarto-contrib/fontawesome6-0.1.0/1e21o67/FontAwesome6Brands-Regular-400.woff2":"49513c0b3ef6","/site_libs/quarto-contrib/fontawesome6-0.1.0/1e21o67/FontAwesome6Free-Regular-400.ttf":"d47585213e6b","/site_libs/quarto-contrib/fontawesome6-0.1.0/1e21o67/FontAwesome6Free-Regular-400.woff2":"3573bbaebec5","/site_libs/quarto-contrib/fontawesome6-0.1.0/1e21o67/FontAwesome6Free-Solid-900.ttf":"1c2ee7d7d21f","/site_libs/quarto-contrib/fontawesome6-0.1.0/1e21o67/FontAwesome6Free-Solid-900.woff2":"b1cd911c67f3","/site_libs/quarto-contrib/fontawesome6-0.1.0/30yblb/FontAwesome6Free-Regular-400.woff2":"3573bbaebec5","/site_libs/quarto-contrib/fontawesome6-0.1.0/all.css":"01336f76c2ea","/site_libs/quarto-contrib/fontawesome6-0.1.0/latex-fontsize.css":"8df3fbb7dceb","/site_libs/quarto-html/anchor.min.js":"69098e105d99","/site_libs/quarto-html/popper.min.js":"4d50586b1847","/site_libs/quarto-html/quarto-syntax-highlighting-63b5708e65d6cd79cd7618c58d0c21e7.css":"954f2fe7d16c","/site_libs/quarto-html/quarto.js":"ff69fff18022","/site_libs/quarto-html/scrollable-regions/scrollable-regions.js":"b2f956903f5b","/site_libs/quarto-html/tabsets/tabsets.js":"a9c226bf70e8","/site_libs/quarto-html/tippy.css":"5969f497d915","/site_libs/quarto-html/tippy.umd.min.js":"41181eeec6d7","/site_libs/quarto-listing/list.min.js":"1efd7641f4c6","/site_libs/quarto-listing/quarto-listing.js":"fd686a079963","/site_libs/quarto-nav/headroom.min.js":"5b80cc4165a6","/site_libs/quarto-nav/quarto-nav.js":"a209dafb198d","/site_libs/quarto-search/autocomplete.umd.js":"cd9db3b7d812","/site_libs/quarto-search/fuse.min.js":"c57339c3fa16","/site_libs/quarto-search/quarto-search.js":"1a23221f499b","/styles.css":"da49d0d62507"}};
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
