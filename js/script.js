(function () {
  "use strict";

  // Current year, if the footer still shows one
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Mobile menu
  var menuBtn = document.getElementById("menu-toggle");
  var nav = document.getElementById("primary-nav");
  if (menuBtn && nav) {
    menuBtn.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      menuBtn.setAttribute("aria-expanded", open);
    });
    nav.addEventListener("click", function (e) {
      if (e.target.tagName === "A") {
        nav.classList.remove("open");
        menuBtn.setAttribute("aria-expanded", "false");
      }
    });
  }

  // Resume dropdown
  var resumeBtn = document.getElementById("resume-btn");
  var resumeMenu = document.getElementById("resume-menu");

  if (resumeBtn && resumeMenu) {
    var closeResume = function () {
      resumeMenu.classList.remove("open");
      resumeBtn.setAttribute("aria-expanded", "false");
    };

    resumeBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      var open = resumeMenu.classList.toggle("open");
      resumeBtn.setAttribute("aria-expanded", open);
    });
    document.addEventListener("click", function (e) {
      if (!resumeBtn.contains(e.target) && !resumeMenu.contains(e.target)) closeResume();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeResume();
    });
  }

  // Project filter
  var filterBtns = document.querySelectorAll(".filter-btn");
  var cards = document.querySelectorAll("[data-cat]");
  var emptyMsg = document.getElementById("grid-empty");

  filterBtns.forEach(function (btn) {
    btn.addEventListener("click", function () {
      filterBtns.forEach(function (b) { b.classList.remove("active"); });
      btn.classList.add("active");

      var filter = btn.getAttribute("data-filter");
      var shown = 0;
      cards.forEach(function (card) {
        var show = filter === "all" || card.getAttribute("data-cat") === filter;
        card.classList.toggle("hidden", !show);
        if (show) shown++;
      });
      if (emptyMsg) emptyMsg.hidden = shown !== 0;
    });
  });

  /* ---------------- Write-up modal ---------------- */
  var modal = document.getElementById("modal");
  var modalContent = document.getElementById("modal-content");

  if (modal && modalContent) {
    var lastFocused = null;
    var FOCUSABLE = 'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])';

    var openModal = function (id, pushHash) {
      var tpl = document.getElementById("post-" + id);
      if (!tpl) return false;

      modalContent.innerHTML = "";
      modalContent.appendChild(tpl.content.cloneNode(true));

      // label the dialog with whatever heading the post carries
      var heading = modalContent.querySelector("h2");
      if (heading) heading.id = "modal-heading";

      lastFocused = document.activeElement;
      modal.hidden = false;
      document.body.classList.add("modal-open");
      // next frame so the transition runs
      requestAnimationFrame(function () { modal.classList.add("is-open"); });
      modalContent.scrollTop = 0;

      var closeBtn = modal.querySelector(".modal-close");
      if (closeBtn) closeBtn.focus();

      if (pushHash !== false && history.replaceState) {
        history.replaceState(null, "", "#" + id);
      }
      return true;
    };

    var closeModal = function () {
      if (modal.hidden) return;
      modal.classList.remove("is-open");

      var done = function () {
        modal.hidden = true;
        modalContent.innerHTML = "";
        document.body.classList.remove("modal-open");
        if (lastFocused && lastFocused.focus) lastFocused.focus();
      };

      var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduce) done();
      else setTimeout(done, 300);

      if (history.replaceState) {
        history.replaceState(null, "", location.pathname + location.search);
      }
    };

    // open from any element carrying data-modal
    document.querySelectorAll("[data-modal]").forEach(function (trigger) {
      trigger.addEventListener("click", function (e) {
        // if a nested trigger (the read-more button) was clicked, let it handle this
        if (e.target.closest("[data-modal]") !== trigger) return;
        // let genuine links inside a card still work
        var link = e.target.closest("a[href]");
        if (link && !link.hasAttribute("data-modal")) return;
        e.preventDefault();
        openModal(trigger.getAttribute("data-modal"));
      });

      trigger.addEventListener("keydown", function (e) {
        if (e.target !== trigger) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openModal(trigger.getAttribute("data-modal"));
        }
      });
    });

    // close: backdrop, the close button, Escape
    modal.addEventListener("click", function (e) {
      if (e.target.closest("[data-close]")) closeModal();
    });

    document.addEventListener("keydown", function (e) {
      if (modal.hidden) return;

      if (e.key === "Escape") {
        closeModal();
        return;
      }

      if (e.key === "Tab") {
        var items = modal.querySelectorAll(FOCUSABLE);
        if (!items.length) return;
        var first = items[0];
        var last = items[items.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    });

    // deep link: /projects.html#zepto opens that write-up
    if (location.hash.length > 1) {
      openModal(location.hash.slice(1), false);
    }
  }


  /* ---------------- Draw the work tree ---------------- */
  var grid = document.querySelector(".work-grid");
  if (grid && !window.matchMedia("(max-width: 820px)").matches) {
    var NS = "http://www.w3.org/2000/svg";

    var svg = document.createElementNS(NS, "svg");
    svg.setAttribute("class", "tree-canvas");
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("preserveAspectRatio", "none");
    grid.insertBefore(svg, grid.firstChild);

    // --- bezier helpers -------------------------------------------------
    function qPoint(p0, p1, p2, t) {
      var m = 1 - t;
      return {
        x: m * m * p0.x + 2 * m * t * p1.x + t * t * p2.x,
        y: m * m * p0.y + 2 * m * t * p1.y + t * t * p2.y
      };
    }
    function qTangent(p0, p1, p2, t) {
      var m = 1 - t;
      return {
        x: 2 * m * (p1.x - p0.x) + 2 * t * (p2.x - p1.x),
        y: 2 * m * (p1.y - p0.y) + 2 * t * (p2.y - p1.y)
      };
    }

    // a curve with real thickness that tapers from w0 to w1
    function ribbon(p0, p1, p2, w0, w1, steps) {
      var left = [], right = [], i, t, pt, d, len, nx, ny, w;
      steps = steps || 26;
      for (i = 0; i <= steps; i++) {
        t = i / steps;
        pt = qPoint(p0, p1, p2, t);
        d = qTangent(p0, p1, p2, t);
        len = Math.sqrt(d.x * d.x + d.y * d.y) || 1;
        nx = -d.y / len; ny = d.x / len;
        w = (w0 + (w1 - w0) * t) / 2;
        left.push([pt.x + nx * w, pt.y + ny * w]);
        right.push([pt.x - nx * w, pt.y - ny * w]);
      }
      right.reverse();
      var fmt = function (a) { return a[0].toFixed(1) + "," + a[1].toFixed(1); };
      return "M" + left.map(fmt).join("L") + "L" + right.map(fmt).join("L") + "Z";
    }

    function el(name, attrs) {
      var n = document.createElementNS(NS, name);
      for (var k in attrs) n.setAttribute(k, attrs[k]);
      return n;
    }

    var branchPaths = [];

    function draw() {
      var W = grid.offsetWidth;
      var H = grid.offsetHeight;
      if (!W || !H) return;

      svg.setAttribute("viewBox", "0 0 " + W + " " + H);
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      branchPaths = [];

      var gridBox = grid.getBoundingClientRect();
      var items = [].slice.call(grid.querySelectorAll(".work-item")).filter(function (it) {
        return !it.classList.contains("hidden") && it.offsetParent !== null;
      });
      if (!items.length) return;

      // --- palette ------------------------------------------------------
      var defs = el("defs", {});
      var g = el("linearGradient", { id: "treeGrad", x1: "0", y1: "1", x2: "0", y2: "0" });
      [["0%", "#5f4126"], ["45%", "#8a5f34"], ["100%", "#f0b364"]].forEach(function (stop) {
        g.appendChild(el("stop", { offset: stop[0], "stop-color": stop[1] }));
      });
      defs.appendChild(g);
      svg.appendChild(defs);

      var cx = W / 2;
      var sway = Math.min(16, W * 0.014);       // gentle lean, like a real trunk
      var baseY = H;                             // roots
      var topY = 10;                             // crown

      // trunk centreline as a quadratic; control point offset gives the sway
      var t0 = { x: cx - sway * 0.35, y: baseY };
      var t1 = { x: cx + sway, y: (baseY + topY) / 2 };
      var t2 = { x: cx - sway * 0.15, y: topY };

      function trunkXAt(y) {
        // find t whose point is nearest this y (trunk is monotonic in y)
        var lo = 0, hi = 1, mid, pt;
        for (var i = 0; i < 22; i++) {
          mid = (lo + hi) / 2;
          pt = qPoint(t0, t1, t2, mid);
          if (pt.y > y) lo = mid; else hi = mid;
        }
        return qPoint(t0, t1, t2, (lo + hi) / 2).x;
      }

      svg.appendChild(el("path", {
        d: ribbon(t0, t1, t2, Math.min(20, W * 0.016), 3, 40),
        fill: "url(#treeGrad)",
        "class": "trunk"
      }));

      // --- one branch per card -----------------------------------------
      items.forEach(function (item, i) {
        var media = item.querySelector(".work-media") || item;
        var box = media.getBoundingClientRect();
        var isLeft = box.left + box.width / 2 < gridBox.left + gridBox.width / 2;

        var tipY = box.top + box.height / 2 - gridBox.top;
        var tipX = (isLeft ? box.right : box.left) - gridBox.left;

        // branches leave the trunk lower down and sweep upward
        var originY = Math.min(baseY - 6, tipY + Math.min(120, H * 0.09));
        var originX = trunkXAt(originY);

        // deterministic variation so no two branches are identical
        var v = ((i * 37) % 11) / 11;              // 0..1, stable per card
        var bend = 0.34 + v * 0.20;                 // how early it turns outward
        var rise = 0.68 + v * 0.22;                 // how steeply it climbs

        var ctrl = {
          x: originX + (tipX - originX) * bend,
          y: originY - (originY - tipY) * rise
        };
        var start = { x: originX, y: originY };
        var tip = { x: tipX, y: tipY };

        var path = el("path", {
          d: ribbon(start, ctrl, tip, 8 + v * 3, 1.3, 28),
          fill: "url(#treeGrad)",
          "class": "branch"
        });
        svg.appendChild(path);

        // two twigs near the tip, so it reads as growth rather than a pipe
        [0.62, 0.82].forEach(function (at, k) {
          var root = qPoint(start, ctrl, tip, at);
          var dir = qTangent(start, ctrl, tip, at);
          var len = Math.sqrt(dir.x * dir.x + dir.y * dir.y) || 1;
          var ux = dir.x / len, uy = dir.y / len;
          var side = k === 0 ? 1 : -1;
          var reach = 26 + k * 8;
          var tEnd = {
            x: root.x + ux * reach * 0.5 + -uy * side * reach * 0.75,
            y: root.y + uy * reach * 0.5 + ux * side * reach * 0.75
          };
          var tCtrl = {
            x: root.x + ux * reach * 0.45,
            y: root.y + uy * reach * 0.45 - 6
          };
          svg.appendChild(el("path", {
            d: ribbon(root, tCtrl, tEnd, 3.2, 0.8, 14),
            fill: "url(#treeGrad)",
            "class": "twig"
          }));
        });

        // bud where the branch meets the card
        var bud = el("circle", {
          cx: tipX.toFixed(1), cy: tipY.toFixed(1), r: 4.5,
          fill: "#f0b364",
          "class": "bud"
        });
        svg.appendChild(bud);

        branchPaths.push({ item: item, parts: [path, bud] });
      });

      // --- crown: a few twigs finishing the top of the trunk ---
      var crown = qPoint(t0, t1, t2, 1);
      [[-1, 34, 20], [1, 40, 26], [-1, 22, 40]].forEach(function (c) {
        var side = c[0], reach = c[1], drop = c[2];
        var root = { x: trunkXAt(topY + drop), y: topY + drop };
        var end = { x: root.x + side * reach, y: root.y - reach * 0.85 };
        var ctl = { x: root.x + side * reach * 0.35, y: root.y - reach * 0.7 };
        svg.appendChild(el("path", {
          d: ribbon(root, ctl, end, 3, 0.7, 14),
          fill: "url(#treeGrad)",
          "class": "twig"
        }));
      });

      // --- roots: a slight flare where the trunk meets the ground ---
      [[-1, 46], [1, 38]].forEach(function (r) {
        var side = r[0], reach = r[1];
        var root = { x: trunkXAt(baseY - 4), y: baseY - 4 };
        var end = { x: root.x + side * reach, y: baseY + 12 };
        var ctl = { x: root.x + side * reach * 0.5, y: baseY - 2 };
        svg.appendChild(el("path", {
          d: ribbon(root, ctl, end, 9, 1.2, 14),
          fill: "url(#treeGrad)",
          "class": "trunk"
        }));
      });

      // light the branch of whichever card is hovered
      branchPaths.forEach(function (entry) {
        entry.item.addEventListener("mouseenter", function () {
          entry.parts.forEach(function (n) { n.classList.add("is-lit"); });
        });
        entry.item.addEventListener("mouseleave", function () {
          entry.parts.forEach(function (n) { n.classList.remove("is-lit"); });
        });
      });
    }

    var raf;
    function scheduleDraw() {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(draw);
    }

    scheduleDraw();
    window.addEventListener("resize", scheduleDraw);
    // cards translate while revealing — redraw once they settle
    grid.addEventListener("transitionend", function (e) {
      if (e.target.classList && e.target.classList.contains("work-item")) scheduleDraw();
    });
    window.addEventListener("load", scheduleDraw);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(scheduleDraw);
    if ("ResizeObserver" in window) new ResizeObserver(scheduleDraw).observe(grid);
    // filtering changes which cards are on screen
    document.querySelectorAll(".filter-btn").forEach(function (b) {
      b.addEventListener("click", function () { setTimeout(scheduleDraw, 30); });
    });
  }

  /* ---------------- Scroll reveal ---------------- */
  var revealables = document.querySelectorAll("[data-reveal]");
  if (!revealables.length) return;

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduceMotion || !("IntersectionObserver" in window)) {
    revealables.forEach(function (el) { el.classList.add("is-visible"); });
    return;
  }

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target);
    });
  }, { rootMargin: "0px 0px -10% 0px", threshold: 0.05 });

  revealables.forEach(function (el, i) {
    el.style.transitionDelay = Math.min(i % 3, 2) * 100 + "ms";
    observer.observe(el);
  });

  /* ---------------- Particle canvas (hero) ---------------- */
  var canvas = document.getElementById("particles");
  if (canvas) {
    var ctx = canvas.getContext("2d");
    var particles = [];
    var PARTICLE_COUNT = 60;
    var mouseX = 0.5;
    var mouseY = 0.5;

    function resizeCanvas() {
      var hero = canvas.parentElement;
      canvas.width = hero.offsetWidth;
      canvas.height = hero.offsetHeight;
    }
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    for (var i = 0; i < PARTICLE_COUNT; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 1.8 + 0.4,
        dx: (Math.random() - 0.5) * 0.3,
        dy: (Math.random() - 0.5) * 0.3,
        alpha: Math.random() * 0.5 + 0.15
      });
    }

    function drawParticles() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (var j = 0; j < particles.length; j++) {
        var p = particles[j];
        p.x += p.dx;
        p.y += p.dy;

        // wrap around edges
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(169, 205, 241, " + p.alpha + ")";
        ctx.fill();
      }

      // draw faint connection lines between nearby particles
      for (var a = 0; a < particles.length; a++) {
        for (var b = a + 1; b < particles.length; b++) {
          var distX = particles[a].x - particles[b].x;
          var distY = particles[a].y - particles[b].y;
          var dist = Math.sqrt(distX * distX + distY * distY);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(particles[a].x, particles[a].y);
            ctx.lineTo(particles[b].x, particles[b].y);
            ctx.strokeStyle = "rgba(169, 205, 241, " + (0.06 * (1 - dist / 120)) + ")";
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      requestAnimationFrame(drawParticles);
    }
    drawParticles();
  }

  /* ---------------- Parallax on hero name ---------------- */
  var heroName = document.querySelector(".hero-name");
  var hero = document.querySelector(".hero");
  if (heroName && hero) {
    hero.addEventListener("mousemove", function (e) {
      var rect = hero.getBoundingClientRect();
      var x = (e.clientX - rect.left) / rect.width - 0.5;
      var y = (e.clientY - rect.top) / rect.height - 0.5;
      heroName.style.transform = "translate(" + (x * 12) + "px, " + (y * 8) + "px)";
    });
    hero.addEventListener("mouseleave", function () {
      heroName.style.transition = "transform 0.6s ease";
      heroName.style.transform = "translate(0, 0)";
      setTimeout(function () { heroName.style.transition = ""; }, 600);
    });
  }

})();
