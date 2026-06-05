const SUPPORTED = ["en", "es", "de", "fr", "nl", "pl", "it", "pt", "ja"];
const STORAGE_KEY = "portfolio-lang";
const INTRO_KEY = "portfolio-intro-seen";

const BROWSER_LANG_PREFIXES = [
  ["ja", "ja"],
  ["pt", "pt"],
  ["pl", "pl"],
  ["nl", "nl"],
  ["de", "de"],
  ["fr", "fr"],
  ["it", "it"],
  ["es", "es"],
];

const LANG_NATIVE_NAMES = {
  en: "English",
  es: "Español",
  de: "Deutsch",
  fr: "Français",
  nl: "Nederlands",
  pl: "Polski",
  it: "Italiano",
  pt: "Português",
  ja: "日本語",
};

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
  for (const [prefix, code] of BROWSER_LANG_PREFIXES) {
    if (browser.startsWith(prefix)) return code;
  }
  return "en";
}

function initLangSelect() {
  const select = document.getElementById("lang-select");
  if (!select || select.options.length) return;
  SUPPORTED.forEach((code) => {
    const opt = document.createElement("option");
    opt.value = code;
    opt.textContent = LANG_NATIVE_NAMES[code] || code;
    select.appendChild(opt);
  });
}

let enLocaleCache = null;

function isEmptyObject(value) {
  return (
    value &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    Object.keys(value).length === 0
  );
}

/** Fill gaps from English when a locale file has partial/empty nested objects. */
function mergeLocale(en, loc) {
  if (loc === undefined || loc === null) return en;
  if (isEmptyObject(loc)) return en;
  if (Array.isArray(loc)) {
    return loc.map((item, i) => mergeLocale(en?.[i], item));
  }
  if (typeof loc === "object") {
    const keys = new Set([...Object.keys(en || {}), ...Object.keys(loc)]);
    const out = {};
    for (const key of keys) {
      out[key] = mergeLocale(en?.[key], loc[key]);
    }
    return out;
  }
  return loc || en;
}

async function fetchLocaleFile(lang) {
  const res = await fetch(`./i18n/${lang}.json`);
  if (!res.ok) throw new Error(`Locale ${lang} not found`);
  return res.json();
}

async function loadLocale(lang) {
  if (!enLocaleCache) enLocaleCache = await fetchLocaleFile("en");
  if (lang === "en") return enLocaleCache;
  const locale = await fetchLocaleFile(lang);
  return mergeLocale(enLocaleCache, locale);
}

function interpolate(text, vars) {
  return text.replace(/\{(\w+)\}/g, (_, key) => vars[key] ?? "");
}

function escapeHtml(text) {
  const d = document.createElement("div");
  d.textContent = text;
  return d.innerHTML;
}

const BADGE_TONES = ["accent", "gold", "success", "muted"];

function badgeHtml(label, tone = "") {
  const toneClass = tone ? ` badge--${tone}` : "";
  return `<span class="badge${toneClass}">${escapeHtml(label)}</span>`;
}

function badgeRowHtml(labels, tone = "") {
  if (!labels?.length) return "";
  return `<div class="badge-row" role="list">${labels
    .map((label) => `<span role="listitem">${badgeHtml(label, tone)}</span>`)
    .join("")}</div>`;
}

