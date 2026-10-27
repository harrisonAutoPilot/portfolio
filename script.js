const NIGERIA_TZ = "Africa/Lagos";
const WEATHER_URL =
  "https://api.open-meteo.com/v1/forecast?latitude=9.0765&longitude=7.3986&current_weather=true";
const THEME_KEY = "portfolio-theme";

function updateTime() {
  const now = new Date();
  const timeEl = document.getElementById("current-time");
  const periodEl = document.getElementById("time-period");
  const dayEl = document.getElementById("current-day");

  const parts = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: NIGERIA_TZ,
    weekday: "long",
  }).formatToParts(now);

  const hour = parts.find((part) => part.type === "hour")?.value ?? "";
  const minute = parts.find((part) => part.type === "minute")?.value ?? "";
  const period = parts.find((part) => part.type === "dayPeriod")?.value ?? "";
  const weekday = parts.find((part) => part.type === "weekday")?.value ?? "";

  if (timeEl) timeEl.textContent = `${hour}:${minute}`;
  if (periodEl) periodEl.textContent = period.toUpperCase();
  if (dayEl) dayEl.textContent = weekday;

  const dot = document.querySelector(".separator-dot");
  const line = document.querySelector(".separator-line");
  if (!dot || !line) return;

  const seconds = now.getSeconds();
  const maxLeft = Math.max(line.offsetWidth - dot.offsetWidth, 0);
  dot.style.left = `${(seconds / 59) * maxLeft}px`;
}

async function fetchTemperature() {
  const temperatureEl = document.getElementById("temperature");
  if (!temperatureEl) return;

  try {
    const response = await fetch(WEATHER_URL);
    const data = await response.json();
    const temp = data?.current_weather?.temperature;

    temperatureEl.textContent =
      typeof temp === "number" ? `${Math.round(temp)}º` : "N/A";
  } catch {
    temperatureEl.textContent = "N/A";
  }
}

function applyTheme(isDark) {
  document.body.classList.toggle("dark-theme", isDark);
  document.documentElement.setAttribute(
    "data-theme",
    isDark ? "dark" : "light"
  );
  localStorage.setItem(THEME_KEY, isDark ? "dark" : "light");
}

function initTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  const isDark = saved ? saved === "dark" : false;
  applyTheme(isDark);

  const themeSwitch = document.querySelector(".theme-switch");
  if (!themeSwitch) return;

  themeSwitch.addEventListener("click", () => {
    applyTheme(!document.body.classList.contains("dark-theme"));
  });
}

function initSmoothAnchors() {
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (event) => {
      const id = link.getAttribute("href");
      if (!id || id === "#") return;

      const target = document.querySelector(id);
      if (!target) return;

      event.preventDefault();
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      history.replaceState(null, "", id);
    });
  });
}

function initNavPill() {
  const menu = document.querySelector(".nav-menu");
  const pill = document.querySelector(".nav-background");
  const items = [...document.querySelectorAll(".nav-item")];
  if (!menu || !pill || !items.length) return;

  function movePill(item) {
    if (!item) return;
    const menuRect = menu.getBoundingClientRect();
    const itemRect = item.getBoundingClientRect();
    pill.style.width = `${itemRect.width}px`;
    pill.style.transform = `translateX(${itemRect.left - menuRect.left - 5}px)`;
  }

  function setActiveFromScroll() {
    const sections = items
      .map((item) => {
        const id = item.getAttribute("href");
        const el = id ? document.querySelector(id) : null;
        return { item, el };
      })
      .filter((entry) => entry.el);

    let current = sections[0]?.item;
    const offset = window.innerHeight * 0.35;

    for (const { item, el } of sections) {
      if (el.getBoundingClientRect().top <= offset) current = item;
    }

    items.forEach((item) =>
      item.classList.toggle("is-active", item === current)
    );
    movePill(current);
  }

  items.forEach((item) => {
    item.addEventListener("mouseenter", () => movePill(item));
    item.addEventListener("focus", () => movePill(item));
  });

  menu.addEventListener("mouseleave", setActiveFromScroll);
  window.addEventListener("scroll", setActiveFromScroll, { passive: true });
  window.addEventListener("resize", setActiveFromScroll);

  requestAnimationFrame(setActiveFromScroll);
}

function initReveals() {
  const nodes = document.querySelectorAll(".reveal");
  if (!nodes.length) return;

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    nodes.forEach((node) => node.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
  );

  nodes.forEach((node, index) => {
    node.style.transitionDelay = `${Math.min(index * 0.04, 0.28)}s`;
    observer.observe(node);
  });
}

function initLazyVideos() {
  const videos = document.querySelectorAll("video[data-src]");
  if (!videos.length) return;

  const load = (video) => {
    if (video.dataset.loaded) return;
    video.src = video.dataset.src;
    video.dataset.loaded = "true";
    video.play().catch(() => {});
  };

  if (!("IntersectionObserver" in window)) {
    videos.forEach(load);
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        load(entry.target);
        observer.unobserve(entry.target);
      });
    },
    { rootMargin: "200px 0px" }
  );

  videos.forEach((video) => observer.observe(video));
}

document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  updateTime();
  setInterval(updateTime, 1000);
  fetchTemperature();
  initSmoothAnchors();
  initNavPill();
  initReveals();
  initLazyVideos();
});
