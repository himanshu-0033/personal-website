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

    function el(name, attrs) {
      var n = document.createElementNS(NS, name);
      for (var k in attrs) n.setAttribute(k, attrs[k]);
      return n;
    }

    // Build a tapered ribbon through an arbitrary centreline. Working from
    // sampled points rather than a single bezier is what lets the trunk
    // meander as much as it likes.
    function ribbonFromPoints(pts, w0, w1) {
      var left = [], right = [], i, prev, next, dx, dy, len, nx, ny, t, w;
      for (i = 0; i < pts.length; i++) {
        prev = pts[Math.max(0, i - 1)];
        next = pts[Math.min(pts.length - 1, i + 1)];
        dx = next.x - prev.x; dy = next.y - prev.y;
        len = Math.sqrt(dx * dx + dy * dy) || 1;
        nx = -dy / len; ny = dx / len;
        t = i / (pts.length - 1);
        w = (w0 + (w1 - w0) * t) / 2;
        left.push([pts[i].x + nx * w, pts[i].y + ny * w]);
        right.push([pts[i].x - nx * w, pts[i].y - ny * w]);
      }
      right.reverse();
      var fmt = function (a) { return a[0].toFixed(1) + "," + a[1].toFixed(1); };
      return "M" + left.map(fmt).join("L") + "L" + right.map(fmt).join("L") + "Z";
    }

    function cubic(p0, p1, p2, p3, t) {
      var m = 1 - t;
      return {
        x: m*m*m*p0.x + 3*m*m*t*p1.x + 3*m*t*t*p2.x + t*t*t*p3.x,
        y: m*m*m*p0.y + 3*m*m*t*p1.y + 3*m*t*t*p2.y + t*t*t*p3.y
      };
    }

    // a pointed leaf, drawn at the origin then rotated onto the branch
    function leaf(x, y, angleDeg, size, cls, fill) {
      var L = size, w = size * 0.42;
      var d = "M0 0 Q" + (L * 0.45) + " " + (-w) + " " + L + " 0 Q" + (L * 0.45) + " " + w + " 0 0 Z";
      return el("path", {
        d: d,
        fill: fill,
        "class": cls,
        transform: "translate(" + x.toFixed(1) + "," + y.toFixed(1) + ") rotate(" + angleDeg.toFixed(1) + ")"
      });
    }

    // scatter leaves along a sampled centreline
    function leavesAlong(pts, from, to, count, size, seed, bucket) {
      var out = [], i, idx, p, nxt, ang, side, s;
      for (i = 0; i < count; i++) {
        var f = from + (to - from) * (count === 1 ? 0.5 : i / (count - 1));
        idx = Math.min(pts.length - 2, Math.round(f * (pts.length - 1)));
        p = pts[idx];
        nxt = pts[idx + 1];
        ang = Math.atan2(nxt.y - p.y, nxt.x - p.x) * 180 / Math.PI;
        side = (i + seed) % 2 === 0 ? -1 : 1;
        s = size * (0.78 + (((i * 29 + seed * 13) % 9) / 9) * 0.5);
        // green mostly, a few gold ones for variety
        var gold = ((i * 17 + seed * 7) % 5) === 0;
        out.push(leaf(p.x, p.y, ang + side * (38 + ((i * 23) % 22)), s,
                      "leaf" + (gold ? " leaf-gold" : ""),
                      gold ? "#f0b364" : "url(#leafGrad)"));
      }
      bucket.push.apply(bucket, out);
      return out;
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

      // ---- palette ----------------------------------------------------
      var defs = el("defs", {});
      var g = el("linearGradient", { id: "treeGrad", x1: "0", y1: "1", x2: "0", y2: "0" });
      [["0%", "#5f4126"], ["45%", "#8a5f34"], ["100%", "#f0b364"]].forEach(function (stop) {
        g.appendChild(el("stop", { offset: stop[0], "stop-color": stop[1] }));
      });
      defs.appendChild(g);

      var lg = el("linearGradient", { id: "leafGrad", x1: "0", y1: "0", x2: "1", y2: "1" });
      [["0%", "#8fae6b"], ["100%", "#5f7f4c"]].forEach(function (stop) {
        lg.appendChild(el("stop", { offset: stop[0], "stop-color": stop[1] }));
      });
      defs.appendChild(lg);
      svg.appendChild(defs);

      var cx = W / 2;
      var baseY = H;
      var topY = 8;

      // measure each card's attachment point, and how much room the trunk has
      var attach = items.map(function (item) {
        var media = item.querySelector(".work-media") || item;
        var box = media.getBoundingClientRect();
        var isLeft = box.left + box.width / 2 < gridBox.left + gridBox.width / 2;
        return {
          item: item,
          isLeft: isLeft,
          x: (isLeft ? box.right : box.left) - gridBox.left,
          y: box.top + box.height / 2 - gridBox.top
        };
      });

      var room = W;
      attach.forEach(function (a) { room = Math.min(room, Math.abs(a.x - cx)); });
      var amp = Math.max(18, Math.min(74, room * 0.62));   // how far the trunk may wander

      // ---- wavy trunk -------------------------------------------------
      var WAVES = 3.4, PHASE = 0.55;
      function trunkYAt(t) { return baseY + (topY - baseY) * t; }
      function trunkXAt(y) {
        var t = (y - baseY) / (topY - baseY);
        // sway eases in from the roots so the base stays planted
        return cx + amp * Math.sin(t * Math.PI * WAVES + PHASE) * Math.min(1, t * 2.6);
      }

      var trunkPts = [], i, j;
      for (i = 0; i <= 190; i++) {
        var tt = i / 190, yy = trunkYAt(tt);
        trunkPts.push({ x: trunkXAt(yy), y: yy });
      }
      svg.appendChild(el("path", {
        d: ribbonFromPoints(trunkPts, Math.min(22, W * 0.017), 2.6),
        fill: "url(#treeGrad)",
        "class": "trunk"
      }));

      // ---- one wavy branch per card -----------------------------------
      attach.forEach(function (a, idx) {
        var originY = Math.min(baseY - 8, a.y + Math.min(130, H * 0.085));
        var originX = trunkXAt(originY);
        var dx = a.x - originX;
        var dy = a.y - originY;
        var v = ((idx * 37) % 11) / 11;            // stable per-card variation

        // S-shaped: hugs the trunk as it rises, then sweeps out to the card
        var p0 = { x: originX, y: originY };
        var p1 = { x: originX + dx * (0.06 + v * 0.10), y: originY + dy * (0.50 + v * 0.12) };
        var p2 = { x: originX + dx * (0.62 + v * 0.14), y: originY + dy * (0.62 + v * 0.10) };
        var p3 = { x: a.x, y: a.y };

        var pts = [], n = 46, wob = 5 + v * 5;
        for (i = 0; i <= n; i++) {
          var t2 = i / n;
          var pt = cubic(p0, p1, p2, p3, t2);
          var d2 = cubic(p0, p1, p2, p3, Math.min(1, t2 + 0.02));
          var ddx = d2.x - pt.x, ddy = d2.y - pt.y;
          var l2 = Math.sqrt(ddx * ddx + ddy * ddy) || 1;
          var off = wob * Math.sin(t2 * Math.PI * 2.4 + v * 3) * (1 - t2 * 0.75);
          pts.push({ x: pt.x + (-ddy / l2) * off, y: pt.y + (ddx / l2) * off });
        }

        var path = el("path", {
          d: ribbonFromPoints(pts, 8 + v * 3, 1.3),
          fill: "url(#treeGrad)",
          "class": "branch"
        });
        svg.appendChild(path);

        var myLeaves = [];

        // twigs, angled off the branch near its tip
        [0.58, 0.79].forEach(function (at, k) {
          var ri = Math.round(at * n);
          var root = pts[ri];
          var nxt = pts[Math.min(n, ri + 1)];
          var ux = nxt.x - root.x, uy = nxt.y - root.y;
          var l = Math.sqrt(ux * ux + uy * uy) || 1;
          ux /= l; uy /= l;
          var side = k === 0 ? 1 : -1;
          var reach = 24 + k * 10 + v * 8;

          var q3 = {
            x: root.x + ux * reach * 0.45 + -uy * side * reach * 0.8,
            y: root.y + uy * reach * 0.45 + ux * side * reach * 0.8
          };
          var q1 = { x: root.x + ux * reach * 0.4, y: root.y + uy * reach * 0.4 - 5 };
          var q2 = { x: (root.x + q3.x) / 2 - uy * side * 5, y: (root.y + q3.y) / 2 - 4 };

          var tp = [];
          for (j = 0; j <= 18; j++) tp.push(cubic(root, q1, q2, q3, j / 18));
          svg.appendChild(el("path", {
            d: ribbonFromPoints(tp, 3.2, 0.7),
            fill: "url(#treeGrad)",
            "class": "twig"
          }));
          leavesAlong(tp, 0.4, 1, 4, 15, idx + k, myLeaves);
        });

        // leaves along the outer half of the branch
        leavesAlong(pts, 0.34, 0.98, 10, 19, idx, myLeaves);
        myLeaves.forEach(function (n2) { svg.appendChild(n2); });

        var bud = el("circle", {
          cx: a.x.toFixed(1), cy: a.y.toFixed(1), r: 4.5,
          fill: "#f0b364",
          "class": "bud"
        });
        svg.appendChild(bud);

        branchPaths.push({ item: a.item, parts: [path, bud].concat(myLeaves) });
      });

      // ---- crown twigs, with leaves ------------------------------------
      [[-1, 34, 22], [1, 42, 30], [-1, 24, 46]].forEach(function (c, ci) {
        var side = c[0], reach = c[1], drop = c[2];
        var ry = topY + drop;
        var root = { x: trunkXAt(ry), y: ry };
        var q3 = { x: root.x + side * reach, y: root.y - reach * 0.9 };
        var q1 = { x: root.x + side * reach * 0.15, y: root.y - reach * 0.5 };
        var q2 = { x: root.x + side * reach * 0.75, y: root.y - reach * 0.55 };
        var tp = [];
        for (j = 0; j <= 18; j++) tp.push(cubic(root, q1, q2, q3, j / 18));
        svg.appendChild(el("path", {
          d: ribbonFromPoints(tp, 3, 0.7),
          fill: "url(#treeGrad)",
          "class": "twig"
        }));
        var crownLeaves = [];
        leavesAlong(tp, 0.35, 1, 4, 14, ci + 2, crownLeaves);
        crownLeaves.forEach(function (n2) { svg.appendChild(n2); });
      });

      // ---- root flare --------------------------------------------------
      [[-1, 48], [1, 40]].forEach(function (r) {
        var side = r[0], reach = r[1];
        var root = { x: trunkXAt(baseY - 6), y: baseY - 6 };
        var q3 = { x: root.x + side * reach, y: baseY + 14 };
        var q1 = { x: root.x + side * reach * 0.3, y: baseY - 4 };
        var q2 = { x: root.x + side * reach * 0.7, y: baseY + 2 };
        var tp = [];
        for (j = 0; j <= 16; j++) tp.push(cubic(root, q1, q2, q3, j / 16));
        svg.appendChild(el("path", {
          d: ribbonFromPoints(tp, 10, 1.2),
          fill: "url(#treeGrad)",
          "class": "trunk"
        }));
      });

      branchPaths.forEach(function (entry) {
        entry.item.addEventListener("mouseenter", function () {
          entry.parts.forEach(function (n2) { n2.classList.add("is-lit"); });
        });
        entry.item.addEventListener("mouseleave", function () {
          entry.parts.forEach(function (n2) { n2.classList.remove("is-lit"); });
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
    window.addEventListener("load", scheduleDraw);
    grid.addEventListener("transitionend", function (e) {
      if (e.target.classList && e.target.classList.contains("work-item")) scheduleDraw();
    });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(scheduleDraw);
    if ("ResizeObserver" in window) new ResizeObserver(scheduleDraw).observe(grid);
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
