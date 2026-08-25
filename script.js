/* ============================================================
   Minzhou Li · Personal Homepage
   Theme / language switching, scroll progress, nav highlight,
   reveal-on-scroll animations, copy-to-clipboard email.
   ============================================================ */
(function () {
  "use strict";

  var root = document.documentElement;
  root.classList.remove("no-js");
  root.classList.add("js");

  var prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  /* ---------- Theme ---------- */
  var toggle = document.getElementById("themeToggle");

  function setTheme(theme) {
    root.dataset.theme = theme;
    try { localStorage.setItem("theme", theme); } catch (e) {}
  }

  if (toggle) {
    toggle.addEventListener("click", function () {
      setTheme(root.dataset.theme === "dark" ? "light" : "dark");
    });
  }

  // Follow system changes while no manual choice is stored
  var systemDark = window.matchMedia("(prefers-color-scheme: dark)");
  systemDark.addEventListener("change", function (e) {
    var stored = null;
    try { stored = localStorage.getItem("theme"); } catch (err) {}
    if (stored !== "light" && stored !== "dark") {
      root.dataset.theme = e.matches ? "dark" : "light";
    }
  });

  /* ---------- Language ---------- */
  var TITLES = {
    en: "Minzhou Li 李岷洲 · PhD Student in Chemistry, Tsinghua University",
    zh: "李岷洲 Minzhou Li · 清华大学化学系博士研究生"
  };

  var langSwitch = document.querySelector(".lang-switch");
  var langOpts = Array.prototype.slice.call(
    document.querySelectorAll(".lang-opt")
  );
  var langThumb = langSwitch ? langSwitch.querySelector(".lang-thumb") : null;

  function positionThumb(animate) {
    if (!langSwitch || !langThumb) return;
    var current = root.dataset.lang === "zh" ? "zh" : "en";
    var target = langSwitch.querySelector('[data-set-lang="' + current + '"]');
    if (!target) return;
    if (!animate) langSwitch.classList.add("no-anim");
    langThumb.style.width = target.offsetWidth + "px";
    langThumb.style.transform =
      "translateX(" + (target.offsetLeft - 3) + "px)";
    if (!animate) {
      void langThumb.offsetWidth; /* force reflow before re-enabling */
      langSwitch.classList.remove("no-anim");
    }
  }

  function setLang(lang) {
    if (lang !== "en" && lang !== "zh") lang = "en";
    root.dataset.lang = lang;
    root.lang = lang === "zh" ? "zh-CN" : "en";
    document.title = TITLES[lang];
    try { localStorage.setItem("lang", lang); } catch (e) {}
    langOpts.forEach(function (btn) {
      var active = btn.getAttribute("data-set-lang") === lang;
      btn.classList.toggle("active", active);
      btn.setAttribute("aria-pressed", active ? "true" : "false");
    });
    positionThumb(true);
  }

  langOpts.forEach(function (btn) {
    btn.addEventListener("click", function () {
      setLang(btn.getAttribute("data-set-lang"));
    });
  });

  // Apply stored/default language (set on <html> by the head script)
  setLang(root.dataset.lang === "zh" ? "zh" : "en");

  window.addEventListener("resize", function () {
    positionThumb(false);
  });

  /* ---------- Footer year ---------- */
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  /* ---------- Scroll progress & nav state ---------- */
  var progress = document.querySelector(".progress");
  var nav = document.getElementById("nav");
  var ticking = false;

  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      var doc = document.documentElement;
      var max = doc.scrollHeight - doc.clientHeight;
      var ratio = max > 0 ? window.scrollY / max : 0;
      if (progress) {
        progress.style.transform = "scaleX(" + ratio + ")";
      }
      if (nav) {
        nav.classList.toggle("scrolled", window.scrollY > 8);
      }
      ticking = false;
    });
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Active section highlight ---------- */
  var navLinks = Array.prototype.slice.call(
    document.querySelectorAll(".nav-links a")
  );

  function setActive(id) {
    navLinks.forEach(function (a) {
      a.classList.toggle("active", a.getAttribute("href") === "#" + id);
    });
  }

  var sections = Array.prototype.slice.call(
    document.querySelectorAll("main section[id]")
  );

  if ("IntersectionObserver" in window && sections.length) {
    var sectionObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) setActive(entry.target.id);
        });
      },
      { rootMargin: "-40% 0px -55% 0px", threshold: 0 }
    );
    sections.forEach(function (s) { sectionObserver.observe(s); });
  }

  /* ---------- Reveal on scroll ---------- */
  var revealEls = Array.prototype.slice.call(
    document.querySelectorAll(".reveal")
  );

  if (prefersReducedMotion || !("IntersectionObserver" in window)) {
    revealEls.forEach(function (el) { el.classList.add("visible"); });
  } else {
    revealEls.forEach(function (el) {
      var delay = parseInt(el.getAttribute("data-delay") || "0", 10);
      if (delay) el.style.setProperty("--reveal-delay", delay + "ms");
    });
    var revealObserver = new IntersectionObserver(
      function (entries, observer) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.1 }
    );
    revealEls.forEach(function (el) { revealObserver.observe(el); });
  }

  /* ---------- Copy email ---------- */
  document.querySelectorAll(".email-copy").forEach(function (btn) {
    var addr = btn.querySelector(".em-addr");
    var doneLabel = btn.querySelector(".em-done");
    var timer = null;

    btn.addEventListener("click", function () {
      var email = btn.getAttribute("data-email") || "";
      var showDone = function () {
        if (addr && doneLabel) {
          addr.hidden = true;
          doneLabel.hidden = false;
          btn.classList.add("copied");
          if (timer) clearTimeout(timer);
          timer = setTimeout(function () {
            doneLabel.hidden = true;
            addr.hidden = false;
            btn.classList.remove("copied");
          }, 1800);
        }
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(email).then(showDone, showDone);
      } else {
        var ta = document.createElement("textarea");
        ta.value = email;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand("copy"); } catch (e) {}
        document.body.removeChild(ta);
        showDone();
      }
    });
  });
})();
