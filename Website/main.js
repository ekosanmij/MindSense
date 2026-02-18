const menuToggle = document.querySelector(".menu-toggle");
const siteNav = document.querySelector("#site-nav");
const siteHeader = document.querySelector(".site-header");
const scrollProgressBar = document.querySelector("[data-scroll-progress]");
const navSectionLinks = siteNav
  ? Array.from(siteNav.querySelectorAll('a[href^="#"]')).filter((link) => {
      const href = link.getAttribute("href");
      return Boolean(href && href.length > 1);
    })
  : [];

const trackEvent = (eventName, payload = {}) => {
  if (!eventName) {
    return;
  }

  const eventPayload = {
    event: eventName,
    page_path: window.location.pathname,
    ...payload,
  };

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(eventPayload);

  if (typeof window.gtag === "function") {
    window.gtag("event", eventName, payload);
  }
};

const rootElement = document.documentElement;
const themeToggle = document.querySelector("[data-theme-toggle]");
const themeLabel = themeToggle ? themeToggle.querySelector("[data-theme-label]") : null;
const themeIcon = themeToggle ? themeToggle.querySelector("[data-theme-icon]") : null;
const themeColorMeta = document.querySelector('meta[name="theme-color"]');
const themedSources = Array.from(document.querySelectorAll("[data-theme-source]"));
const themedImages = Array.from(document.querySelectorAll("[data-theme-image]"));
const prefersDarkMedia = window.matchMedia("(prefers-color-scheme: dark)");
const reduceMotionMedia = window.matchMedia("(prefers-reduced-motion: reduce)");
const finePointerMedia = window.matchMedia("(hover: hover) and (pointer: fine)");
const mobileNavMedia = window.matchMedia("(max-width: 760px)");
const siteLoader = document.querySelector("[data-site-loader]");
const loaderValueNode = siteLoader ? siteLoader.querySelector("[data-loader-value]") : null;
const heroSection = document.querySelector("#top");
const THEME_STORAGE_KEY = "mindsense-theme";
const THEME_VALUES = ["light", "dark"];
const reduceMotion = reduceMotionMedia.matches;

let currentTheme = "dark";
let hasThemeOverride = false;
let setSurface = null;

rootElement.classList.add("js");
rootElement.dataset.motion = reduceMotion ? "minimal" : "enhanced";

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const lerp = (from, to, factor) => from + (to - from) * factor;

const getStoredTheme = () => {
  try {
    const value = window.localStorage.getItem(THEME_STORAGE_KEY);
    return THEME_VALUES.includes(value) ? value : null;
  } catch (error) {
    return null;
  }
};

const getSystemTheme = () => (prefersDarkMedia.matches ? "dark" : "light");

const resolveAssetPath = (dataset, theme, variant) => {
  if (!dataset) {
    return "";
  }

  const key = `${theme}${variant === "hd" ? "Hd" : "Web"}`;
  return dataset[key] || "";
};

const syncThemeMedia = () => {
  themedSources.forEach((source) => {
    const web = resolveAssetPath(source.dataset, currentTheme, "web");
    const hd = resolveAssetPath(source.dataset, currentTheme, "hd");
    if (web && hd) {
      source.srcset = `${web} 900w, ${hd} 1170w`;
    }
  });

  themedImages.forEach((image) => {
    const web = resolveAssetPath(image.dataset, currentTheme, "web");
    if (web) {
      image.src = web;
    }
  });

  if (typeof setSurface === "function") {
    const activeTab =
      document.querySelector(".surface-tab.is-active") || document.querySelector(".surface-tab");
    if (activeTab) {
      setSurface(activeTab, "theme", { track: false });
    }
  }
};

const syncThemeToggle = () => {
  if (!themeToggle) {
    return;
  }

  const isDark = currentTheme === "dark";
  themeToggle.setAttribute("aria-label", isDark ? "Switch to light mode" : "Switch to dark mode");
  themeToggle.setAttribute("aria-pressed", String(isDark));

  if (themeLabel) {
    themeLabel.textContent = isDark ? "Dark" : "Light";
  }

  if (themeIcon) {
    themeIcon.textContent = isDark ? "☾" : "☀";
  }
};

const syncThemeMeta = () => {
  if (!themeColorMeta) {
    return;
  }

  themeColorMeta.setAttribute("content", currentTheme === "dark" ? "#081f26" : "#eaf3fb");
};

