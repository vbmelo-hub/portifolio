const appScript = document.querySelector('script[src$="js/app.js"]');
const appScriptUrl = appScript
  ? new URL(appScript.src, document.baseURI)
  : new URL("js/app.js", document.baseURI);
const switchHomeUrl = new URL("../html/switch-home.html", appScriptUrl).href;
const switchSoundUrl = new URL("../sons/switch-sound.mp3", appScriptUrl).href;
const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
const coarsePointerQuery = window.matchMedia("(hover: none), (pointer: coarse)");

const motionDuration = (milliseconds) => (reducedMotionQuery.matches ? 0 : milliseconds);

function markPageReady() {
  requestAnimationFrame(() => {
    requestAnimationFrame(() => document.body.classList.add("ux-ready"));
  });
}

markPageReady();

/* ======================================================
   TOASTS / FEEDBACK
   ====================================================== */
let toastRegion;
let toastTimer;

function getToastRegion() {
  if (toastRegion) return toastRegion;

  toastRegion = document.createElement("div");
  toastRegion.className = "toast-region";
  toastRegion.setAttribute("aria-live", "polite");
  toastRegion.setAttribute("aria-atomic", "true");
  document.body.appendChild(toastRegion);
  return toastRegion;
}

function showToast(message, type = "success") {
  const region = getToastRegion();
  clearTimeout(toastTimer);

  region.replaceChildren();
  const toast = document.createElement("div");
  toast.className = `toast toast--${type}`;
  toast.setAttribute("role", type === "error" ? "alert" : "status");

  const icon = document.createElement("span");
  icon.className = "toast__icon";
  icon.setAttribute("aria-hidden", "true");
  icon.textContent = type === "error" ? "!" : type === "info" ? "i" : "✓";

  const text = document.createElement("span");
  text.textContent = message;

  toast.append(icon, text);
  region.appendChild(toast);

  requestAnimationFrame(() => toast.classList.add("is-visible"));

  toastTimer = window.setTimeout(() => {
    toast.classList.remove("is-visible");
    window.setTimeout(() => toast.remove(), motionDuration(220));
  }, reducedMotionQuery.matches ? 1400 : 2400);
}

async function copyToClipboard(text, successMessage) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
    } else {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      textarea.style.pointerEvents = "none";
      document.body.appendChild(textarea);
      textarea.select();

      const copied = document.execCommand("copy");
      textarea.remove();
      if (!copied) throw new Error("O navegador não permitiu copiar o conteúdo.");
    }

    showToast(successMessage, "success");
  } catch (error) {
    console.error("Erro ao copiar o texto:", error);
    showToast("Não foi possível copiar. Tente novamente.", "error");
  }
}

// Mantidas como funções globais para preservar compatibilidade com chamadas antigas.
function copiarTexto() {
  return copyToClipboard("miyainc", "Discord copiado!");
}

function copiarEmail() {
  return copyToClipboard("vinicius.meloin@gmail.com", "E-mail copiado!");
}

window.copiarTexto = copiarTexto;
window.copiarEmail = copiarEmail;

document.querySelectorAll("[data-copy-discord]").forEach((button) => {
  button.addEventListener("click", copiarTexto);
});

document.querySelectorAll("[data-copy-email]").forEach((button) => {
  button.addEventListener("click", copiarEmail);
});

/* ======================================================
   SOM DO SWITCH
   ====================================================== */
let somClique;

function tocarSom() {
  if (!somClique) {
    somClique = new Audio(switchSoundUrl);
    somClique.preload = "auto";
  }

  somClique.currentTime = 0;
  const playPromise = somClique.play();
  if (playPromise) {
    playPromise.catch((error) => {
      console.debug("O navegador bloqueou a reprodução do som.", error);
    });
  }
}

window.tocarSom = tocarSom;

document.querySelectorAll("[data-switch-sound]").forEach((button) => {
  button.addEventListener("click", tocarSom);
});

/* ======================================================
   TRANSIÇÕES ENTRE PÁGINAS
   ====================================================== */
let pageTransitionInProgress = false;

function navigateWithTransition(url, delay = 180) {
  if (pageTransitionInProgress) return;
  pageTransitionInProgress = true;
  document.body.classList.add("is-leaving");

  window.setTimeout(() => {
    window.location.assign(url);
  }, motionDuration(delay));
}

function canAnimateInternalNavigation(event, link) {
  if (event.defaultPrevented || event.button !== 0) return false;
  if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return false;
  if (link.hasAttribute("download") || link.target === "_blank") return false;

  const rawHref = link.getAttribute("href");
  if (!rawHref || rawHref.startsWith("#") || rawHref.startsWith("mailto:") || rawHref.startsWith("tel:")) return false;

  const url = new URL(link.href, document.baseURI);
  if (url.origin !== window.location.origin) return false;
  if (url.href === window.location.href) return false;

  return true;
}

document.addEventListener("click", (event) => {
  const link = event.target.closest?.("a[href]");
  if (!link || !canAnimateInternalNavigation(event, link)) return;

  event.preventDefault();
  navigateWithTransition(link.href);
});