const LIFE_ICONS = {
  code: `<svg viewBox="0 0 24 24" aria-hidden="true"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>`,
  guitar: `<svg viewBox="0 0 24 24" aria-hidden="true"><g transform="rotate(42 12 12)"><path d="M8.5 2.05h7" stroke-linecap="round"/><path d="M8.5 2.3 7.35 3M8.5 3 7.35 3.7M8.5 3.7 7.35 4.4"/><path d="M15.5 2.3 16.65 3M15.5 3 16.65 3.7M15.5 3.7 16.65 4.4"/><path d="M10.9 4.05h2.2v3.45"/><path d="M12 7.5c2.75 0 4.7 1.1 4.7 2.45 0 .78-.62 1.3-1.75 1.45 2.05.22 3.45 1.38 3.45 2.92 0 1.88-2.05 3.42-4.9 3.42-2.85 0-4.9-1.54-4.9-3.42 0-1.54 1.4-2.7 3.45-2.92-1.13-.15-1.75-.67-1.75-1.45 0-1.35 1.95-2.45 4.7-2.45z"/><circle cx="12" cy="11.55" r=".92"/><path d="M9.4 13.95h5.2" stroke-linecap="round"/></g></svg>`,
  book: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/><path d="M8 7h8M8 11h6"/></svg>`,
  swim: `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10" cy="6" r="2"/><path d="M4 14c2-1 3.5-1 6 0s4 1 6 0"/><path d="M2 18c2.5-1 5-1 8 0s5.5 1 8 0"/></svg>`,
};

function lifeBadgeHtml(item, ariaLabel) {
  const icon = LIFE_ICONS[item.icon] || "";
  const toneClass = item.tone ? ` badge--${item.tone}` : "";
  const label = escapeHtml(ariaLabel);
  return `<li><span class="badge badge--icon${toneClass}" role="img" aria-label="${label}" title="${label}">${icon}</span></li>`;
}

function renderLifeBadges(containerId, t) {
  const el = document.getElementById(containerId);
  const badges = config.lifeBadges;
  if (!el || !badges?.length) return;

  const labels = t.lifeBadges || {};
  if (labels.groupLabel) el.setAttribute("aria-label", labels.groupLabel);

  el.innerHTML = badges
    .map((item) => lifeBadgeHtml(item, labels[item.id] || item.id))
    .join("");
}

function mailtoLink() {
  const subject = encodeURIComponent(config.mailtoSubject || "Hello");
  return `mailto:${config.email}?subject=${subject}`;
}

let currentLang = detectLanguage();

function shouldShowIntro() {
  const params = new URLSearchParams(window.location.search);
  if (params.get("view") === "portfolio") return false;
  if (params.get("view") === "card") {
    localStorage.removeItem(INTRO_KEY);
    return true;
  }
  return !localStorage.getItem(INTRO_KEY);
}

function openPortfolio() {
  localStorage.setItem(INTRO_KEY, "1");
  const shell = document.getElementById("portfolio-shell");
  const bizCard = document.getElementById("biz-card");

  document.body.classList.remove("is-intro");
  document.body.classList.add("is-portfolio-open");
  shell?.removeAttribute("inert");
  bizCard?.setAttribute("aria-hidden", "true");

  syncStickyOffsets();
  initNavSpy();
  window.scrollTo(0, 0);

  const skip = document.getElementById("skip-link");
  if (skip) skip.setAttribute("href", "#main-content");

  window.setTimeout(() => {
    bizCard?.classList.add("biz-card--gone");
  }, 450);
}

function initIntro() {
  const shell = document.getElementById("portfolio-shell");
  const bizCard = document.getElementById("biz-card");
  const openBtn = document.getElementById("biz-card-open");

  if (!shouldShowIntro()) {
    document.body.classList.add("is-portfolio-open");
    bizCard?.classList.add("biz-card--gone");
    bizCard?.setAttribute("aria-hidden", "true");
    return;
  }

  document.body.classList.add("is-intro");
  shell?.setAttribute("inert", "");
  bizCard?.removeAttribute("aria-hidden");

  const skip = document.getElementById("skip-link");
  if (skip) {
    skip.setAttribute("href", "#");
    skip.addEventListener("click", (e) => {
      if (!document.body.classList.contains("is-intro")) return;
      e.preventDefault();
      openPortfolio();
    });
  }

  openBtn?.addEventListener("click", openPortfolio);

  document.querySelectorAll(".biz-card__quick-link").forEach((link) => {
    link.addEventListener("click", (e) => e.stopPropagation());
  });
}