const applyTheme = (theme, options = {}) => {
  const { persist = false, track = false } = options;

  if (!THEME_VALUES.includes(theme)) {
    return;
  }

  currentTheme = theme;
  rootElement.dataset.theme = theme;
  syncThemeToggle();
  syncThemeMeta();
  syncThemeMedia();

  if (persist) {
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
      hasThemeOverride = true;
    } catch (error) {
      hasThemeOverride = true;
    }
  }

  if (track) {
    trackEvent("theme_toggled", { theme });
  }
};

const storedTheme = getStoredTheme();
if (storedTheme) {
  currentTheme = storedTheme;
  hasThemeOverride = true;
} else {
  currentTheme = getSystemTheme();
}

applyTheme(currentTheme);

const initSiteLoader = () => {
  if (!siteLoader) {
    rootElement.classList.add("is-loaded");
    return;
  }

  rootElement.classList.add("is-booting");

  const minDuration = reduceMotion ? 240 : 820;
  const maxDuration = reduceMotion ? 640 : 2100;
  const initialTime = window.performance.now();
  let hasWindowLoaded = document.readyState === "complete";
  let rafId = 0;

  const finish = () => {
    window.cancelAnimationFrame(rafId);
    rootElement.classList.add("is-loaded");
    rootElement.classList.remove("is-booting");
  };

  const markLoaded = () => {
    hasWindowLoaded = true;
  };

  window.addEventListener("load", markLoaded, { once: true });

  const tick = (time) => {
    const elapsed = time - initialTime;
    const timelineProgress = clamp(elapsed / minDuration, 0, 1);
    const displayProgress = clamp(timelineProgress * 100, 0, 100);

    if (loaderValueNode) {
      loaderValueNode.textContent = String(Math.round(displayProgress));
    }

    const shouldFinish = (hasWindowLoaded && elapsed >= minDuration) || elapsed >= maxDuration;
    if (shouldFinish) {
      if (loaderValueNode) {
        loaderValueNode.textContent = "100";
      }
      finish();
      return;
    }

    rafId = window.requestAnimationFrame(tick);
  };

  rafId = window.requestAnimationFrame(tick);
};

initSiteLoader();

if (typeof prefersDarkMedia.addEventListener === "function") {
  prefersDarkMedia.addEventListener("change", (event) => {
    if (hasThemeOverride) {
      return;
    }

    applyTheme(event.matches ? "dark" : "light");
  });
}

if (themeToggle) {
  themeToggle.addEventListener("click", () => {
    const nextTheme = currentTheme === "dark" ? "light" : "dark";
    applyTheme(nextTheme, { persist: true, track: true });
  });
}

const setMenuOpenState = (isOpen) => {
  if (!menuToggle || !siteNav) {
    return;
  }

  const shouldOpen = mobileNavMedia.matches && Boolean(isOpen);
  menuToggle.setAttribute("aria-expanded", String(shouldOpen));
  siteNav.classList.toggle("open", shouldOpen);
  document.body.classList.toggle("nav-open", shouldOpen);
};

if (menuToggle && siteNav) {
  setMenuOpenState(false);

  menuToggle.addEventListener("click", () => {
    const shouldOpen = menuToggle.getAttribute("aria-expanded") !== "true";
    setMenuOpenState(shouldOpen);
    trackEvent("mobile_menu_toggle", { expanded: shouldOpen });
  });

  siteNav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      if (mobileNavMedia.matches) {
        setMenuOpenState(false);
      }
    });
  });

  document.addEventListener("click", (event) => {
    if (!mobileNavMedia.matches) {
      return;
    }

    if (!(event.target instanceof Node)) {
      return;
    }

    if (siteNav.contains(event.target) || menuToggle.contains(event.target)) {
      return;
    }

    setMenuOpenState(false);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      setMenuOpenState(false);
    }
  });

  const closeMenuOnDesktop = (event) => {
    if (!event.matches) {
      setMenuOpenState(false);
    }
  };

  if (typeof mobileNavMedia.addEventListener === "function") {
    mobileNavMedia.addEventListener("change", closeMenuOnDesktop);
  } else if (typeof mobileNavMedia.addListener === "function") {
    mobileNavMedia.addListener(closeMenuOnDesktop);
  }
}

const setCurrentNavLink = (activeId) => {
  if (!navSectionLinks.length) {
    return;
  }

  navSectionLinks.forEach((link) => {
    const href = link.getAttribute("href") || "";
    const isCurrent = href === `#${activeId}`;
    link.classList.toggle("is-current", isCurrent);

    if (isCurrent) {
      link.setAttribute("aria-current", "page");
    } else {
      link.removeAttribute("aria-current");
    }
  });
};

