const SUPPORTED = ["en", "es"];
const STORAGE_KEY = "portfolio-lang";

const config = await fetch("./config.json").then((r) => {
  if (!r.ok) throw new Error("config.json missing");
  return r.json();
});

function detectLanguage() {
  const params = new URLSearchParams(window.location.search);
  const fromUrl = params.get("lang");
  if (fromUrl && SUPPORTED.includes(fromUrl)) return fromUrl;

  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored && SUPPORTED.includes(stored)) return stored;

  const browser = (navigator.language || "en").toLowerCase();
  if (browser.startsWith("es")) return "es";
  return "en";
}

async function loadLocale(lang) {
  const res = await fetch(`./i18n/${lang}.json`);
  if (!res.ok) throw new Error(`Locale ${lang} not found`);
  return res.json();
}

function interpolate(text, vars) {
  return text.replace(/\{(\w+)\}/g, (_, key) => vars[key] ?? "");
}

function escapeHtml(text) {
  const d = document.createElement("div");
  d.textContent = text;
  return d.innerHTML;
}

function mailtoLink() {
  const subject = encodeURIComponent(config.mailtoSubject || "Hello");
  return `mailto:${config.email}?subject=${subject}`;
}

let currentLang = detectLanguage();

function applyImages(lang) {
  const profileAlt =
    lang === "es"
      ? `Foto de perfil de ${config.name}`
      : `Profile photo of ${config.name}`;

  const heroBg = document.getElementById("hero-bg");
  if (heroBg && config.heroBackground) {
    heroBg.style.backgroundImage = `url("${config.heroBackground}")`;
  }

  const img = document.getElementById("profile-image");
  if (img && config.profileImage) {
    img.src = config.profileImage;
    img.alt = profileAlt;
  }

  const ogImage = document.getElementById("og-image");
  if (ogImage && config.profileImage) {
    ogImage.content = new URL(config.profileImage, window.location.href).href;
  }
}

function renderStats(stats) {
  const ids = ["stat-1", "stat-2", "stat-3", "stat-4"];
  stats.slice(0, 4).forEach((s, i) => {
    const el = document.getElementById(ids[i]);
    if (!el) return;
    el.innerHTML = `<span class="stat-num">${escapeHtml(s.num)}</span><span class="stat-label">${escapeHtml(s.label)}</span>`;
  });
}

let navScrollHandler = null;

function initNavSpy() {
  if (navScrollHandler) {
    window.removeEventListener("scroll", navScrollHandler);
  }

  const getState = () => {
    const navLinks = document.querySelectorAll("#main-nav a");
    const sections = [...navLinks]
      .map((link) => {
        const id = link.getAttribute("href")?.slice(1);
        const section = id ? document.getElementById(id) : null;
        return section ? { link, section } : null;
      })
      .filter(Boolean);
    return { navLinks, sections };
  };

  navScrollHandler = () => {
    const { navLinks, sections } = getState();
    if (!sections.length) return;
    const scrollY = window.scrollY + 140;
    let current = sections[0];
    for (const item of sections) {
      if (item.section.offsetTop <= scrollY) current = item;
    }
    navLinks.forEach((l) => l.classList.remove("is-active"));
    current.link.classList.add("is-active");
  };

  window.addEventListener("scroll", navScrollHandler, { passive: true });
  navScrollHandler();
}

