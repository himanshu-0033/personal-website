/* =========================================================================
   Himanshu Malik, v3 "Signal"
   Vanilla. No dependencies. Everything degrades without JS or with
   prefers-reduced-motion.
   ========================================================================= */
(function () {
  "use strict";

  var doc = document;
  var root = doc.documentElement;
  var REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var FINE = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var $ = function (s, c) { return (c || doc).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || doc).querySelectorAll(s)); };

  /* ---------------------------------------------------------------- theme */
  var themeBtn = $("#theme-toggle");
  if (themeBtn) {
    themeBtn.addEventListener("click", function () {
      var next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", next);
      try { localStorage.setItem("hm-theme", next); } catch (e) {}
      themeBtn.setAttribute("aria-label", next === "dark" ? "Switch to light theme" : "Switch to dark theme");
    });
  }

  /* ------------------------------------------------------------ preloader */
  var loader = $("#loader");
  if (loader) {
    if (REDUCED) {
      root.classList.remove("loading");
      loader.remove();
    } else {
      var count = $(".loader-count", loader);
      var bar = $(".loader-bar", loader);
      var n = 0;
      var start = null;
      var DUR = 1150;

      var tick = function (t) {
        if (start === null) start = t;
        var p = Math.min((t - start) / DUR, 1);
        // ease-out so it decelerates into 100
        var e = 1 - Math.pow(1 - p, 3);
        n = Math.round(e * 100);
        if (count) count.textContent = (n < 10 ? "00" : n < 100 ? "0" : "") + n;
        if (bar) bar.style.transform = "scaleX(" + e + ")";
        if (p < 1) requestAnimationFrame(tick);
        else setTimeout(finish, 220);
      };

      var finish = function () {
        loader.classList.add("done");
        root.classList.remove("loading");
        doc.body.classList.add("loaded");
        setTimeout(function () { loader.remove(); }, 650);
      };

      requestAnimationFrame(tick);
      // hard safety: never trap the page
      setTimeout(function () { if (doc.contains(loader)) finish(); }, 4000);
    }
  } else {
    root.classList.remove("loading");
  }

  /* --------------------------------------------------------------- cursor */
  if (FINE && !REDUCED) {
    var dot = doc.createElement("div"); dot.className = "cursor";
    var ring = doc.createElement("div"); ring.className = "cursor-ring";
    var label = doc.createElement("div"); label.className = "cursor-label";
    doc.body.appendChild(dot); doc.body.appendChild(ring); doc.body.appendChild(label);

    var mx = window.innerWidth / 2, my = window.innerHeight / 2;
    var rx = mx, ry = my;

    doc.addEventListener("mousemove", function (e) {
      mx = e.clientX; my = e.clientY;
      dot.style.transform = "translate(" + mx + "px," + my + "px)";
      label.style.transform = "translate(" + mx + "px," + (my + 44) + "px) translate(-50%,-50%)" +
        (label.classList.contains("on") ? " scale(1)" : " scale(.4)");
    }, { passive: true });

    (function loop() {
      rx += (mx - rx) * 0.16;
      ry += (my - ry) * 0.16;
      ring.style.transform = "translate(" + rx + "px," + ry + "px)";
      requestAnimationFrame(loop);
    })();

    doc.addEventListener("mouseleave", function () { ring.classList.add("hide"); dot.style.opacity = 0; });
    doc.addEventListener("mouseenter", function () { ring.classList.remove("hide"); dot.style.opacity = 1; });

    var HOT = 'a,button,[role="button"],input,textarea,select,summary,[data-modal],[data-cursor]';
    doc.addEventListener("mouseover", function (e) {
      var t = e.target.closest && e.target.closest(HOT);
      if (!t) return;
      ring.classList.add("hot");
      var txt = t.getAttribute("data-cursor");
      if (txt) { label.textContent = txt; label.classList.add("on"); }
    });
    doc.addEventListener("mouseout", function (e) {
      var t = e.target.closest && e.target.closest(HOT);
      if (!t) return;
      if (e.relatedTarget && e.relatedTarget.closest && e.relatedTarget.closest(HOT)) return;
      ring.classList.remove("hot");
      label.classList.remove("on");
    });

    /* magnetic pull on marked elements */
    $$("[data-magnet]").forEach(function (el) {
      var str = parseFloat(el.getAttribute("data-magnet")) || 0.3;
      el.addEventListener("mousemove", function (e) {
        var r = el.getBoundingClientRect();
        var dx = (e.clientX - (r.left + r.width / 2)) * str;
        var dy = (e.clientY - (r.top + r.height / 2)) * str;
        el.style.transform = "translate(" + dx + "px," + dy + "px)";
      });
      el.addEventListener("mouseleave", function () { el.style.transform = ""; });
    });
  }

  /* ----------------------------------------------- scroll meter + header */
  var progress = $("#progress");
  var header = $("#site-header");
  var lastY = window.scrollY;

  // The header floats transparent-and-light over the dark hero slab, then
  // becomes the solid bar once that slab has scrolled past.
  var slab = $(".hero, .page-hero");
  var stickAt = 12;
  var measureSlab = function () {
    stickAt = slab ? Math.max(12, slab.offsetHeight - (header ? header.offsetHeight : 74)) : 12;
  };
  measureSlab();
  window.addEventListener("resize", measureSlab);

  var onScroll = function () {
    var y = window.scrollY;
    if (progress) {
      var max = doc.documentElement.scrollHeight - window.innerHeight;
      progress.style.transform = "scaleX(" + (max > 0 ? y / max : 0) + ")";
    }
    if (header) {
      header.classList.toggle("stuck", y > stickAt);
      var menuOpen = nav && nav.classList.contains("open");
      header.classList.toggle("hidden", !menuOpen && y > 240 && y > lastY);
    }
    lastY = y;
  };

  var ticking = false;
  window.addEventListener("scroll", function () {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () { onScroll(); ticking = false; });
  }, { passive: true });
  onScroll();

  /* ---------------------------------------------------------- mobile menu */
  var menuBtn = $("#menu-toggle");
  var nav = $("#primary-nav");
  if (menuBtn && nav) {
    menuBtn.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      menuBtn.setAttribute("aria-expanded", String(open));
      doc.body.classList.toggle("is-locked", open);
    });
    nav.addEventListener("click", function (e) {
      if (e.target.tagName !== "A") return;
      nav.classList.remove("open");
      menuBtn.setAttribute("aria-expanded", "false");
      doc.body.classList.remove("is-locked");
    });
    doc.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && nav.classList.contains("open")) menuBtn.click();
    });
  }

  /* ------------------------------------------------------ reveal observer */
  var counted = new WeakSet();

  var runCounter = function (el) {
    if (counted.has(el)) return;
    counted.add(el);
    var target = parseFloat(el.getAttribute("data-count"));
    if (isNaN(target)) return;
    var dec = (el.getAttribute("data-count").split(".")[1] || "").length;
    if (REDUCED) { el.textContent = target.toFixed(dec); return; }
    var t0 = null, DUR = 1400;
    var step = function (t) {
      if (t0 === null) t0 = t;
      var p = Math.min((t - t0) / DUR, 1);
      var e = 1 - Math.pow(1 - p, 4);
      el.textContent = (target * e).toFixed(dec);
      if (p < 1) requestAnimationFrame(step);
      else el.textContent = target.toFixed(dec);
    };
    requestAnimationFrame(step);
  };

  var REVEAL = "[data-reveal],[data-stagger],.split,.clip-in,.meter";
  var io = "IntersectionObserver" in window ? new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (!en.isIntersecting) return;
      en.target.classList.add("in");
      $$("[data-count]", en.target).forEach(runCounter);
      if (en.target.hasAttribute("data-count")) runCounter(en.target);
      io.unobserve(en.target);
    });
  }, { rootMargin: "0px 0px -8% 0px", threshold: 0.12 }) : null;

  var observeAll = function (scope) {
    $$(REVEAL, scope).forEach(function (el) {
      if (io) io.observe(el); else el.classList.add("in");
    });
    if (!io) $$("[data-count]", scope || doc).forEach(runCounter);
  };
  observeAll(doc);

  /* ----------------------------------------------------- hero centrepiece */
  /* An iridescent liquid form standing in for the reference's rendered chrome
     blob. It is drawn at a fraction of the display size and scaled up, because
     the upscale is what softens it, and that costs far less per frame than
     blurring at full size.

     What sells metal is banding, not blur: a hard light-to-dark environment
     gradient down the body, the oil-slick screened over it, one specular lobe,
     and a far side that falls into the black. Three sine harmonics give the
     silhouette, and the edge facing the cursor swells toward it. */
  var canvas = $("#hero-canvas");
  if (canvas && !REDUCED) {
    var ctx = canvas.getContext("2d");
    var buf = doc.createElement("canvas");
    var bx = buf.getContext("2d");
    var W = 0, H = 0, BW = 0, BH = 0, rect = null;
    var SCALE = 0.45;
    var pull = 0, pullTo = 0, ang = 0;
    var HARM = [[3, 0.10, 0.62], [5, 0.055, -0.94], [2, 0.075, 0.37]];

    var size = function () {
      rect = canvas.getBoundingClientRect();
      W = Math.max(1, rect.width); H = Math.max(1, rect.height);
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      BW = Math.max(60, Math.round(W * SCALE));
      BH = Math.max(60, Math.round(H * SCALE));
      buf.width = BW; buf.height = BH;
    };

    var path = function (t, cx, cy, R) {
      bx.beginPath();
      for (var i = 0; i <= 180; i++) {
        var th = i / 180 * Math.PI * 2;
        var rr = 1;
        for (var h = 0; h < 3; h++) rr += HARM[h][1] * Math.sin(HARM[h][0] * th + t * HARM[h][2]);
        var face = Math.cos(th - ang);
        if (face > 0) rr += face * face * pull * 0.24;
        var x = cx + Math.cos(th) * R * rr, y = cy + Math.sin(th) * R * rr;
        if (i) bx.lineTo(x, y); else bx.moveTo(x, y);
      }
      bx.closePath();
    };

    var t = 0;
    var draw = function () {
      t += 0.005;
      pull += (pullTo - pull) * 0.06;

      var cx = BW * 0.46, cy = BH * 0.5, R = Math.min(BW, BH) * 0.27;
      var sweep = Math.sin(t * 0.5) * R * 0.3;   // the horizon slides as it turns
      bx.clearRect(0, 0, BW, BH);

      // 1. the environment: a polished body reflects a hard horizon
      var env = bx.createLinearGradient(cx - R * 0.5, cy - R * 1.1 + sweep, cx + R * 0.4, cy + R * 1.1 + sweep);
      env.addColorStop(0.00, "#05070b");
      env.addColorStop(0.16, "#8ea6bd");
      env.addColorStop(0.30, "#ffffff");
      env.addColorStop(0.38, "#c3d2de");
      env.addColorStop(0.47, "#0a0d13");
      env.addColorStop(0.58, "#20262f");
      env.addColorStop(0.70, "#eef4f8");
      env.addColorStop(0.82, "#61748a");
      env.addColorStop(1.00, "#05070b");
      path(t, cx, cy, R);
      bx.fillStyle = env;
      bx.fill();

      // 2. the oil-slick, screened over the metal so it tints without flattening
      if (bx.createConicGradient) {
        var g = bx.createConicGradient(t * 0.4, cx, cy);
        g.addColorStop(0.00, "#04212b");
        g.addColorStop(0.12, "#1e6f7d");
        g.addColorStop(0.26, "#06131c");
        g.addColorStop(0.40, "#3b3f86");
        g.addColorStop(0.54, "#06131c");
        g.addColorStop(0.66, "#8a4620");
        g.addColorStop(0.78, "#0b1a22");
        g.addColorStop(0.90, "#2c6a72");
        g.addColorStop(1.00, "#04212b");
        bx.globalCompositeOperation = "screen";
        bx.globalAlpha = 0.55;
        path(t, cx, cy, R);
        bx.fillStyle = g;
        bx.fill();
        bx.globalAlpha = 1;
      }

      // 3. specular: one bright lobe up and left
      bx.globalCompositeOperation = "screen";
      var s = bx.createRadialGradient(cx - R * 0.38, cy - R * 0.46, 0, cx - R * 0.38, cy - R * 0.46, R * 0.8);
      s.addColorStop(0, "rgba(255,255,255,.8)");
      s.addColorStop(1, "rgba(255,255,255,0)");
      path(t, cx, cy, R);
      bx.fillStyle = s; bx.fill();

      // 4. the far side falls into the black, so the form has a near and far
      bx.globalCompositeOperation = "multiply";
      var d = bx.createRadialGradient(cx + R * 0.5, cy + R * 0.56, R * 0.06, cx + R * 0.5, cy + R * 0.56, R * 1.25);
      d.addColorStop(0, "rgba(0,0,0,.8)");
      d.addColorStop(1, "rgba(255,255,255,1)");
      path(t, cx, cy, R);
      bx.fillStyle = d; bx.fill();
      // 5. feather the rim, so the form floats in the black instead of
      //    sitting on it as a hard dark mass
      bx.globalCompositeOperation = "destination-out";
      var fade = bx.createRadialGradient(cx, cy, R * 0.86, cx, cy, R * 1.16);
      fade.addColorStop(0, "rgba(0,0,0,0)");
      fade.addColorStop(1, "rgba(0,0,0,1)");
      bx.fillStyle = fade;
      bx.fillRect(0, 0, BW, BH);
      bx.globalCompositeOperation = "source-over";

      ctx.clearRect(0, 0, W, H);
      // a blown-up, weak copy first: the cheapest possible bloom
      ctx.globalCompositeOperation = "screen";
      ctx.globalAlpha = 0.22;
      ctx.drawImage(buf, -W * 0.05, -H * 0.05, W * 1.1, H * 1.1);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
      ctx.drawImage(buf, 0, 0, W, H);

      requestAnimationFrame(draw);
    };

    size();
    draw();

    var ro = "ResizeObserver" in window ? new ResizeObserver(size) : null;
    if (ro) ro.observe(canvas); else window.addEventListener("resize", size);
    window.addEventListener("scroll", function () { rect = canvas.getBoundingClientRect(); }, { passive: true });

    window.addEventListener("mousemove", function (e) {
      if (!rect) return;
      var dx = e.clientX - (rect.left + rect.width / 2);
      var dy = e.clientY - (rect.top + rect.height / 2);
      ang = Math.atan2(dy, dx);
      var reach = Math.min(rect.width, rect.height) * 0.5 || 1;
      pullTo = Math.max(0, Math.min(1, 1.6 - Math.sqrt(dx * dx + dy * dy) / reach));
    }, { passive: true });
    window.addEventListener("mouseout", function () { pullTo = 0; });
  }

  /* ------------------------------------------------------------- marquee */
  $$(".marquee-track").forEach(function (track) {
    // duplicate once so the -50% translate loops seamlessly
    track.innerHTML += track.innerHTML;
  });

  /* -------------------------------------------------- work hover preview */
  var rows = $$(".workrow[data-variant]");
  if (rows.length && FINE && !REDUCED) {
    var pv = doc.createElement("div");
    pv.className = "hover-preview";
    pv.setAttribute("aria-hidden", "true");
    doc.body.appendChild(pv);

    var px = 0, py = 0, tx = 0, ty = 0, active = false;

    rows.forEach(function (row) {
      row.addEventListener("mouseenter", function () {
        pv.innerHTML =
          '<div class="tile ' + (row.getAttribute("data-variant") || "") + '">' +
            '<span class="tile-cat">' + (row.getAttribute("data-cat-label") || "") + '</span>' +
            '<span class="tile-num">' + (row.getAttribute("data-n") || "") + '</span>' +
          '</div>';
        pv.classList.add("on");
        active = true;
      });
      row.addEventListener("mouseleave", function () {
        pv.classList.remove("on");
        active = false;
      });
    });

    window.addEventListener("mousemove", function (e) { tx = e.clientX; ty = e.clientY; }, { passive: true });
    (function follow() {
      px += (tx - px) * 0.12;
      py += (ty - py) * 0.12;
      if (active) pv.style.left = px + "px", pv.style.top = py + "px";
      requestAnimationFrame(follow);
    })();
  }

  /* ------------------------------------------------------------ accordion */
  $$(".acc-item").forEach(function (item) {
    var q = $(".acc-q", item);
    var a = $(".acc-a", item);
    if (!q || !a) return;
    q.setAttribute("aria-expanded", "false");
    q.addEventListener("click", function () {
      var open = item.classList.toggle("open");
      q.setAttribute("aria-expanded", String(open));
      a.style.height = open ? a.firstElementChild.offsetHeight + "px" : "0px";
      if (open) {
        // close siblings for a single-open accordion
        var sibs = item.parentElement ? $$(".acc-item.open", item.parentElement) : [];
        sibs.forEach(function (s) {
          if (s === item) return;
          s.classList.remove("open");
          var sq = $(".acc-q", s), sa = $(".acc-a", s);
          if (sq) sq.setAttribute("aria-expanded", "false");
          if (sa) sa.style.height = "0px";
        });
      }
    });
  });
  window.addEventListener("resize", function () {
    $$(".acc-item.open .acc-a").forEach(function (a) {
      a.style.height = a.firstElementChild.offsetHeight + "px";
    });
  });

  /* -------------------------------------------------------------- filters */
  var filterBtns = $$(".filter-btn");
  if (filterBtns.length) {
    var items = $$("[data-cat]");
    var empty = $("#grid-empty");
    filterBtns.forEach(function (btn) {
      btn.addEventListener("click", function () {
        filterBtns.forEach(function (b) {
          b.classList.remove("active");
          b.setAttribute("aria-pressed", "false");
        });
        btn.classList.add("active");
        btn.setAttribute("aria-pressed", "true");

        var f = btn.getAttribute("data-filter");
        var shown = 0;
        items.forEach(function (it) {
          var show = f === "all" || it.getAttribute("data-cat") === f;
          it.classList.toggle("is-hidden", !show);
          if (show) shown++;
        });
        if (empty) empty.hidden = shown !== 0;
      });
    });
  }

  /* ---------------------------------------------------------------- modal */
  var modal = $("#modal");
  var modalContent = $("#modal-content");
  if (modal && modalContent) {
    var scroller = $(".modal-scroll", modal);
    var mProgress = $(".modal-progress", modal);
    var mTitle = $("#modal-eyebrow", modal);
    var lastFocused = null;
    var FOCUSABLE = 'a[href],button:not([disabled]),input,select,textarea,[tabindex]:not([tabindex="-1"])';

    var openModal = function (id, pushHash) {
      var tpl = doc.getElementById("post-" + id);
      if (!tpl) return false;

      modalContent.innerHTML = "";
      modalContent.appendChild(tpl.content.cloneNode(true));

      var h = $("h2", modalContent);
      if (h) { h.id = "modal-heading"; if (mTitle) mTitle.textContent = h.textContent.trim(); }

      lastFocused = doc.activeElement;
      modal.hidden = false;
      doc.body.classList.add("is-locked");
      requestAnimationFrame(function () { modal.classList.add("is-open"); });
      if (scroller) scroller.scrollTop = 0;
      if (mProgress) mProgress.style.transform = "scaleX(0)";

      var closeBtn = $(".modal-close", modal);
      if (closeBtn) closeBtn.focus();

      if (pushHash !== false && history.replaceState) history.replaceState(null, "", "#" + id);
      return true;
    };

    var closeModal = function () {
      if (modal.hidden) return;
      modal.classList.remove("is-open");
      var done = function () {
        modal.hidden = true;
        modalContent.innerHTML = "";
        doc.body.classList.remove("is-locked");
        if (lastFocused && lastFocused.focus) lastFocused.focus();
      };
      if (REDUCED) done(); else setTimeout(done, 480);
      if (history.replaceState) history.replaceState(null, "", location.pathname + location.search);
    };

    if (scroller && mProgress) {
      scroller.addEventListener("scroll", function () {
        var max = scroller.scrollHeight - scroller.clientHeight;
        mProgress.style.transform = "scaleX(" + (max > 0 ? scroller.scrollTop / max : 0) + ")";
      }, { passive: true });
    }

    doc.addEventListener("click", function (e) {
      var trigger = e.target.closest ? e.target.closest("[data-modal]") : null;
      if (!trigger) return;
      // let real links inside a card behave normally
      var link = e.target.closest("a[href]");
      if (link && !link.hasAttribute("data-modal")) return;
      e.preventDefault();
      openModal(trigger.getAttribute("data-modal"));
    });

    doc.addEventListener("keydown", function (e) {
      var trigger = e.target.closest ? e.target.closest("[data-modal]") : null;
      if (trigger && (e.key === "Enter" || e.key === " ") && trigger.tagName !== "BUTTON" && trigger.tagName !== "A") {
        e.preventDefault();
        openModal(trigger.getAttribute("data-modal"));
      }
    });

    modal.addEventListener("click", function (e) {
      if (e.target.closest("[data-close]")) closeModal();
    });

    doc.addEventListener("keydown", function (e) {
      if (modal.hidden) return;
      if (e.key === "Escape") { closeModal(); return; }
      if (e.key !== "Tab") return;
      var list = $$(FOCUSABLE, modal).filter(function (el) { return el.offsetParent !== null; });
      if (!list.length) return;
      var first = list[0], last = list[list.length - 1];
      if (e.shiftKey && doc.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && doc.activeElement === last) { e.preventDefault(); first.focus(); }
    });

    if (location.hash.length > 1) openModal(location.hash.slice(1), false);
  }

  /* ----------------------------------------------------------------- year */
  $$("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });

  /* ------------------------------------------------- pointer-lit surfaces */
  /* One delegated listener writes the cursor's position into custom
     properties; the INTERACTION LAYER block in the stylesheet does the rest.
     The rect is cached per element, so a move costs no layout read, and the
     cache is dropped on scroll because that is what makes it stale. */
  if (FINE && !REDUCED) {
    var LIT = ".card,.resume-panel,.tl-item,.stat,.feature-media";
    var litEl = null, litRect = null;

    doc.addEventListener("mousemove", function (e) {
      var el = e.target.closest ? e.target.closest(LIT) : null;
      if (el !== litEl) { litEl = el; litRect = el ? el.getBoundingClientRect() : null; }
      if (!litEl) return;
      var px = (e.clientX - litRect.left) / litRect.width;
      var py = (e.clientY - litRect.top) / litRect.height;
      litEl.style.setProperty("--mx", (px * 100).toFixed(1) + "%");
      litEl.style.setProperty("--my", (py * 100).toFixed(1) + "%");
      litEl.style.setProperty("--rx", ((0.5 - py) * 4).toFixed(2) + "deg");
      litEl.style.setProperty("--ry", ((px - 0.5) * 4).toFixed(2) + "deg");
    }, { passive: true });

    window.addEventListener("scroll", function () { litEl = null; }, { passive: true });
  }
})();
