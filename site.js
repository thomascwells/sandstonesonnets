// "I found it!" tracker and "Share" button.
//
// The buttons are added to the bottom of each poem by trail-nav.lua. Which
// poems someone has found is saved only on their own device (localStorage),
// so there are no accounts and it works offline. The homepage shows a
// "Found" badge on those poems.
(function () {
  var KEY = "found-poems";

  // "/poems/cobra.html", "/poems/cobra" and "poems/cobra.html" are one poem.
  function poemId(href) {
    var path = new URL(href, location.href).pathname;
    return path.replace(/\.html$/, "").replace(/\/index$/, "/");
  }

  function loadFound() {
    try { return JSON.parse(localStorage.getItem(KEY)) || []; }
    catch (err) { return []; }
  }

  function saveFound(list) {
    try { localStorage.setItem(KEY, JSON.stringify(list)); } catch (err) { /* storage blocked */ }
  }

  // Poem page: the "I found it!" toggle and the found count for this trail.
  function setUpPoem(tools) {
    var me = poemId(location.href);
    var toggle = tools.querySelector(".found-toggle");
    var count = tools.querySelector(".found-count");
    var trail = tools.getAttribute("data-trail");
    var trailPoems = tools.getAttribute("data-trail-poems").split(" ").map(poemId);

    function draw() {
      var found = loadFound();
      var isFound = found.indexOf(me) !== -1;
      toggle.setAttribute("aria-pressed", String(isFound));
      toggle.textContent = isFound ? "✓ Found it!" : "I found it!";
      var n = trailPoems.filter(function (p) { return found.indexOf(p) !== -1; }).length;
      count.textContent = n ? n + " of " + trailPoems.length + " " + trail + " poems found" : "";
    }

    toggle.addEventListener("click", function () {
      var found = loadFound().filter(function (p) { return p !== me; });
      if (toggle.getAttribute("aria-pressed") !== "true") found.push(me);
      saveFound(found);
      draw();
    });
    draw();
  }

  // Poem page: share with the phone's share menu, or copy the link.
  function setUpShare(button) {
    var title = document.title;
    if (navigator.share) {
      button.hidden = false;
      button.addEventListener("click", function () {
        navigator.share({ title: title, url: location.href }).catch(function () {});
      });
    } else if (navigator.clipboard) {
      button.hidden = false;
      button.textContent = "Copy link";
      button.addEventListener("click", function () {
        navigator.clipboard.writeText(location.href).then(function () {
          button.textContent = "✓ Link copied";
          setTimeout(function () { button.textContent = "Copy link"; }, 2000);
        });
      });
    }
  }

  // Homepage: a "Found" badge on each poem card that has been found.
  function markFoundCards() {
    var found = loadFound();
    document.querySelectorAll(".found-badge").forEach(function (b) { b.remove(); });
    document.querySelectorAll(".quarto-post").forEach(function (post) {
      var link = post.querySelector("a[href]");
      var title = post.querySelector(".listing-title");
      if (!link || !title) return;
      if (found.indexOf(poemId(link.getAttribute("href"))) !== -1) {
        var badge = document.createElement("span");
        badge.className = "found-badge";
        badge.textContent = "✓ Found";
        title.appendChild(badge);
      }
    });
  }

  // Collapsed sections (see collapsible-sections.lua): a link such as
  // /faq#offline opens that section and scrolls to it.
  function openLinkedSection() {
    if (!location.hash) return;
    var target = document.getElementById(decodeURIComponent(location.hash.slice(1)));
    var section = target && target.closest("details");
    if (section && !section.open) {
      section.open = true;
      section.scrollIntoView();
    }
  }
  window.addEventListener("hashchange", openLinkedSection);

  // Quarto's collapsible hint boxes can only be opened with a mouse or touch,
  // and screen readers call each one "Toggle callout". Make each header a
  // real button: reachable with Tab, opened with Enter or Space, and read
  // out by its title ("Hint #1: ...").
  function makeHintsAccessible() {
    document.querySelectorAll('.callout-header[data-bs-toggle="collapse"]').forEach(function (header) {
      header.setAttribute("role", "button");
      header.setAttribute("tabindex", "0");
      header.removeAttribute("aria-label");
      header.addEventListener("keydown", function (event) {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          header.click();
        }
      });
    });
  }

  // Homepage: the map thumbnails sit beside the poem title, so screen
  // readers should skip them (Quarto leaves out the alt text entirely).
  function markThumbnailsDecorative() {
    document.querySelectorAll(".quarto-post img:not([alt])").forEach(function (img) {
      img.setAttribute("alt", "");
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    makeHintsAccessible();
    markThumbnailsDecorative();
    openLinkedSection();
    var tools = document.querySelector(".poem-tools");
    if (tools) {
      setUpPoem(tools);
      setUpShare(tools.querySelector(".share-poem"));
    }
    markFoundCards();
  });

  // Coming back to the homepage with the Back button can show a saved copy
  // of the page, so check the badges again.
  window.addEventListener("pageshow", markFoundCards);
})();
