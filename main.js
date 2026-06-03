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

  for (const id of ["profile-image", "about-profile-image"]) {
    const img = document.getElementById(id);
    if (img && config.profileImage) {
      img.src = config.profileImage;
      img.alt = profileAlt;
    }
  }

  const ogImage = document.getElementById("og-image");
  if (ogImage && config.profileImage) {
    ogImage.content = new URL(config.profileImage, window.location.href).href;
  }
}

async function applyLocale(lang) {
  const t = await loadLocale(lang);
  currentLang = lang;
  localStorage.setItem(STORAGE_KEY, lang);
  document.documentElement.lang = lang;

  const years = config.yearsExperience || "7+";
  const vars = { years };
  const mailto = mailtoLink();

  document.title = t.meta.title;
  document.getElementById("doc-title").textContent = t.meta.title;
  document.getElementById("meta-description").content = t.meta.description;
  document.getElementById("og-title").content = t.meta.title;
  document.getElementById("og-description").content = t.meta.description;

  document.getElementById("open-badge-text").textContent = t.openBadge;
  document.getElementById("logo-name").textContent = config.name;
  document.getElementById("footer-name").textContent = config.name;
  document.getElementById("footer-text").textContent = t.footer;
  document.getElementById("year").textContent = String(new Date().getFullYear());
  document.getElementById("stat-years").textContent = years;

  if (t.stats) {
    document.querySelectorAll("[data-i18n-stat]").forEach((el) => {
      const key = el.getAttribute("data-i18n-stat");
      if (t.stats[key]) el.textContent = t.stats[key];
    });
  }

  document.getElementById("lang-label").textContent = t.langSwitch.label;

  const headerHire = document.getElementById("header-hire-cta");
  if (headerHire) {
    headerHire.textContent = t.nav.hire;
    headerHire.href = mailto;
  }

  const nav = document.getElementById("main-nav");
  nav.innerHTML = `
    <a href="#why-me">${escapeHtml(t.nav.why)}</a>
    <a href="#work">${escapeHtml(t.nav.work)}</a>
    <a href="#experience">${escapeHtml(t.nav.experience)}</a>
    <a href="#about">${escapeHtml(t.nav.about)}</a>
    <a href="#contact">${escapeHtml(t.nav.contact)}</a>
  `;

  document.getElementById("hero-eyebrow").textContent = interpolate(t.hero.eyebrow, vars);
  document.getElementById("hero-title").textContent = t.hero.title;
  document.getElementById("hero-title-em").textContent = t.hero.titleEm;
  document.getElementById("hero-tagline").textContent = t.hero.tagline;
  const proofLine = document.getElementById("hero-proof-line");
  if (proofLine && t.hero.proofLine) proofLine.textContent = t.hero.proofLine;
  document.getElementById("hero-location").textContent = t.hero.location;
  document.getElementById("hero-availability").textContent = t.hero.availability;

  const heroPrimary = document.getElementById("hero-cta-primary");
  heroPrimary.textContent = t.hero.ctaPrimary;
  heroPrimary.href = mailto;

  document.getElementById("hero-cta-secondary").textContent = t.hero.ctaSecondary;

  const resumeCta = document.getElementById("hero-cta-resume");
  if (resumeCta && config.resume) {
    resumeCta.href = config.resume;
    resumeCta.textContent = lang === "es" ? "Descargar CV" : "Download CV";
    resumeCta.setAttribute("download", "");
  }

  document.getElementById("proof-list").innerHTML = t.proofStrip
    .map((item) => `<li>${escapeHtml(item)}</li>`)
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

  document.getElementById("skills-label").textContent = t.skillsLabel;
  document.getElementById("skills-list").innerHTML = t.skills
    .map((s) => `<li>${escapeHtml(s)}</li>`)
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

  const contactMain = document.getElementById("contact-main-cta");
  contactMain.textContent = t.hero.ctaPrimary;
  contactMain.href = mailto;

  const floating = document.getElementById("floating-cta");
  if (floating) {
    floating.textContent = t.nav.hire;
    floating.href = mailto;
  }

  const resumeHref = config.resume ? escapeHtml(config.resume) : "#";
  const whatsappHref = config.whatsapp ? escapeHtml(config.whatsapp) : "#";

  document.getElementById("contact-grid").innerHTML = `
    <a class="contact-card featured" href="${mailto}">
      <span class="label">${escapeHtml(t.contact.email)}</span>
      <span class="value">${escapeHtml(config.email)}</span>
    </a>
    <a class="contact-card" href="${resumeHref}" download>
      <span class="label">${escapeHtml(t.contact.resume)}</span>
      <span class="value">${escapeHtml(t.contact.resumeValue)}</span>
    </a>
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
  `;

  document.querySelectorAll(".lang-btn").forEach((btn) => {
    const isActive = btn.getAttribute("data-lang") === lang;
    btn.classList.toggle("is-active", isActive);
    btn.setAttribute("aria-pressed", isActive ? "true" : "false");
  });

  applyImages(lang);

  const url = new URL(window.location.href);
  url.searchParams.set("lang", lang);
  history.replaceState({}, "", url);
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

await applyLocale(currentLang);