if (navSectionLinks.length && "IntersectionObserver" in window) {
  const linkedSections = navSectionLinks
    .map((link) => {
      const href = link.getAttribute("href");
      if (!href) {
        return null;
      }

      const section = document.querySelector(href);
      if (!section) {
        return null;
      }

      return { id: section.id, section };
    })
    .filter(Boolean);

  if (linkedSections.length) {
    const visibility = new Map(linkedSections.map((item) => [item.id, 0]));
    const updateActiveSection = () => {
      const next = Array.from(visibility.entries()).sort((a, b) => b[1] - a[1])[0];
      if (next && next[1] > 0) {
        setCurrentNavLink(next[0]);
      }
    };

    const navObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          visibility.set(entry.target.id, entry.isIntersecting ? entry.intersectionRatio : 0);
        });
        updateActiveSection();
      },
      {
        threshold: [0.1, 0.25, 0.45, 0.7],
        rootMargin: "-20% 0px -48% 0px",
      }
    );

    linkedSections.forEach((item) => navObserver.observe(item.section));

    const hashId = window.location.hash.slice(1);
    if (hashId) {
      setCurrentNavLink(hashId);
    }
  }
}

const pointerState = {
  targetX: window.innerWidth * 0.5,
  targetY: window.innerHeight * 0.16,
  currentX: window.innerWidth * 0.5,
  currentY: window.innerHeight * 0.16,
  rafId: 0,
};

const renderPointerState = () => {
  const smoothing = 0.18;
  pointerState.currentX = lerp(pointerState.currentX, pointerState.targetX, smoothing);
  pointerState.currentY = lerp(pointerState.currentY, pointerState.targetY, smoothing);

  const xPercent = (pointerState.currentX / window.innerWidth) * 100;
  const yPercent = (pointerState.currentY / window.innerHeight) * 100;
  rootElement.style.setProperty("--pointer-x", `${clamp(xPercent, 0, 100).toFixed(2)}%`);
  rootElement.style.setProperty("--pointer-y", `${clamp(yPercent, 0, 100).toFixed(2)}%`);

  const delta = Math.abs(pointerState.currentX - pointerState.targetX) + Math.abs(pointerState.currentY - pointerState.targetY);
  if (delta > 0.25) {
    pointerState.rafId = window.requestAnimationFrame(renderPointerState);
  } else {
    pointerState.rafId = 0;
  }
};

const queuePointerRender = () => {
  if (pointerState.rafId) {
    return;
  }
  pointerState.rafId = window.requestAnimationFrame(renderPointerState);
};

if (!reduceMotion && finePointerMedia.matches) {
  window.addEventListener(
    "pointermove",
    (event) => {
      pointerState.targetX = event.clientX;
      pointerState.targetY = event.clientY;
      queuePointerRender();
    },
    { passive: true }
  );

  window.addEventListener("resize", () => {
    pointerState.targetX = window.innerWidth * 0.5;
    pointerState.targetY = window.innerHeight * 0.16;
    queuePointerRender();
  });

  queuePointerRender();
}

const updateScrollSignals = () => {
  const scrollable = document.documentElement.scrollHeight - window.innerHeight;
  const progress = scrollable > 0 ? (window.scrollY / scrollable) * 100 : 0;

  if (scrollProgressBar) {
    scrollProgressBar.style.width = `${clamp(progress, 0, 100)}%`;
  }

  if (siteHeader) {
    siteHeader.classList.toggle("is-scrolled", window.scrollY > 24);
  }

  if (heroSection && !reduceMotion) {
    const heroRect = heroSection.getBoundingClientRect();
    const heroProgress = clamp((window.innerHeight - heroRect.top) / (window.innerHeight + heroRect.height), 0, 1);
    rootElement.style.setProperty("--hero-progress", heroProgress.toFixed(4));
  }
};

let scrollSignalRaf = 0;
const queueScrollSignals = () => {
  if (scrollSignalRaf) {
    return;
  }

  scrollSignalRaf = window.requestAnimationFrame(() => {
    scrollSignalRaf = 0;
    updateScrollSignals();
  });
};

window.addEventListener("scroll", queueScrollSignals, { passive: true });
window.addEventListener("resize", queueScrollSignals);
queueScrollSignals();

