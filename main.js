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

let currentLang = detectLanguage();

async function applyLocale(lang) {
  const t = await loadLocale(lang);
  currentLang = lang;
  localStorage.setItem(STORAGE_KEY, lang);
  document.documentElement.lang = lang;

  const years = config.yearsExperience || "8+";
  const vars = { years };

  document.title = t.meta.title;
  document.getElementById("doc-title").textContent = t.meta.title;
  document.getElementById("meta-description").content = t.meta.description;
  document.getElementById("og-title").content = t.meta.title;
  document.getElementById("og-description").content = t.meta.description;

  document.getElementById("logo-name").textContent = config.name;
  document.getElementById("footer-name").textContent = config.name;
  document.getElementById("footer-text").textContent = t.footer;
  document.getElementById("year").textContent = String(new Date().getFullYear());
  document.getElementById("stat-years").textContent = years;

  const statLabels =
    lang === "es"
      ? { years: "Años", clients: "Clientes", ai: "IA certificado" }
      : { years: "Years", clients: "Clients", ai: "AI Certified" };
  document.querySelectorAll("[data-i18n-stat]").forEach((el) => {
    const key = el.getAttribute("data-i18n-stat");
    if (statLabels[key]) el.textContent = statLabels[key];
  });

  document.getElementById("lang-label").textContent = t.langSwitch.label;

  const nav = document.getElementById("main-nav");
  nav.innerHTML = `
    <a href="#work">${escapeHtml(t.nav.work)}</a>
    <a href="#experience">${escapeHtml(t.nav.experience)}</a>
    <a href="#about">${escapeHtml(t.nav.about)}</a>
    <a href="#contact">${escapeHtml(t.nav.contact)}</a>
  `;

  document.getElementById("hero-eyebrow").textContent = interpolate(t.hero.eyebrow, vars);
  document.getElementById("hero-title").textContent = t.hero.title;
  document.getElementById("hero-title-em").textContent = t.hero.titleEm;
  document.getElementById("hero-tagline").textContent = t.hero.tagline;
  document.getElementById("hero-location").textContent = t.hero.location;
  document.getElementById("hero-availability").textContent = t.hero.availability;
  document.getElementById("hero-cta-primary").textContent = t.hero.ctaPrimary;
  document.getElementById("hero-cta-secondary").textContent = t.hero.ctaSecondary;
  const resumeCta = document.getElementById("hero-cta-resume");
  if (resumeCta && config.resume) {
    resumeCta.href = config.resume;
    resumeCta.textContent =
      lang === "es" ? "Descargar currículum" : "Download resume";
    resumeCta.setAttribute("download", "");
  }

  const skillsList = document.getElementById("skills-list");
  skillsList.innerHTML = t.skills.map((s) => `<li>${escapeHtml(s)}</li>`).join("");

  document.getElementById("work-heading").textContent = t.work.heading;
  document.getElementById("work-subheading").textContent = t.work.subheading;

  const projectsRoot = document.getElementById("projects");
  const labels =
    lang === "es"
      ? { problem: "Problema", role: "Rol", outcome: "Resultado" }
      : { problem: "Problem", role: "Role", outcome: "Outcome" };

  projectsRoot.innerHTML = t.projects
    .map(
      (p) => `
    <article class="project-card">
      <h3>${escapeHtml(p.title)}</h3>
      <p class="stack">${escapeHtml(p.stack)}</p>
      <dl class="project-grid">
        <div><dt>${labels.problem}</dt><dd>${escapeHtml(p.problem)}</dd></div>
        <div><dt>${labels.role}</dt><dd>${escapeHtml(p.role)}</dd></div>
        <div><dt>${labels.outcome}</dt><dd>${escapeHtml(p.outcome)}</dd></div>
      </dl>
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
  document.getElementById("about-p2").textContent = t.about.p2;
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

  const resumeHref = config.resume ? escapeHtml(config.resume) : "#";
  const whatsappHref = config.whatsapp ? escapeHtml(config.whatsapp) : "#";

  document.getElementById("contact-grid").innerHTML = `
    <a class="contact-card featured" href="${resumeHref}" download>
      <span class="label">${escapeHtml(t.contact.resume)}</span>
      <span class="value">${escapeHtml(t.contact.resumeValue)}</span>
    </a>
    <a class="contact-card" href="mailto:${escapeHtml(config.email)}">
      <span class="label">${escapeHtml(t.contact.email)}</span>
      <span class="value">${escapeHtml(config.email)}</span>
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
  nav.querySelectorAll("a").forEach((a) => {
    a.addEventListener("click", () => nav.classList.remove("is-open"));
  });
}

await applyLocale(currentLang);
