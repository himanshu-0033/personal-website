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
})();