const revealItems = Array.from(document.querySelectorAll(".reveal"));
if (revealItems.length) {
  revealItems.forEach((item, index) => {
    const delay = Math.min(index * 55, 320);
    item.style.setProperty("--reveal-delay", `${delay}ms`);
  });

  if (!reduceMotion && "IntersectionObserver" in window) {
    revealItems.forEach((item) => item.classList.add("is-pending"));

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.14 }
    );

    window.requestAnimationFrame(() => {
      revealItems.forEach((item) => observer.observe(item));
    });
  } else {
    revealItems.forEach((item) => item.classList.add("is-visible"));
  }
}

const countUpItems = Array.from(document.querySelectorAll("[data-countup]"));

const formatCountValue = (value, dataset) => {
  const prefix = dataset.prefix || "";
  const suffix = dataset.suffix || "";
  const decimalsRaw = Number(dataset.decimals || 0);
  const decimals = Number.isFinite(decimalsRaw) ? Math.max(0, decimalsRaw) : 0;
  const formattedNumber = Number(value).toFixed(decimals).replace(/\.0+$/, "");
  return `${prefix}${formattedNumber}${suffix}`;
};

const runCountUp = (element) => {
  if (element.dataset.counted === "1") {
    return;
  }

  const target = Number(element.dataset.target);
  if (!Number.isFinite(target)) {
    return;
  }

  const duration = Math.min(1650, Math.max(820, target * 44));
  element.dataset.counted = "1";

  if (reduceMotion) {
    element.textContent = formatCountValue(target, element.dataset);
    return;
  }

  const start = window.performance.now();

  const tick = (time) => {
    const elapsed = time - start;
    const progress = Math.min(1, elapsed / duration);
    const eased = 1 - (1 - progress) ** 3;
    const value = target * eased;
    element.textContent = formatCountValue(value, element.dataset);

    if (progress < 1) {
      window.requestAnimationFrame(tick);
    } else {
      element.textContent = formatCountValue(target, element.dataset);
    }
  };

  window.requestAnimationFrame(tick);
};

if (countUpItems.length) {
  if (!reduceMotion && "IntersectionObserver" in window) {
    const countObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return;
          }

          runCountUp(entry.target);
          countObserver.unobserve(entry.target);
        });
      },
      { threshold: 0.4 }
    );

    countUpItems.forEach((item) => {
      item.textContent = formatCountValue(0, item.dataset);
      countObserver.observe(item);
    });
  } else {
    countUpItems.forEach((item) => runCountUp(item));
  }
}

const year = document.querySelector("#year");
if (year) {
  year.textContent = String(new Date().getFullYear());
}

const tabList = document.querySelector('[role="tablist"]');
const tabs = Array.from(document.querySelectorAll(".surface-tab"));
const surfaceSource = document.querySelector("#surface-source");
const surfaceImage = document.querySelector("#surface-image");
const surfaceLabel = document.querySelector("#surface-label");
const surfaceTitle = document.querySelector("#surface-title");
const surfaceDescription = document.querySelector("#surface-description");
const surfaceMetric = document.querySelector("#surface-metric");
const surfaceHDLink = document.querySelector("#surface-hd-link");
const surfaceOutcomes = document.querySelector("#surface-outcomes");
const surfacePanel = document.querySelector("#surface-panel");
const surfaceWhen = document.querySelector("#surface-when");
const surfaceAction = document.querySelector("#surface-action");
const surfaceStage = document.querySelector(".surface-stage");

const renderOutcomes = (outcomesRaw) => {
  if (!surfaceOutcomes) {
    return;
  }

  const outcomes = String(outcomesRaw || "")
    .split("||")
    .map((item) => item.trim())
    .filter(Boolean);

  surfaceOutcomes.innerHTML = "";

  outcomes.forEach((outcome) => {
    const li = document.createElement("li");
    li.textContent = outcome;
    surfaceOutcomes.appendChild(li);
  });
};