window.addEventListener("pageshow", () => {
  pageTransitionInProgress = false;
  document.body.classList.remove("is-leaving");
});

/* ======================================================
   LANDING PAGE
   ====================================================== */
if (document.body.dataset.page === "landing") {
  const continueButton = document.getElementById("continueButton");
  const continueInstruction = document.getElementById("continueInstruction");
  let isNavigating = false;

  const goToSwitchHome = () => {
    if (isNavigating) return;
    isNavigating = true;
    document.body.classList.add("landing-activated");
    tocarSom();
    navigateWithTransition(switchHomeUrl, 260);
  };

  const updateInstruction = () => {
    if (!continueInstruction) return;
    continueInstruction.textContent = coarsePointerQuery.matches
      ? "Toque para continuar..."
      : "Pressione qualquer botão do teclado para continuar...";
  };

  updateInstruction();
  coarsePointerQuery.addEventListener?.("change", updateInstruction);

  continueButton?.addEventListener("click", goToSwitchHome);

  document.addEventListener("keydown", (event) => {
    if (event.defaultPrevented || event.repeat || event.ctrlKey || event.metaKey || event.altKey) return;
    if (["Tab", "Shift", "Control", "Alt", "Meta", "CapsLock", "Escape"].includes(event.key)) return;
    if (event.target instanceof Element && event.target.closest("a, button, input, textarea, select")) return;

    goToSwitchHome();
  });
}

/* ======================================================
   SWITCH HOME
   ====================================================== */
if (document.body.dataset.page === "switch-home") {
  document.querySelectorAll("[data-console-card]").forEach((card, index) => {
    card.style.setProperty("--stagger-index", String(index));
    card.addEventListener("pointerdown", () => card.classList.add("is-pressed"));
    card.addEventListener("pointerup", () => card.classList.remove("is-pressed"));
    card.addEventListener("pointercancel", () => card.classList.remove("is-pressed"));
    card.addEventListener("pointerleave", () => card.classList.remove("is-pressed"));
    card.addEventListener("click", tocarSom);
  });

  document.querySelectorAll("#redes-icons > *").forEach((item, index) => {
    item.style.setProperty("--stagger-index", String(index));
  });
}

/* ======================================================
   NAVBAR: ESTADO ATIVO
   ====================================================== */
const currentPath = window.location.pathname.replace(/\/+$/, "");

document.querySelectorAll("#primary-navigation a[href]").forEach((link) => {
  const href = link.getAttribute("href");
  if (!href || href.startsWith("http") || href.endsWith(".pdf")) return;

  const linkPath = new URL(href, document.baseURI).pathname.replace(/\/+$/, "");
  if (linkPath === currentPath) {
    link.classList.add("active");
    link.setAttribute("aria-current", "page");
  }
});

/* ======================================================
   MENU MOBILE / DRAWER
   ====================================================== */
const navbar = document.getElementById("navbar");
const navToggle = navbar?.querySelector(".nav-toggle");
const siteNav = navbar?.querySelector(".site-nav");
let navOverlay;
let menuPreviouslyFocused;

function getFocusableMenuItems() {
  if (!siteNav) return [];
  const menuItems = [...siteNav.querySelectorAll('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])')]
    .filter((element) => !element.hasAttribute("disabled"));
  return navToggle ? [navToggle, ...menuItems] : menuItems;
}

function closeMobileMenu({ restoreFocus = false } = {}) {
  if (!navbar || !navToggle) return;

  navbar.classList.remove("nav-open");
  document.body.classList.remove("menu-open");
  navToggle.setAttribute("aria-expanded", "false");
  navToggle.setAttribute("aria-label", "Abrir menu");

  if (navOverlay) {
    navOverlay.classList.remove("is-visible");
    navOverlay.setAttribute("aria-hidden", "true");
  }

  if (restoreFocus) {
    (menuPreviouslyFocused instanceof HTMLElement ? menuPreviouslyFocused : navToggle).focus();
  }
}

function openMobileMenu() {
  if (!navbar || !navToggle || !siteNav) return;

  menuPreviouslyFocused = document.activeElement;
  navbar.classList.add("nav-open");
  document.body.classList.add("menu-open");
  navToggle.setAttribute("aria-expanded", "true");
  navToggle.setAttribute("aria-label", "Fechar menu");

  if (navOverlay) {
    navOverlay.classList.add("is-visible");
    navOverlay.setAttribute("aria-hidden", "false");
  }

  const focusTarget = siteNav.querySelector('[aria-current="page"]') || getFocusableMenuItems()[0];
  window.setTimeout(() => focusTarget?.focus(), motionDuration(170));
}