function applyBusinessCard(t, mailto) {
  const card = t.businessCard || {};
  const nameEl = document.getElementById("biz-card-name");
  if (nameEl) nameEl.textContent = config.name;

  const roleEl = document.getElementById("biz-card-role");
  if (roleEl) roleEl.textContent = t.hero?.roleLine || "";

  const taglineEl = document.getElementById("biz-card-tagline");
  if (taglineEl) taglineEl.textContent = card.tagline || "";

  const statusEl = document.getElementById("biz-card-status");
  if (statusEl) statusEl.textContent = t.openBadge || "";

  const ctaEl = document.getElementById("biz-card-cta");
  if (ctaEl) ctaEl.textContent = card.cta || "View portfolio";

  const hintEl = document.getElementById("biz-card-hint");
  if (hintEl) hintEl.textContent = card.hint || "";

  const photo = document.getElementById("biz-card-photo");
  if (photo) {
    if (config.profileImage) photo.src = config.profileImage;
    photo.alt = t.profileImageAlt
      ? interpolate(t.profileImageAlt, { name: config.name })
      : `Profile photo of ${config.name}`;
  }

  const emailLink = document.getElementById("biz-card-email");
  if (emailLink) {
    emailLink.href = mailto;
    emailLink.textContent = t.contact?.email || "Email";
  }

  const linkedinLink = document.getElementById("biz-card-linkedin");
  if (linkedinLink && config.linkedin) {
    linkedinLink.href = config.linkedin;
    linkedinLink.textContent = t.contact?.linkedin || "LinkedIn";
  }

  renderLifeBadges("biz-card-life-badges", t);
}

initIntro();