async function applyLocale(lang) {
  const t = await loadLocale(lang);
  currentLang = lang;
  localStorage.setItem(STORAGE_KEY, lang);
  document.documentElement.lang = lang;

  const years = config.yearsExperience || "8";
  const vars = { years };
  const mailto = mailtoLink();

  document.title = t.meta.title;

  const docTitle = document.getElementById("doc-title");
  if (docTitle) docTitle.textContent = t.meta.title;

  const metaDesc = document.getElementById("meta-description");
  if (metaDesc) metaDesc.setAttribute("content", t.meta.description);

  const ogTitle = document.getElementById("og-title");
  if (ogTitle) ogTitle.setAttribute("content", t.meta.title);

  const ogDesc = document.getElementById("og-description");
  if (ogDesc) ogDesc.setAttribute("content", t.meta.description);

  const skip = document.getElementById("skip-link");
  if (skip && t.skipLink) skip.textContent = t.skipLink;

  document.getElementById("open-badge-text").textContent = t.openBadge;
  document.getElementById("logo-name").textContent = config.name;
  document.getElementById("footer-name").textContent = config.name;
  document.getElementById("footer-text").textContent = t.footer;
  document.getElementById("year").textContent = String(new Date().getFullYear());

  document.getElementById("lang-label").textContent = t.langSwitch.label;

  const headerHire = document.getElementById("header-hire-cta");
  if (headerHire) {
    headerHire.textContent = t.nav.hire;
    headerHire.href = mailto;
  }

  const nav = document.getElementById("main-nav");
  nav.innerHTML = `
    <a href="#work">${escapeHtml(t.nav.work)}</a>
    <a href="#why-me">${escapeHtml(t.nav.why)}</a>
    <a href="#offers">${escapeHtml(t.nav.services)}</a>
    <a href="#experience">${escapeHtml(t.nav.experience)}</a>
    <a href="#about">${escapeHtml(t.nav.about)}</a>
    <a href="#contact">${escapeHtml(t.nav.contact)}</a>
  `;

  document.getElementById("hero-eyebrow").textContent = interpolate(t.hero.eyebrow, vars);
  document.getElementById("hero-title").textContent = config.name;

  const titleSub = document.getElementById("hero-title-em");
  if (titleSub) {
    titleSub.textContent = t.hero.roleLine || "";
    titleSub.hidden = !t.hero.roleLine;
  }

  const roleEl = document.getElementById("hero-role");
  if (roleEl) {
    roleEl.textContent = [t.hero.title, t.hero.titleEm].filter(Boolean).join(" ");
  }

  const heroHandle = document.getElementById("hero-handle");
  if (heroHandle && config.github) {
    const user = config.github.replace(/\/$/, "").split("/").pop() || "";
    heroHandle.innerHTML = `<a href="${escapeHtml(config.github)}" target="_blank" rel="noopener noreferrer">@${escapeHtml(user)}</a>`;
  }

  const avatarStatus = document.getElementById("avatar-status");
  if (avatarStatus) avatarStatus.setAttribute("title", t.openBadge);
  document.getElementById("hero-tagline").textContent = t.hero.tagline;
  document.getElementById("hero-location").textContent = t.hero.location;
  document.getElementById("hero-availability").textContent = t.hero.availability;

  const heroPrimary = document.getElementById("hero-cta-primary");
  heroPrimary.textContent = t.hero.ctaPrimary;
  heroPrimary.href = mailto;

  document.getElementById("hero-cta-secondary").textContent = t.hero.ctaSecondary;

  const resumeLink = document.getElementById("hero-resume-link");
  if (resumeLink && config.resume && t.hero.resumeLink) {
    resumeLink.href = config.resume;
    resumeLink.textContent = t.hero.resumeLink;
    resumeLink.setAttribute("download", "");
  }

  if (t.statsDisplay) renderStats(t.statsDisplay);

  document.getElementById("proof-list").innerHTML = t.proofStrip
    .map((item) => `<li>${escapeHtml(item)}</li>`)
    .join("");

  document.getElementById("work-heading").textContent = t.work.heading;
  document.getElementById("work-subheading").textContent = t.work.subheading;

  const labels =
    lang === "es"
      ? { problem: "Problema", role: "Rol", outcome: "Resultado" }
      : { problem: "Problem", role: "Role", outcome: "Outcome" };

  document.getElementById("projects").innerHTML = t.projects
    .map((p) => {
      const tagClass =
        p.tag && /featured|destacado/i.test(p.tag) ? " project-tag-featured" : "";
      const tagHtml = p.tag
        ? `<span class="project-tag${tagClass}">${escapeHtml(p.tag)}</span>`
        : "";
      return `
    <article class="project-card">
      <div class="project-head">
        <h3>${escapeHtml(p.title)}</h3>
        ${tagHtml}
      </div>
      <p class="stack">${escapeHtml(p.stack)}</p>
      <dl class="project-grid">
        <div><dt>${labels.problem}</dt><dd>${escapeHtml(p.problem)}</dd></div>
        <div><dt>${labels.role}</dt><dd>${escapeHtml(p.role)}</dd></div>
        <div><dt>${labels.outcome}</dt><dd>${escapeHtml(p.outcome)}</dd></div>
      </dl>
    </article>
  `;
    })
    .join("");

  document.getElementById("skills-label").textContent = t.skillsLabel;
  document.getElementById("skills-list").innerHTML = t.skills
    .map((s) => `<li>${escapeHtml(s)}</li>`)
    .join("");

  document.getElementById("value-heading").textContent = t.value.heading;
  document.getElementById("value-subheading").textContent = t.value.subheading;
  document.getElementById("value-grid").innerHTML = t.value.items
    .map(
      (item, i) => `
    <article class="value-card">
      <span class="value-num" aria-hidden="true">0${i + 1}</span>
      <h3>${escapeHtml(item.title)}</h3>
      <p>${escapeHtml(item.description)}</p>
    </article>
  `
    )
    .join("");

  document.getElementById("offers-heading").textContent = t.offers.heading;
  document.getElementById("offers-subheading").textContent = t.offers.subheading;
  document.getElementById("offers-grid").innerHTML = t.offers.items
    .map(
      (item) => `
    <article class="offer-card">
      <h3>${escapeHtml(item.title)}</h3>
      <p>${escapeHtml(item.description)}</p>
    </article>
  `
    )
    .join("");

  document.getElementById("experience-heading").textContent = t.experience.heading;
  document.getElementById("experience-timeline").innerHTML = t.experience.roles
    .map(
      (r) => `
    <article class="timeline-item">
      <div class="timeline-meta">
        <span class="timeline-period">${escapeHtml(r.period)}</span>
      </div>
      <div class="timeline-body">
        <h3>${escapeHtml(r.title)} · ${escapeHtml(r.company)}</h3>
        <p>${escapeHtml(r.detail)}</p>
      </div>
    </article>
  `
    )
    .join("");

  document.getElementById("about-heading").textContent = t.about.heading;
  document.getElementById("about-p1").textContent = interpolate(t.about.p1, vars);
  document.getElementById("about-p2").textContent = interpolate(t.about.p2, vars);
  document.getElementById("about-lang-heading").textContent = t.about.languagesHeading;
  document.getElementById("about-current-heading").textContent = t.about.currentlyHeading;
  document.getElementById("about-remote").textContent = t.about.remoteLabel;
  document.getElementById("about-availability").textContent = t.hero.availability;
  document.getElementById("about-spoken").innerHTML = t.about.spoken
    .map((l) => `<li>${escapeHtml(l)}</li>`)
    .join("");
  document.getElementById("about-edu-heading").textContent = t.about.educationHeading;
  document.getElementById("about-education").innerHTML = t.about.education
    .map((e) => `<li>${escapeHtml(e)}</li>`)
    .join("");

  document.getElementById("contact-heading").textContent = t.contact.heading;
  document.getElementById("contact-subheading").textContent = t.contact.subheading;
  document.getElementById("contact-promise").textContent = t.contact.promise;

  const emailLink = document.getElementById("contact-email-link");
  if (emailLink) {
    emailLink.href = mailto;
    emailLink.textContent = config.email;
  }

  const contactMain = document.getElementById("contact-main-cta");
  contactMain.textContent = t.hero.ctaPrimary;
  contactMain.href = mailto;

  const gridLabel = document.getElementById("contact-grid-label");
  if (gridLabel && t.contact.gridLabel) gridLabel.textContent = t.contact.gridLabel;

  const floating = document.getElementById("floating-cta");
  if (floating) {
    floating.textContent = t.nav.hire;
    floating.href = mailto;
  }

  const resumeHref = config.resume ? escapeHtml(config.resume) : "#";
  const whatsappHref = config.whatsapp ? escapeHtml(config.whatsapp) : "#";

  document.getElementById("contact-grid").innerHTML = `
    <a class="contact-card" href="${escapeHtml(config.linkedin)}" target="_blank" rel="noopener noreferrer">
      <span class="label">${escapeHtml(t.contact.linkedin)}</span>
      <span class="value">${escapeHtml(t.contact.linkedinValue)}</span>
    </a>
    <a class="contact-card" href="${escapeHtml(config.github)}" target="_blank" rel="noopener noreferrer">
      <span class="label">${escapeHtml(t.contact.github)}</span>
      <span class="value">${escapeHtml(t.contact.githubValue)}</span>
    </a>
    <a class="contact-card" href="${whatsappHref}" target="_blank" rel="noopener noreferrer">
      <span class="label">${escapeHtml(t.contact.whatsapp)}</span>
      <span class="value">${escapeHtml(t.contact.whatsappValue)}</span>
    </a>
    <a class="contact-card" href="${resumeHref}" download>
      <span class="label">${escapeHtml(t.contact.resume)}</span>
      <span class="value">${escapeHtml(t.contact.resumeValue)}</span>
    </a>
  `;

  document.querySelectorAll(".lang-btn").forEach((btn) => {
    const isActive = btn.getAttribute("data-lang") === lang;
    btn.classList.toggle("is-active", isActive);
    btn.setAttribute("aria-pressed", isActive ? "true" : "false");
  });

  if (t.sectionTags) {
    document.querySelectorAll("[data-section-tag]").forEach((el) => {
      const key = el.getAttribute("data-section-tag");
      if (t.sectionTags[key]) el.textContent = t.sectionTags[key];
    });
  }

  applyImages(lang);

  const url = new URL(window.location.href);
  url.searchParams.set("lang", lang);
  history.replaceState({}, "", url);

  document.body.classList.add("is-ready");
  initNavSpy();
}