if (navbar && navToggle && siteNav) {
  navOverlay = document.createElement("button");
  navOverlay.type = "button";
  navOverlay.className = "nav-overlay";
  navOverlay.setAttribute("aria-label", "Fechar menu");
  navOverlay.setAttribute("aria-hidden", "true");
  navOverlay.tabIndex = -1;
  document.body.appendChild(navOverlay);

  navToggle.addEventListener("click", () => {
    if (navbar.classList.contains("nav-open")) {
      closeMobileMenu({ restoreFocus: true });
    } else {
      openMobileMenu();
    }
  });

  navOverlay.addEventListener("click", () => closeMobileMenu({ restoreFocus: true }));

  siteNav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => closeMobileMenu());
  });

  document.addEventListener("keydown", (event) => {
    if (!navbar.classList.contains("nav-open")) return;

    if (event.key === "Escape") {
      event.preventDefault();
      closeMobileMenu({ restoreFocus: true });
      return;
    }

    if (event.key !== "Tab") return;

    const focusable = getFocusableMenuItems();
    if (!focusable.length) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 1180 && navbar.classList.contains("nav-open")) {
      closeMobileMenu();
    }
  });
}

/* ======================================================
   SCROLL REVEAL (progressive enhancement)
   ====================================================== */
function setupRevealAnimations() {
  if (reducedMotionQuery.matches || !("IntersectionObserver" in window)) return;

  const selectors = [
    "main > h1",
    ".page-intro",
    "#sobremim > img",
    "#sobremim .paragrafos",
    "#sobremim .sobre-texto",
    ".skills-group h2",
    ".skills-grid .skill-card",
    ".project-card",
    ".projects-more",
    ".section-heading",
    ".career-card",
    ".career-compact-card",
    ".leadership-card",
    ".experiencias > a",
    ".test",
    "form[data-contact-form]",
    ".site-footer"
  ];

  const elements = [...document.querySelectorAll(selectors.join(","))];
  if (!elements.length) return;

  const groupedCounters = new Map();
  elements.forEach((element) => {
    const parent = element.parentElement;
    const currentIndex = groupedCounters.get(parent) || 0;
    groupedCounters.set(parent, currentIndex + 1);

    element.classList.add("reveal-item");
    element.style.setProperty("--reveal-delay", `${Math.min(currentIndex * 65, 195)}ms`);
  });

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-revealed");
      observer.unobserve(entry.target);
    });
  }, {
    threshold: 0.08,
    rootMargin: "0px 0px -7% 0px"
  });

  elements.forEach((element) => observer.observe(element));
}

setupRevealAnimations();

/* ======================================================
   FORMULÁRIO DE CONTATO
   ====================================================== */
const contactForm = document.querySelector("form[data-contact-form]");

if (contactForm) {
  const submitButton = contactForm.querySelector('button[type="submit"]');
  const submitLabel = contactForm.querySelector("[data-submit-label]");
  const defaultSubmitText = submitLabel?.textContent || "Enviar Mensagem";

  const restoreSubmitState = () => {
    contactForm.classList.remove("is-submitting");
    contactForm.removeAttribute("aria-busy");
    if (submitButton) submitButton.disabled = false;
    if (submitLabel) submitLabel.textContent = defaultSubmitText;
  };

  contactForm.addEventListener("submit", () => {
    if (!contactForm.checkValidity()) return;

    contactForm.classList.add("is-submitting");
    contactForm.setAttribute("aria-busy", "true");
    if (submitButton) submitButton.disabled = true;
    if (submitLabel) submitLabel.textContent = "Abrindo e-mail…";
    showToast("Abrindo seu aplicativo de e-mail…", "info");

    // mailto: depende do aplicativo do usuário e não retorna confirmação real.
    window.setTimeout(restoreSubmitState, 1800);
  });

  window.addEventListener("pageshow", restoreSubmitState);
}

/* ======================================================
   VOLTAR AO TOPO (somente em páginas realmente longas)
   ====================================================== */
function setupBackToTop() {
  if (document.body.dataset.page !== "internal") return;

  const button = document.createElement("button");
  button.type = "button";
  button.className = "back-to-top";
  button.setAttribute("aria-label", "Voltar ao topo");
  button.innerHTML = '<span aria-hidden="true">↑</span>';
  document.body.appendChild(button);

  const updateEligibility = () => {
    const pageIsLong = document.documentElement.scrollHeight > window.innerHeight * 1.45;
    button.hidden = !pageIsLong;
    if (!pageIsLong) button.classList.remove("is-visible");
  };

  const updateVisibility = () => {
    if (button.hidden) return;
    button.classList.toggle("is-visible", window.scrollY > Math.max(420, window.innerHeight * 0.65));
  };

  updateEligibility();
  updateVisibility();

  window.addEventListener("load", () => {
    updateEligibility();
    updateVisibility();
  }, { once: true });

  window.addEventListener("resize", () => {
    updateEligibility();
    updateVisibility();
  });
  window.addEventListener("scroll", updateVisibility, { passive: true });

  if ("ResizeObserver" in window) {
    const pageResizeObserver = new ResizeObserver(() => {
      updateEligibility();
      updateVisibility();
    });
    pageResizeObserver.observe(document.body);
  }

  button.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: reducedMotionQuery.matches ? "auto" : "smooth" });
  });
}

setupBackToTop();
