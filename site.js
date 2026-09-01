/* TAP on Doge documentation: theme toggle, heading anchors, local search.
   No network calls other than loading search-index.json from this same site.
   Nothing typed into the search box leaves the browser. */
(function () {
  "use strict";

  /* ---------- theme ---------- */

  var KEY = "tap-on-doge-theme";
  var root = document.documentElement;

  function stored() {
    try { return localStorage.getItem(KEY); } catch (e) { return null; }
  }
  function apply(mode) {
    if (mode === "dark" || mode === "light") root.setAttribute("data-theme", mode);
    else root.removeAttribute("data-theme");
  }
  function current() {
    var v = root.getAttribute("data-theme");
    if (v) return v;
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }

  apply(stored());

  var btn = document.getElementById("theme-toggle");
  function paint() {
    if (!btn) return;
    var dark = current() === "dark";
    btn.textContent = dark ? "☀" : "☽";
    btn.setAttribute("aria-label", dark ? "Switch to light theme" : "Switch to dark theme");
    btn.setAttribute("title", dark ? "Switch to light theme" : "Switch to dark theme");
  }
  if (btn) {
    btn.hidden = false;
    paint();
    btn.addEventListener("click", function () {
      var next = current() === "dark" ? "light" : "dark";
      apply(next);
      try { localStorage.setItem(KEY, next); } catch (e) { /* storage unavailable */ }
      paint();
    });
  }

  /* ---------- heading anchors ---------- */

  var heads = document.querySelectorAll("main h2[id], main h3[id]");
  for (var h = 0; h < heads.length; h++) {
    var a = document.createElement("a");
    a.className = "anchor";
    a.href = "#" + heads[h].id;
    a.setAttribute("aria-label", "Link to this section");
    a.textContent = "#";
    heads[h].appendChild(a);
  }

  /* ---------- search ---------- */

  var input = document.getElementById("q");
  var out = document.getElementById("search-results");
  if (!input || !out) return;

  var index = null;
  var loading = false;
  var pending = false;

  function load() {
    if (index || loading) return;
    loading = true;
    var base = document.body.getAttribute("data-base") || "";
    fetch(base + "search-index.json", { credentials: "omit" })
      .then(function (r) { return r.ok ? r.json() : []; })
      .then(function (rows) {
        index = Array.isArray(rows) ? rows : [];
        loading = false;
        if (pending) { pending = false; run(); }
      })
      .catch(function () { index = []; loading = false; if (pending) { pending = false; run(); } });
  }

  function norm(s) { return String(s || "").toLowerCase(); }

  function score(row, terms) {
    var hay = norm(row.title) + "  " + norm(row.page) + "  " + norm((row.aliases || []).join(" ")) + "  " + norm(row.text);
    var title = norm(row.title) + " " + norm((row.aliases || []).join(" "));
    var total = 0;
    for (var i = 0; i < terms.length; i++) {
      var t = terms[i];
      if (hay.indexOf(t) === -1) return 0;
      total += 1;
      if (title.indexOf(t) !== -1) total += 4;
      if (title.indexOf(t) === 0) total += 3;
    }
    return total;
  }

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  function run() {
    var raw = input.value.trim();
    if (!raw) { out.hidden = true; out.innerHTML = ""; return; }
    if (!index) { load(); pending = true; out.hidden = false; out.innerHTML = '<p class="search-empty">Loading the index…</p>'; return; }

    var terms = norm(raw).split(/\s+/).filter(Boolean);
    var hits = [];
    for (var i = 0; i < index.length; i++) {
      var s = score(index[i], terms);
      if (s > 0) hits.push({ s: s, r: index[i] });
    }
    hits.sort(function (a, b) { return b.s - a.s; });
    hits = hits.slice(0, 10);

    out.hidden = false;
    if (!hits.length) {
      out.innerHTML = '<p class="search-empty">No match for <b>' + esc(raw) +
        '</b>. Try an operation name such as <code>token-mint</code>, or a topic such as <code>reorg</code>, <code>envelope</code>, <code>confirmations</code>, <code>dogemap</code>.</p>';
      return;
    }
    var base = document.body.getAttribute("data-base") || "";
    var html = "<ol>";
    for (var k = 0; k < hits.length; k++) {
      var r = hits[k].r;
      html += '<li><a href="' + esc(base + r.url) + '">' +
        '<span class="sr-page">' + esc(r.page) + "</span>" +
        '<span class="sr-title">' + esc(r.title) + "</span>" +
        '<span class="sr-snip">' + esc(r.text.slice(0, 118)) + (r.text.length > 118 ? "…" : "") + "</span>" +
        "</a></li>";
    }
    html += "</ol>";
    out.innerHTML = html;
  }

  input.addEventListener("focus", load);
  input.addEventListener("input", run);
  input.addEventListener("keydown", function (e) {
    if (e.key === "Escape") { input.value = ""; out.hidden = true; input.blur(); }
    if (e.key === "ArrowDown") {
      var first = out.querySelector("a");
      if (first) { e.preventDefault(); first.focus(); }
    }
  });
  out.addEventListener("keydown", function (e) {
    if (e.key === "Escape") { out.hidden = true; input.focus(); }
  });
  document.addEventListener("click", function (e) {
    if (!out.hidden && !out.contains(e.target) && e.target !== input) out.hidden = true;
  });
  document.addEventListener("keydown", function (e) {
    if (e.key !== "/" || e.ctrlKey || e.metaKey || e.altKey) return;
    var t = e.target;
    if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
    e.preventDefault();
    input.focus();
    input.select();
  });
})();
