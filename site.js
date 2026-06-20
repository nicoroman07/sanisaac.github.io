const toggle = document.querySelector(".menu-toggle");
const nav = document.querySelector(".main-nav");

if (toggle && nav) {
  const setMenuState = (isOpen) => {
    nav.classList.toggle("is-open", isOpen);
    toggle.setAttribute("aria-expanded", String(isOpen));
    toggle.setAttribute("aria-label", isOpen ? "Cerrar menú" : "Abrir menú");
  };

  toggle.addEventListener("click", () => {
    setMenuState(!nav.classList.contains("is-open"));
  });

  nav.addEventListener("click", (event) => {
    if (event.target.closest("a")) setMenuState(false);
  });

  document.addEventListener("click", (event) => {
    if (!nav.contains(event.target) && !toggle.contains(event.target)) {
      setMenuState(false);
    }
  });
}

const dialogTriggers = new WeakMap();
let activeDialog = null;

const getFocusableElements = (container) =>
  [...container.querySelectorAll(
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
  )].filter((element) => !element.hidden && element.getClientRects().length);

const setBackgroundInert = (dialog, inert) => {
  [...document.body.children].forEach((element) => {
    if (element !== dialog) element.inert = inert;
  });
};

const openDialog = (dialog, trigger) => {
  if (!dialog) return;

  dialogTriggers.set(dialog, trigger);
  dialog.hidden = false;
  activeDialog = dialog;
  setBackgroundInert(dialog, true);
  document.body.classList.add("modal-open");

  requestAnimationFrame(() => {
    (getFocusableElements(dialog)[0] || dialog).focus();
  });
};

const closeDialog = (dialog) => {
  if (!dialog) return;

  dialog.hidden = true;
  setBackgroundInert(dialog, false);
  document.body.classList.remove("modal-open");
  activeDialog = null;

  const trigger = dialogTriggers.get(dialog);
  if (trigger?.isConnected) trigger.focus();
};

document.querySelectorAll("[data-open-modal]").forEach((button) => {
  button.addEventListener("click", () => {
    openDialog(document.getElementById(button.dataset.openModal), button);
  });
});

document.querySelectorAll(".modal-backdrop").forEach((modal) => {
  modal.addEventListener("click", (event) => {
    if (event.target === modal || event.target.closest("[data-close-modal]")) {
      closeDialog(modal);
    }
  });
});

const lightbox = document.getElementById("event-lightbox");

if (lightbox) {
  const lightboxImage = lightbox.querySelector("img");

  document.querySelectorAll("[data-lightbox]").forEach((button) => {
    button.addEventListener("click", () => {
      const thumbnail = button.querySelector("img");

      if (lightboxImage) {
        lightboxImage.src = button.dataset.lightbox;
        lightboxImage.alt = thumbnail?.alt || "Imagen ampliada del evento";
      }

      openDialog(lightbox, button);
    });
  });

  lightbox.addEventListener("click", (event) => {
    if (event.target === lightbox || event.target.closest("[data-lightbox-close]")) {
      closeDialog(lightbox);
    }
  });
}

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    if (activeDialog) {
      closeDialog(activeDialog);
    } else if (nav?.classList.contains("is-open")) {
      nav.classList.remove("is-open");
      toggle?.setAttribute("aria-expanded", "false");
      toggle?.setAttribute("aria-label", "Abrir menú");
      toggle?.focus();
    }
  }

  if (event.key === "Tab" && activeDialog) {
    const focusable = getFocusableElements(activeDialog);

    if (!focusable.length) {
      event.preventDefault();
      activeDialog.focus();
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }
});

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const revealElements = document.querySelectorAll(
  ".section > *, .quick-panel > *, .institutional-stats > *, .card, .directory article, .timeline article, .gallery-grid figure"
);

revealElements.forEach((element, index) => {
  element.classList.add("reveal");
  element.style.setProperty("--reveal-delay", `${Math.min(index % 6, 5) * 70}ms`);
});

if (reducedMotion || !("IntersectionObserver" in window)) {
  revealElements.forEach((element) => element.classList.add("is-visible"));
} else {
  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.05, rootMargin: "0px 0px -20px" }
  );

  revealElements.forEach((element) => revealObserver.observe(element));

  let revealFrame = null;
  const revealPassedElements = () => {
    if (revealFrame) return;

    revealFrame = requestAnimationFrame(() => {
      revealElements.forEach((element) => {
        if (!element.classList.contains("is-visible") && element.getBoundingClientRect().top < window.innerHeight) {
          element.classList.add("is-visible");
          revealObserver.unobserve(element);
        }
      });
      revealFrame = null;
    });
  };

  window.addEventListener("scroll", revealPassedElements, { passive: true });
  window.addEventListener("resize", revealPassedElements);
  revealPassedElements();
}

const counters = document.querySelectorAll("[data-counter]");

const runCounter = (counter) => {
  const target = Number(counter.dataset.counter);
  const suffix = counter.dataset.suffix || "";

  if (reducedMotion) {
    counter.textContent = `${target}${suffix}`;
    return;
  }

  const duration = 1300;
  const startTime = performance.now();

  const update = (currentTime) => {
    const progress = Math.min((currentTime - startTime) / duration, 1);
    const easedProgress = 1 - Math.pow(1 - progress, 3);
    counter.textContent = `${Math.round(target * easedProgress)}${suffix}`;

    if (progress < 1) requestAnimationFrame(update);
  };

  requestAnimationFrame(update);
};

if (counters.length) {
  if (reducedMotion || !("IntersectionObserver" in window)) {
    counters.forEach(runCounter);
  } else {
    const counterObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            runCounter(entry.target);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.65 }
    );

    counters.forEach((counter) => counterObserver.observe(counter));
  }
}
