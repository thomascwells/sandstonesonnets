// Shows an "Install app" button, starts the offline helper (pwa/sw.js) and
// shows its progress in the footer.
//
// While previewing locally (localhost) the helper is switched off, so
// `quarto preview` always shows fresh pages. To test offline mode locally,
// open any page with ?offline-test once; add ?offline-test=off to stop.

// "Install app" button. It goes in the element with id="install-app" if the
// page has one (the homepage does), otherwise in the page footer.
// - Android/Chrome: the browser lets us show its own install prompt.
// - iPhone/iPad: there is no prompt, so the button shows the Share-menu steps.
// - Already installed, or a browser that can't install: no button.
(function () {
  var installed = window.matchMedia("(display-mode: standalone)").matches ||
    navigator.standalone === true;
  if (installed) return;

  var box;
  function showButton(label, onClick) {
    if (!box) {
      box = document.createElement("div");
      box.className = "install-app";
      var slot = document.getElementById("install-app") ||
        document.querySelector(".nav-footer-center") || document.body;
      slot.appendChild(box);
    }
    box.innerHTML = "";
    var button = document.createElement("button");
    button.type = "button";
    button.className = "btn install-app-button";
    button.textContent = label;
    button.addEventListener("click", onClick);
    box.appendChild(button);
    return box;
  }

  var isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  if (isIOS) {
    document.addEventListener("DOMContentLoaded", function () {
      var tip = document.createElement("p");
      tip.className = "install-app-tip";
      tip.hidden = true;
      tip.innerHTML = "In Safari, tap the <strong>Share</strong> button " +
        "(the square with an arrow), then <strong>Add to Home Screen</strong>.";
      showButton("Add to Home Screen", function () {
        tip.hidden = !tip.hidden;
      }).appendChild(tip);
    });
    return;
  }

  window.addEventListener("beforeinstallprompt", function (event) {
    event.preventDefault();
    showButton("Install app", function () {
      event.prompt();
      // The prompt can only be used once. If they say "not now", the
      // browser offers it again on a later visit.
      event.userChoice.then(function () {
        if (box) { box.remove(); box = null; }
      });
    });
  });
  window.addEventListener("appinstalled", function () {
    if (box) { box.remove(); box = null; }
  });
})();

// Offline saving.
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