if (
  tabs.length &&
  surfaceSource &&
  surfaceImage &&
  surfaceLabel &&
  surfaceTitle &&
  surfaceDescription &&
  surfaceMetric &&
  surfaceHDLink &&
  surfaceWhen &&
  surfaceAction
) {
  let surfaceSwapTimeoutId = 0;

  setSurface = (tabButton, source = "click", options = {}) => {
    const { track = true } = options;

    tabs.forEach((tab) => {
      const isActive = tab === tabButton;
      tab.classList.toggle("is-active", isActive);
      tab.setAttribute("aria-selected", String(isActive));
      tab.setAttribute("tabindex", isActive ? "0" : "-1");
    });

    if (surfaceStage && source !== "initial" && source !== "theme") {
      surfaceStage.classList.add("is-swapping");
      window.clearTimeout(surfaceSwapTimeoutId);
      surfaceSwapTimeoutId = window.setTimeout(() => {
        surfaceStage.classList.remove("is-swapping");
      }, 200);
    }

    const screen = tabButton.dataset.screen || "today";
    const title = tabButton.dataset.title || "";
    const description = tabButton.dataset.description || "";
    const metric = tabButton.dataset.metric || "";
    const when = tabButton.dataset.when || "";
    const action = tabButton.dataset.action || "";
    const web = resolveAssetPath(tabButton.dataset, currentTheme, "web") || tabButton.dataset.web || "";
    const hd = resolveAssetPath(tabButton.dataset, currentTheme, "hd") || tabButton.dataset.hd || web;
    const alt = tabButton.dataset.alt || "";
    const outcomes = tabButton.dataset.outcomes || "";

    if (web && hd) {
      surfaceSource.srcset = `${web} 900w, ${hd} 1170w`;
    }

    if (web) {
      surfaceImage.src = web;
    }

    surfaceImage.alt = alt;
    surfaceLabel.textContent = `Screen: ${screen.charAt(0).toUpperCase()}${screen.slice(1)}`;
    surfaceTitle.textContent = title;
    surfaceDescription.textContent = description;
    surfaceMetric.textContent = metric;
    surfaceWhen.textContent = when;
    surfaceAction.textContent = action;
    if (hd) {
      surfaceHDLink.href = hd;
    }
    renderOutcomes(outcomes);

    if (surfacePanel && tabButton.id) {
      surfacePanel.setAttribute("aria-labelledby", tabButton.id);
    }

    if (track) {
      trackEvent("surface_changed", { screen, interaction_source: source });
    }
  };

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => setSurface(tab, "click"));
  });

  if (tabList) {
    tabList.addEventListener("keydown", (event) => {
      const key = event.key;
      const isArrow = key === "ArrowUp" || key === "ArrowDown";
      const isHome = key === "Home";
      const isEnd = key === "End";

      if (!isArrow && !isHome && !isEnd) {
        return;
      }

      const activeIndex = tabs.findIndex((tab) => tab.classList.contains("is-active"));
      if (activeIndex < 0) {
        return;
      }

      event.preventDefault();

      let nextIndex = activeIndex;
      if (isHome) {
        nextIndex = 0;
      } else if (isEnd) {
        nextIndex = tabs.length - 1;
      } else {
        const delta = key === "ArrowDown" ? 1 : -1;
        nextIndex = (activeIndex + delta + tabs.length) % tabs.length;
      }

      const nextTab = tabs[nextIndex];
      setSurface(nextTab, "keyboard");
      nextTab.focus();
    });
  }

  const initialTab = tabs.find((tab) => tab.classList.contains("is-active")) || tabs[0];
  if (initialTab) {
    setSurface(initialTab, "initial", { track: false });
  }
}

const audienceSelect = document.querySelector('select[name="audience"]');
const audienceLinks = document.querySelectorAll("[data-audience-target]");

audienceLinks.forEach((link) => {
  link.addEventListener("click", () => {
    const target = link.getAttribute("data-audience-target");
    if (!target || !audienceSelect) {
      return;
    }

    audienceSelect.value = target;
    trackEvent("audience_path_selected", { audience: target });

    if (link.getAttribute("href") === "#contact") {
      window.setTimeout(() => {
        audienceSelect.focus();
      }, 240);
    }
  });
});

const params = new URLSearchParams(window.location.search);
const prefillAudience = params.get("audience");
if (prefillAudience && audienceSelect) {
  const allowed = ["User", "Client", "Investor"];
  if (allowed.includes(prefillAudience)) {
    audienceSelect.value = prefillAudience;
  }
}

const contactForm = document.querySelector("[data-contact-form]");
const formNote = document.querySelector("[data-form-note]");
const submitButton = contactForm ? contactForm.querySelector("[data-submit-button]") : null;
const submitLabel = submitButton ? submitButton.querySelector("[data-submit-label]") : null;
const messageField = contactForm ? contactForm.querySelector('textarea[name="message"]') : null;
const charCount = contactForm ? contactForm.querySelector("[data-char-count]") : null;
const honeypotField = contactForm ? contactForm.querySelector("[data-honeypot]") : null;
const allowedAudiences = ["User", "Client", "Investor"];
const personalEmailDomains = new Set([
  "gmail.com",
  "yahoo.com",
  "hotmail.com",
  "outlook.com",
  "icloud.com",
  "aol.com",
  "proton.me",
  "protonmail.com",
  "pm.me",
]);

