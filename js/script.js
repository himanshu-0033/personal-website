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

  /* -------------------------------------------------------- hero dotfield */
  var canvas = $("#dotfield");
  if (canvas && !REDUCED) {
    var ctx = canvas.getContext("2d");
    var dots = [];
    var W = 0, H = 0, DPR = 1;
    var pointer = { x: -9999, y: -9999 };
    var GAP = 34, R = 150;

    var build = function () {
      var rect = canvas.getBoundingClientRect();
      DPR = Math.min(window.devicePixelRatio || 1, 2);
      W = rect.width; H = rect.height;
      canvas.width = Math.round(W * DPR);
      canvas.height = Math.round(H * DPR);
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      dots = [];
      var cols = Math.ceil(W / GAP), rows = Math.ceil(H / GAP);
      var ox = (W - (cols - 1) * GAP) / 2, oy = (H - (rows - 1) * GAP) / 2;
      for (var i = 0; i < cols; i++) {
        for (var j = 0; j < rows; j++) {
          dots.push({ x: ox + i * GAP, y: oy + j * GAP, cx: ox + i * GAP, cy: oy + j * GAP, s: 0 });
        }
      }
    };

    var readVars = function () {
      var cs = getComputedStyle(root);
      return {
        base: cs.getPropertyValue("--fg").trim(),
        hot: cs.getPropertyValue("--accent").trim()
      };
    };
    var colors = readVars();

    var t = 0;
    var draw = function () {
      ctx.clearRect(0, 0, W, H);
      t += 0.006;
      for (var i = 0; i < dots.length; i++) {
        var d = dots[i];
        // slow ambient wave
        var wave = Math.sin(d.cx * 0.012 + t) * Math.cos(d.cy * 0.014 - t) * 2.2;
        var tx = d.cx + wave, ty = d.cy + wave * 0.6;
        var dx = tx - pointer.x, dy = ty - pointer.y;
        var dist = Math.sqrt(dx * dx + dy * dy);
        var f = dist < R ? (1 - dist / R) : 0;
        if (f > 0) {
          var push = f * f * 26;
          tx += (dx / (dist || 1)) * push;
          ty += (dy / (dist || 1)) * push;
        }
        d.x += (tx - d.x) * 0.14;
        d.y += (ty - d.y) * 0.14;
        d.s += (f - d.s) * 0.14;

        var rad = 0.9 + d.s * 2.4;
        ctx.beginPath();
        ctx.arc(d.x, d.y, rad, 0, 6.2832);
        if (d.s > 0.04) {
          ctx.fillStyle = colors.hot;
          ctx.globalAlpha = 0.18 + d.s * 0.72;
        } else {
          ctx.fillStyle = colors.base;
          ctx.globalAlpha = 0.13;
        }
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      requestAnimationFrame(draw);
    };

    build();
    draw();

    var ro = "ResizeObserver" in window ? new ResizeObserver(build) : null;
    if (ro) ro.observe(canvas); else window.addEventListener("resize", build);

    window.addEventListener("mousemove", function (e) {
      var r = canvas.getBoundingClientRect();
      pointer.x = e.clientX - r.left;
      pointer.y = e.clientY - r.top;
    }, { passive: true });
    window.addEventListener("mouseout", function () { pointer.x = pointer.y = -9999; });

    if (themeBtn) themeBtn.addEventListener("click", function () {
      setTimeout(function () { colors = readVars(); }, 60);
    });
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
})();
