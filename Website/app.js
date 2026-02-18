const yearEl = document.getElementById("year");
if (yearEl) {
  yearEl.textContent = String(new Date().getFullYear());
}

const navToggle = document.querySelector(".nav-toggle");
const mainNav = document.getElementById("main-nav");
if (navToggle && mainNav) {
  navToggle.addEventListener("click", () => {
    const open = mainNav.classList.toggle("is-open");
    navToggle.setAttribute("aria-expanded", String(open));
  });

  mainNav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      mainNav.classList.remove("is-open");
      navToggle.setAttribute("aria-expanded", "false");
    });
  });
}

const revealItems = document.querySelectorAll(".reveal");
if ("IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.18 }
  );

  revealItems.forEach((item) => revealObserver.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add("is-visible"));
}

function animateCount(el) {
  const target = Number(el.dataset.target);
  if (!Number.isFinite(target)) return;
  const durationMs = 1000;
  const start = performance.now();

  function tick(now) {
    const progress = Math.min((now - start) / durationMs, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = String(Math.round(target * eased));
    if (progress < 1) requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
}

const metricValues = document.querySelectorAll(".metric-value[data-target]");
if ("IntersectionObserver" in window) {
  const counterObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        animateCount(entry.target);
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.35 }
  );

  metricValues.forEach((node) => counterObserver.observe(node));
} else {
  metricValues.forEach(animateCount);
}

const tabButtons = document.querySelectorAll(".surface-tab");
const panels = {
  today: document.getElementById("surface-today"),
  regulate: document.getElementById("surface-regulate"),
  data: document.getElementById("surface-data"),
};

function setActiveSurface(surfaceKey) {
  tabButtons.forEach((btn) => {
    const selected = btn.dataset.surface === surfaceKey;
    btn.classList.toggle("is-selected", selected);
    btn.setAttribute("aria-selected", String(selected));
  });

  Object.entries(panels).forEach(([key, panel]) => {
    if (!panel) return;
    const show = key === surfaceKey;
    panel.classList.toggle("is-visible", show);
    panel.toggleAttribute("aria-hidden", !show);
  });
}

tabButtons.forEach((btn) => {
  btn.addEventListener("click", () => setActiveSurface(btn.dataset.surface));
});

const heroStateLine = document.getElementById("hero-state-line");
const stateMessages = [
  "Live mode: Explainable output with confidence context.",
  "Today: One best next step is always visible above the fold.",
  "Regulate: Session impact feeds ranking quality in real time.",
  "Data: Trends and experiments track what actually works for you.",
];

if (heroStateLine) {
  let idx = 0;
  window.setInterval(() => {
    idx = (idx + 1) % stateMessages.length;
    heroStateLine.textContent = stateMessages[idx];
  }, 3200);
}

const loopCards = Array.from(document.querySelectorAll(".loop-step"));
if (loopCards.length > 0) {
  let step = 0;
  window.setInterval(() => {
    loopCards.forEach((card, index) => {
      card.classList.toggle("is-active", index === step);
    });
    step = (step + 1) % loopCards.length;
  }, 2200);
}
