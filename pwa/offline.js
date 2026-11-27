// Starts the offline helper (pwa/sw.js) and shows its progress in the footer.
//
// While previewing locally (localhost) the helper is switched off, so
// `quarto preview` always shows fresh pages. To test offline mode locally,
// open any page with ?offline-test once; add ?offline-test=off to stop.
(function () {
  if (!("serviceWorker" in navigator)) return;

  var local = /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
  if (local) {
    var param = new URLSearchParams(location.search).get("offline-test");
    try {
      if (param === "off") localStorage.removeItem("offline-test");
      else if (param !== null) localStorage.setItem("offline-test", "1");
      local = localStorage.getItem("offline-test") !== "1";
    } catch (err) { /* storage blocked: stay off */ }
    if (local) {
      navigator.serviceWorker.getRegistrations().then(function (regs) {
        regs.forEach(function (reg) { reg.unregister(); });
      });
      return;
    }
  }

  var status;
  function show(text) {
    if (!status) {
      status = document.createElement("div");
      status.className = "offline-status";
      status.setAttribute("role", "status");
      var footer = document.querySelector(".nav-footer-center") || document.body;
      footer.appendChild(status);
    }
    status.textContent = text;
  }

  navigator.serviceWorker.addEventListener("message", function (event) {
    var m = event.data || {};
    if (m.type === "progress") {
      show("Saving for offline use… " + Math.round((100 * m.done) / m.total) + "%");
    } else if (m.type === "ready") {
      show("✓ Saved for offline use");
    } else if (m.type === "partial") {
      show("Some pages couldn't be saved for offline use yet. They'll be saved next time you're online.");
    }
  });
  navigator.serviceWorker.startMessages();

  window.addEventListener("load", function () {
    navigator.serviceWorker.register("/sw.js").then(function (reg) {
      var worker = reg.active || reg.waiting || reg.installing;
      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage("status");
      } else if (worker && worker.state === "activated") {
        worker.postMessage("status");
      }
    });
  });
})();
