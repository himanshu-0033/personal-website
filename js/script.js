(function () {
  "use strict";

  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Theme
  var root = document.documentElement;
  var stored = localStorage.getItem("theme");
  if (stored) root.setAttribute("data-theme", stored);

  var themeBtn = document.getElementById("theme-toggle");
  if (themeBtn) {
    themeBtn.addEventListener("click", function () {
      var current = root.getAttribute("data-theme");
      var isDark = current
        ? current === "dark"
        : window.matchMedia("(prefers-color-scheme: dark)").matches;
      var next = isDark ? "light" : "dark";
      root.setAttribute("data-theme", next);
      localStorage.setItem("theme", next);
    });
  }

  // Mobile menu
  var menuBtn = document.getElementById("menu-toggle");
  var nav = document.getElementById("primary-nav");
  if (menuBtn && nav) {
    menuBtn.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      menuBtn.setAttribute("aria-expanded", open);
    });
  }

  // Résumé dropdown
  var resumeBtn = document.getElementById("resume-btn");
  var resumeMenu = document.getElementById("resume-menu");

  if (resumeBtn && resumeMenu) {
    function closeResume() {
      resumeMenu.classList.remove("open");
      resumeBtn.setAttribute("aria-expanded", "false");
    }

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

  // Project filter (projects.html only)
  var filterBtns = document.querySelectorAll(".filter-btn");
  var cards = document.querySelectorAll(".project-card");
  var emptyMsg = document.getElementById("grid-empty");

  filterBtns.forEach(function (btn) {
    btn.addEventListener("click", function () {
      filterBtns.forEach(function (b) { b.classList.remove("active"); });
      btn.classList.add("active");

      var filter = btn.getAttribute("data-filter");
      var visibleCount = 0;
      cards.forEach(function (card) {
        var show = filter === "all" || card.getAttribute("data-cat") === filter;
        card.classList.toggle("hidden", !show);
        if (show) visibleCount++;
      });
      if (emptyMsg) emptyMsg.hidden = visibleCount !== 0;
    });
  });

  // Bento card cursor-tracked glow (home page teasers)
  var teasers = document.querySelectorAll(".teaser");
  teasers.forEach(function (card) {
    card.addEventListener("mousemove", function (e) {
      var rect = card.getBoundingClientRect();
      card.style.setProperty("--mx", (e.clientX - rect.left) + "px");
      card.style.setProperty("--my", (e.clientY - rect.top) + "px");
    });
  });
})();
