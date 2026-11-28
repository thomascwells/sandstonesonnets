// Printable trail flyers (print.qmd, built by trail-flyer.lua).
// Shows the flyer for the trail in the address (#trail-d4) or the first
// one, highlights its trail button, and draws each flyer's QR code.
(function () {
  function showFlyer() {
    var flyers = document.querySelectorAll(".flyer");
    if (!flyers.length) return;
    // The address uses #trail-d4 (not the flyer's own id, #flyer-d4) so the
    // browser doesn't scroll past the trail buttons.
    var id = location.hash.replace(/^#trail-/, "flyer-");
    var chosen = document.getElementById(id);
    if (!chosen || !chosen.classList.contains("flyer")) chosen = flyers[0];
    flyers.forEach(function (f) { f.hidden = f !== chosen; });
    document.querySelectorAll(".flyer-picker a").forEach(function (a) {
      var active = a.getAttribute("href") === "#" + chosen.id.replace(/^flyer-/, "trail-");
      a.classList.toggle("active", active);
      if (active) a.setAttribute("aria-current", "true");
      else a.removeAttribute("aria-current");
    });
  }

  function drawQRCodes() {
    if (typeof qrcode !== "function") return;
    document.querySelectorAll(".flyer-qr[data-url]").forEach(function (box) {
      var qr = qrcode(0, "M");
      qr.addData(box.getAttribute("data-url"));
      qr.make();
      box.innerHTML = qr.createSvgTag({ cellSize: 4, margin: 0, scalable: true,
        alt: "QR code: " + box.getAttribute("data-url") });
    });
  }

  window.addEventListener("hashchange", showFlyer);
  document.addEventListener("DOMContentLoaded", function () {
    showFlyer();
    drawQRCodes();
  });
})();