let isContactSubmitting = false;

const setFormNote = (message, state = "neutral") => {
  if (!formNote) {
    return;
  }

  formNote.textContent = message;
  formNote.classList.remove("is-error", "is-success");

  if (state === "error") {
    formNote.classList.add("is-error");
  }

  if (state === "success") {
    formNote.classList.add("is-success");
  }
};

const setFieldValidityState = (field, isInvalid) => {
  if (!field || field.name === "website") {
    return;
  }

  field.setAttribute("aria-invalid", isInvalid ? "true" : "false");
};

const updateCharCount = () => {
  if (!charCount || !messageField) {
    return;
  }

  const maxLength = Number(messageField.getAttribute("maxlength")) || 0;
  const length = messageField.value.length;

  charCount.textContent = maxLength ? `${length} / ${maxLength}` : String(length);
  charCount.classList.toggle("is-near-limit", maxLength > 0 && length >= Math.floor(maxLength * 0.85));
  charCount.classList.toggle("is-at-limit", maxLength > 0 && length >= maxLength);
};

const resetFieldValidityState = () => {
  if (!contactForm) {
    return;
  }

  contactForm.querySelectorAll("input, select, textarea").forEach((field) => {
    if (field.name !== "website") {
      field.removeAttribute("aria-invalid");
    }
  });
};

const setContactSubmittingState = (isSubmitting) => {
  if (!contactForm) {
    return;
  }

  isContactSubmitting = isSubmitting;
  contactForm.classList.toggle("is-submitting", isSubmitting);
  contactForm
    .querySelectorAll("input, select, textarea, button")
    .forEach((control) => control.toggleAttribute("disabled", isSubmitting));

  if (submitButton) {
    submitButton.classList.toggle("is-loading", isSubmitting);
  }

  if (submitLabel) {
    submitLabel.textContent = isSubmitting ? "Sending..." : "Send Message";
  }
};

const getEmailDomain = (email) => {
  const normalized = String(email || "").trim().toLowerCase();
  const atIndex = normalized.lastIndexOf("@");
  if (atIndex < 0) {
    return "";
  }
  return normalized.slice(atIndex + 1);
};

const requiresWorkEmail = (audience) => audience === "Client" || audience === "Investor";

const isDisallowedPersonalEmail = (email, audience) =>
  requiresWorkEmail(audience) && personalEmailDomains.has(getEmailDomain(email));

const getUTM = () => {
  const keys = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"];
  const urlParams = new URLSearchParams(window.location.search);
  const result = {};

  keys.forEach((key) => {
    const value = urlParams.get(key);
    if (value) {
      result[key] = value;
    }
  });

  return result;
};

const resolveEndpoint = (form, audience) => {
  if (audience === "Investor") {
    return form.dataset.investorEndpoint || form.dataset.endpoint || "/api/contact";
  }

  if (audience === "Client") {
    return form.dataset.clientEndpoint || form.dataset.endpoint || "/api/contact";
  }

  return form.dataset.endpoint || "/api/contact";
};

const isLocalPreview = () => {
  const host = window.location.hostname;
  return host === "127.0.0.1" || host === "localhost" || host.endsWith(".local");
};

const isPreviewMockMode = () => {
  if (!isLocalPreview()) {
    return false;
  }

  return params.get("liveContact") !== "1";
};