function applyImages(t) {
  const profileAlt = t.profileImageAlt
    ? interpolate(t.profileImageAlt, { name: config.name })
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
    const bannerH =
      parseFloat(
        getComputedStyle(document.documentElement).getPropertyValue("--open-banner-h")
      ) || 36;
    const headerH =
      parseFloat(
        getComputedStyle(document.documentElement).getPropertyValue("--site-header-h")
      ) || 60;
    const scrollY = window.scrollY + bannerH + headerH + 24;
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

  renderLifeBadges("hero-life-badges", t);

  const avatarStatus = document.getElementById("avatar-status");
  if (avatarStatus) avatarStatus.setAttribute("title", t.openBadge);

  const heroBadges = document.getElementById("hero-badges");
  if (heroBadges && t.heroBadges?.length) {
    heroBadges.innerHTML = t.heroBadges
      .map(
        (label, i) =>
          `<li>${badgeHtml(label, BADGE_TONES[i % BADGE_TONES.length])}</li>`
      )
      .join("");
  }

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
    .map((item) => `<li>${badgeHtml(item)}</li>`)
    .join("");

  document.getElementById("work-heading").textContent = t.work.heading;
  document.getElementById("work-subheading").textContent = t.work.subheading;

  const labels = t.projectLabels || {
    problem: "Problem",
    role: "Role",
    outcome: "Outcome",
  };

  document.getElementById("projects").innerHTML = t.projects
    .map((p) => {
      const tagHtml = p.tag ? badgeHtml(p.tag, "featured") : "";
      const stackItems = p.stack
        ? p.stack
            .split("·")
            .map((s) => s.trim())
            .filter(Boolean)
        : [];
      const stackBadges = stackItems.length
        ? `<div class="badge-row project-badges" role="list">${stackItems
            .map((s) => `<span role="listitem">${badgeHtml(s, "skill")}</span>`)
            .join("")}</div>`
        : "";
      return `
    <article class="project-card">
      <div class="project-head">
        <h3>${escapeHtml(p.title)}</h3>
        ${tagHtml}
      </div>
      ${stackBadges}
      <p class="stack" hidden>${escapeHtml(p.stack)}</p>
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
    .map((s) => `<li>${badgeHtml(s, "skill")}</li>`)
    .join("");

  if (t.certifications) {
    document.getElementById("credentials-heading").textContent =
      t.certifications.heading;
    document.getElementById("credentials-subheading").textContent =
      t.certifications.subheading;

    const fccUser = config.freeCodeCampUsername || "jasmeetsohal";
    const verifyLabel = t.certifications.verifyLabel || "View certificate";

    document.getElementById("cert-grid").innerHTML = t.certifications.items
      .map(
        (cert, i) => `
    <article class="cert-card">
      <div class="cert-card-head">
        ${badgeHtml(cert.issuer, "gold")}
        <span class="cert-date">${escapeHtml(cert.date)}</span>
      </div>
      <h3>${escapeHtml(cert.title)}</h3>
      <a class="cert-verify" href="https://www.freecodecamp.org/certification/${escapeHtml(fccUser)}/${escapeHtml(cert.slug)}" target="_blank" rel="noopener noreferrer">${escapeHtml(verifyLabel)} →</a>
    </article>
  `
      )
      .join("");
  }

  document.getElementById("value-heading").textContent = t.value.heading;
  document.getElementById("value-subheading").textContent = t.value.subheading;
  document.getElementById("value-grid").innerHTML = t.value.items
    .map(
      (item, i) => `
    <article class="value-card">
      <span class="value-num" aria-hidden="true">0${i + 1}</span>
      ${item.badge ? badgeHtml(item.badge, BADGE_TONES[i % BADGE_TONES.length]) : ""}
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
      (item, i) => `
    <article class="offer-card">
      ${item.badge ? badgeHtml(item.badge, BADGE_TONES[(i + 1) % BADGE_TONES.length]) : ""}
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
        <div class="badge-row timeline-badges" role="list">
          <span role="listitem">${badgeHtml(r.period, "muted")}</span>
          ${r.badge ? `<span role="listitem">${badgeHtml(r.badge, "accent")}</span>` : ""}
        </div>
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
  const aboutRemote = document.getElementById("about-remote");
  if (aboutRemote) aboutRemote.innerHTML = badgeHtml(t.about.remoteLabel, "accent");
  document.getElementById("about-availability").textContent = t.hero.availability;

  const credBadges = document.getElementById("about-credentials");
  if (credBadges && t.about.credentialBadges?.length) {
    credBadges.innerHTML = t.about.credentialBadges
      .map((label, i) => `<span role="listitem">${badgeHtml(label, BADGE_TONES[i % BADGE_TONES.length])}</span>`)
      .join("");
  }

  document.getElementById("about-spoken").innerHTML = t.about.spoken
    .map((l) => `<span role="listitem">${badgeHtml(l, "muted")}</span>`)
    .join("");
  document.getElementById("about-edu-heading").textContent = t.about.educationHeading;
  document.getElementById("about-education").innerHTML = t.about.education
    .map((e) => `<li>${badgeHtml(e, "gold")}</li>`)
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

  const langSelect = document.getElementById("lang-select");
  if (langSelect) langSelect.value = lang;

  if (t.sectionTags) {
    document.querySelectorAll("[data-section-tag]").forEach((el) => {
      const key = el.getAttribute("data-section-tag");
      if (t.sectionTags[key]) el.textContent = t.sectionTags[key];
    });
  }

  applyImages(t);
  applyBusinessCard(t, mailto);

  const url = new URL(window.location.href);
  url.searchParams.set("lang", lang);
  history.replaceState({}, "", url);

  document.body.classList.add("is-ready");
  if (!document.body.classList.contains("is-intro")) {
    syncStickyOffsets();
    initNavSpy();
  }
}

function syncStickyOffsets() {
  const banner = document.getElementById("open-banner");
  const header = document.querySelector(".site-header");
  const root = document.documentElement;
  if (banner) {
    root.style.setProperty("--open-banner-h", `${banner.offsetHeight}px`);
  }
  if (header) {
    root.style.setProperty("--site-header-h", `${header.offsetHeight}px`);
  }
}

initLangSelect();

const langSelectEl = document.getElementById("lang-select");
if (langSelectEl) {
  langSelectEl.addEventListener("change", () => {
    const lang = langSelectEl.value;
    if (lang && lang !== currentLang && SUPPORTED.includes(lang)) applyLocale(lang);
  });
}

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

window.addEventListener("resize", syncStickyOffsets);

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