document.querySelectorAll(".lang-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const lang = btn.getAttribute("data-lang");
    if (lang && lang !== currentLang) applyLocale(lang);
  });
});

const menuToggle = document.querySelector(".menu-toggle");
const nav = document.getElementById("main-nav");
if (menuToggle && nav) {
  menuToggle.addEventListener("click", () => {
    const open = nav.classList.toggle("is-open");
    menuToggle.setAttribute("aria-expanded", open ? "true" : "false");
  });
  nav.addEventListener("click", (e) => {
    if (e.target.matches("a")) nav.classList.remove("is-open");
  });
}

try {
  await applyLocale(currentLang);
} catch (err) {
  console.error("Portfolio failed to load locale content:", err);
  document.body.classList.add("is-ready");
  document.querySelectorAll(".reveal").forEach((el) => el.classList.add("is-visible"));
}

const siteHeader = document.querySelector(".site-header");
if (siteHeader) {
  const onHeaderScroll = () => {
    siteHeader.classList.toggle("is-scrolled", window.scrollY > 20);
  };
  window.addEventListener("scroll", onHeaderScroll, { passive: true });
  onHeaderScroll();
}

const revealEls = document.querySelectorAll(".reveal");
if (revealEls.length && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  revealEls.forEach((el, i) => {
    el.style.setProperty("--reveal-delay", `${Math.min(i * 60, 240)}ms`);
  });

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.06, rootMargin: "0px 0px -32px 0px" }
  );
  revealEls.forEach((el) => observer.observe(el));
} else {
  revealEls.forEach((el) => el.classList.add("is-visible"));
}