const sendContact = async (endpoint, payload) => {
  if (isPreviewMockMode()) {
    await new Promise((resolve) => window.setTimeout(resolve, 420));
    return { mocked: true };
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Contact request failed: ${response.status}`);
  }

  return { mocked: false };
};

if (contactForm) {
  const fields = Array.from(contactForm.querySelectorAll("input, select, textarea")).filter(
    (field) => field.name && field.name !== "website"
  );
  const emailField = contactForm.querySelector('input[name="email"]');
  const audienceField = contactForm.querySelector('select[name="audience"]');

  fields.forEach((field) => {
    const updateFromValidity = () => {
      setFieldValidityState(field, !field.checkValidity());
    };

    field.addEventListener("blur", updateFromValidity);
    field.addEventListener("change", updateFromValidity);
    field.addEventListener("input", () => {
      if (field.getAttribute("aria-invalid") === "true") {
        updateFromValidity();
      }
    });
  });

  const syncEmailAudienceRule = () => {
    if (!emailField || !audienceField) {
      return;
    }

    if (isDisallowedPersonalEmail(emailField.value, audienceField.value)) {
      setFieldValidityState(emailField, true);
    } else if (emailField.checkValidity()) {
      setFieldValidityState(emailField, false);
    }
  };

  if (emailField) {
    emailField.addEventListener("input", syncEmailAudienceRule);
    emailField.addEventListener("change", syncEmailAudienceRule);
  }

  if (audienceField) {
    audienceField.addEventListener("change", syncEmailAudienceRule);
  }

  if (messageField) {
    updateCharCount();
    messageField.addEventListener("input", updateCharCount);
  }

  contactForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (isContactSubmitting) {
      return;
    }

    if (honeypotField && String(honeypotField.value || "").trim()) {
      setFormNote("Thanks. Your message was received.", "success");
      trackEvent("contact_submit_blocked", { reason: "honeypot" });
      contactForm.reset();
      resetFieldValidityState();
      updateCharCount();
      return;
    }

    if (!contactForm.checkValidity()) {
      fields.forEach((field) => setFieldValidityState(field, !field.checkValidity()));

      const firstInvalidField = fields.find((field) => !field.checkValidity());
      if (firstInvalidField) {
        firstInvalidField.focus();
      }

      contactForm.reportValidity();
      setFormNote("Please complete all required fields and fix highlighted entries.", "error");
      trackEvent("contact_validation_failed", { reason: "native_constraints" });
      return;
    }

    fields.forEach((field) => setFieldValidityState(field, false));

    const formData = new FormData(contactForm);

    const name = String(formData.get("name") || "").trim();
    const email = String(formData.get("email") || "").trim();
    const organization = String(formData.get("organization") || "").trim();
    const audience = String(formData.get("audience") || "").trim();
    const message = String(formData.get("message") || "").trim();
    const consent = String(formData.get("consent") || "").trim();

    const emailFieldInput = contactForm.querySelector('input[name="email"]');
    const messageInput = contactForm.querySelector('textarea[name="message"]');
    const audienceInput = contactForm.querySelector('select[name="audience"]');

    if (!allowedAudiences.includes(audience)) {
      setFieldValidityState(audienceInput, true);
      setFormNote("Please select a valid audience path before submitting.", "error");
      if (audienceInput) {
        audienceInput.focus();
      }
      trackEvent("contact_validation_failed", { reason: "invalid_audience" });
      return;
    }

    if (isDisallowedPersonalEmail(email, audience)) {
      setFieldValidityState(emailFieldInput, true);
      setFormNote("Please use a work email for partnership or investor inquiries.", "error");
      if (emailFieldInput) {
        emailFieldInput.focus();
      }
      trackEvent("contact_validation_failed", { reason: "work_email_required", audience });
      return;
    }

    if (message.length < 20) {
      setFieldValidityState(messageInput, true);
      setFormNote("Please add a bit more detail so we can route your request correctly.", "error");
      if (messageInput) {
        messageInput.focus();
      }
      trackEvent("contact_validation_failed", { reason: "message_too_short", audience });
      return;
    }

    if (!consent) {
      const consentField = contactForm.querySelector('input[name="consent"]');
      setFieldValidityState(consentField, true);
      setFormNote("Please confirm contact consent before sending.", "error");
      if (consentField) {
        consentField.focus();
      }
      trackEvent("contact_validation_failed", { reason: "missing_consent", audience });
      return;
    }

    const endpoint = resolveEndpoint(contactForm, audience);
    const payload = {
      name,
      email,
      organization,
      audience,
      message,
      consent,
      source: "website",
      page_url: window.location.href,
      page_path: window.location.pathname,
      referrer: document.referrer || null,
      submitted_at: new Date().toISOString(),
      crm_tags: [`audience:${audience.toLowerCase()}`, "source:website"],
      utm: getUTM(),
    };

    try {
      setContactSubmittingState(true);
      setFormNote("Sending your message...", "neutral");
      trackEvent("contact_submit_started", { audience });

      const result = await sendContact(endpoint, payload);

      if (result?.mocked) {
        setFormNote("Preview mode: message validated locally and not sent to a backend.", "success");
      } else {
        setFormNote("Thanks. Your message was routed to the appropriate team.", "success");
      }
      contactForm.reset();
      resetFieldValidityState();
      updateCharCount();
      trackEvent("contact_submit_succeeded", { audience, mocked: Boolean(result?.mocked) });
    } catch (error) {
      console.error(error);
      setFormNote("Could not submit right now. Please try again or email hello@mindsense.ai.", "error");
      trackEvent("contact_submit_failed", { audience, endpoint });
    } finally {
      setContactSubmittingState(false);
    }
  });
}

document.querySelectorAll("[data-track]").forEach((element) => {
  if (element.getAttribute("role") === "tab") {
    return;
  }

  const eventName = element.getAttribute("data-track");
  element.addEventListener("click", () => {
    trackEvent(eventName, {
      label: element.textContent ? element.textContent.trim() : "",
      href: element.getAttribute("href") || null,
    });
  });
});

const magneticTargets = Array.from(
  document.querySelectorAll(".btn, .jump-strip a, .path-link, .site-nav a:not(.nav-cta), .surface-tab")
);

const attachMagneticMotion = (element, intensity) => {
  let targetX = 0;
  let targetY = 0;
  let currentX = 0;
  let currentY = 0;
  let rafId = 0;

  const render = () => {
    currentX = lerp(currentX, targetX, 0.22);
    currentY = lerp(currentY, targetY, 0.22);
    element.style.setProperty("--magnetic-x", `${currentX.toFixed(2)}px`);
    element.style.setProperty("--magnetic-y", `${currentY.toFixed(2)}px`);

    const delta = Math.abs(currentX - targetX) + Math.abs(currentY - targetY);
    if (delta > 0.08) {
      rafId = window.requestAnimationFrame(render);
    } else {
      rafId = 0;
    }
  };

  const queueRender = () => {
    if (rafId) {
      return;
    }
    rafId = window.requestAnimationFrame(render);
  };

  element.addEventListener("pointermove", (event) => {
    const rect = element.getBoundingClientRect();
    const nx = (event.clientX - rect.left) / rect.width - 0.5;
    const ny = (event.clientY - rect.top) / rect.height - 0.5;
    targetX = nx * intensity;
    targetY = ny * intensity;
    queueRender();
  });

  element.addEventListener("pointerleave", () => {
    targetX = 0;
    targetY = 0;
    queueRender();
  });
};

const floatCards = Array.from(document.querySelectorAll("[data-float-card]"));

const attachFloatCardMotion = (card) => {
  let targetTiltX = 0;
  let targetTiltY = 0;
  let currentTiltX = 0;
  let currentTiltY = 0;
  let rafId = 0;

  const render = () => {
    currentTiltX = lerp(currentTiltX, targetTiltX, 0.2);
    currentTiltY = lerp(currentTiltY, targetTiltY, 0.2);
    card.style.setProperty("--float-tilt-x", `${currentTiltX.toFixed(2)}deg`);
    card.style.setProperty("--float-tilt-y", `${currentTiltY.toFixed(2)}deg`);

    const delta = Math.abs(currentTiltX - targetTiltX) + Math.abs(currentTiltY - targetTiltY);
    if (delta > 0.05) {
      rafId = window.requestAnimationFrame(render);
    } else {
      rafId = 0;
    }
  };

  const queueRender = () => {
    if (rafId) {
      return;
    }
    rafId = window.requestAnimationFrame(render);
  };

  card.addEventListener("pointermove", (event) => {
    const rect = card.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    targetTiltX = (x - 0.5) * 5;
    targetTiltY = (0.5 - y) * 5;
    queueRender();
  });

  card.addEventListener("pointerleave", () => {
    targetTiltX = 0;
    targetTiltY = 0;
    queueRender();
  });
};

if (!reduceMotion && finePointerMedia.matches) {
  rootElement.dataset.canFloat = "true";

  magneticTargets.forEach((element) => {
    const strength = element.classList.contains("btn") ? 10 : element.classList.contains("surface-tab") ? 6 : 7;
    attachMagneticMotion(element, strength);
  });

  floatCards.forEach((card) => {
    attachFloatCardMotion(card);
  });
}

const tiltRoot = document.querySelector("[data-tilt-root]");
const heroTiltMedia = window.matchMedia("(min-width: 1081px)");

if (tiltRoot && !reduceMotion && finePointerMedia.matches && heroTiltMedia.matches) {
  tiltRoot.addEventListener("pointermove", (event) => {
    const rect = tiltRoot.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    const rotate = (x - 0.5) * 7;

    tiltRoot.classList.add("is-tilting");
    tiltRoot.style.setProperty("--tilt-x", `${rotate}deg`);
    tiltRoot.style.setProperty("--tilt-y", `${(0.5 - y) * 4}deg`);
  });

  tiltRoot.addEventListener("pointerleave", () => {
    tiltRoot.classList.remove("is-tilting");
    tiltRoot.style.removeProperty("--tilt-x");
    tiltRoot.style.removeProperty("--tilt-y");
  });
}
