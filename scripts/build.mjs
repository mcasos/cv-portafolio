import { cp, mkdir, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { certifications, labels, projects, site } from "../content/site.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "dist");
const pick = (value, lang) => (typeof value === "string" ? value : value[lang]);

const esc = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

function escUrl(value) {
  const url = String(value).trim();
  const safeAbsolute = /^(?:https:\/\/|mailto:)/i.test(url);
  const safeRelative = /^(?:#[A-Za-z0-9_-]+|\/(?!\/)[A-Za-z0-9._~/-]*(?:#[A-Za-z0-9_-]+)?|\.{0,2}\/[A-Za-z0-9._~/-]*(?:#[A-Za-z0-9_-]+)?|[A-Za-z0-9][A-Za-z0-9._~/-]*(?:#[A-Za-z0-9_-]+)?)$/.test(url);
  if (!safeAbsolute && !safeRelative) throw new Error(`Unsafe URL: ${url}`);
  return esc(url);
}

function head({ lang, title, description, canonical, alternate, assetPrefix, image }) {
  const ogImage = image || `${site.baseUrl}/assets/og.png`;
  const defaultUrl = lang === "es" ? canonical : alternate;
  return `<!DOCTYPE html>
<html lang="${esc(lang)}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}">
  <meta name="theme-color" content="#f2f0e9">
  <link rel="icon" href="${escUrl(`${assetPrefix}favicon.svg`)}" type="image/svg+xml">
  <link rel="canonical" href="${escUrl(canonical)}">
  <link rel="alternate" hreflang="${esc(lang)}" href="${escUrl(canonical)}">
  <link rel="alternate" hreflang="${lang === "es" ? "en" : "es"}" href="${escUrl(alternate)}">
  <link rel="alternate" hreflang="x-default" href="${escUrl(defaultUrl)}">
  <meta property="og:type" content="website">
  <meta property="og:locale" content="${lang === "es" ? "es_PE" : "en_US"}">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:url" content="${escUrl(canonical)}">
  <meta property="og:image" content="${escUrl(ogImage)}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(title)}">
  <meta name="twitter:description" content="${esc(description)}">
  <meta name="twitter:image" content="${escUrl(ogImage)}">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&amp;family=Space+Grotesk:wght@400;500;600;700&amp;display=swap" rel="stylesheet">
  <link rel="stylesheet" href="${escUrl(`${assetPrefix}assets/styles.css`)}">
  <script>document.documentElement.classList.add("js-enabled");</script>
</head>`;
}

function header(lang, homeHref, switchHref) {
  const l = labels[lang];
  const switchLang = lang === "es" ? "en" : "es";
  return `<body>
<a class="skip-link" href="#contenido">${esc(l.skip)}</a>
<header class="site-header">
  <nav class="nav container" aria-label="${esc(l.navigation)}">
    <a class="logo" href="${escUrl(homeHref)}" aria-label="${esc(site.name)}">
      <span>MC</span><small>PRODUCT LOG / 26</small>
    </a>
    <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="nav-links">${esc(l.index)}</button>
    <ul id="nav-links" class="nav-links">
      <li><a href="${escUrl(`${homeHref}#proyectos`)}">${esc(l.nav[3])}</a></li>
      <li><a href="${escUrl(`${homeHref}#habilidades`)}">${esc(l.nav[1])}</a></li>
      <li><a href="${escUrl(`${homeHref}#certificaciones`)}">${esc(l.nav[4])}</a></li>
      <li><a href="${escUrl(`${homeHref}#contacto`)}">${esc(l.nav[5])}</a></li>
      <li><a class="lang-link" href="${escUrl(switchHref)}" lang="${switchLang}">${switchLang.toUpperCase()}</a></li>
    </ul>
  </nav>
</header>`;
}

function footer(lang, assetPrefix) {
  return `<footer class="site-footer">
  <div class="container"><p>© <span data-year>2026</span> ${esc(site.name)} · ${esc(labels[lang].footer)}</p></div>
</footer>
<script src="${escUrl(`${assetPrefix}assets/client.js`)}"></script>
</body>
</html>`;
}

function projectCard(project, lang) {
  const l = labels[lang];
  const number = String(projects.indexOf(project) + 1).padStart(2, "0");
  const classes = ["project-card", project.primary && "featured", project.flagship && "flagship"].filter(Boolean).join(" ");
  const status = project.status ? `<p class="project-status"><span></span>${esc(pick(project.status, lang))}</p>` : "";
  const repository = project.repoUrl ? `<a class="project-link secondary" href="${escUrl(project.repoUrl)}" rel="noreferrer">${esc(l.code)} ↗</a>` : "";

  return `<article class="${classes}">
  <div class="project-top"><span class="project-number">${number} / ${String(projects.length).padStart(2, "0")}</span><span class="project-category">${esc(pick(project.category, lang))}</span></div>
  <div class="project-title-row"><div class="project-icon">${esc(project.icon)}</div><h3>${esc(project.title)}</h3></div>
  <p class="project-desc">${esc(pick(project.summary, lang))}</p>
  ${status}
  <ul class="project-features">${project.features[lang].map((item) => `<li>${esc(item)}</li>`).join("")}</ul>
  <div class="project-tech">${project.tech.map((item) => `<span>${esc(item)}</span>`).join("")}</div>
  <div class="project-links"><a class="project-link" href="${escUrl(`projects/${project.slug}/index.html`)}">${esc(l.see)} →</a>${repository}</div>
</article>`;
}

function credentialCard(credential, lang, assetPrefix) {
  const l = labels[lang];
  return `<article class="credential-card">
  <div class="credential-top"><span>${esc(credential.issuer)}</span><time datetime="${esc(credential.dateIso)}">${esc(pick(credential.date, lang))}</time></div>
  <h3>${esc(credential.title)}</h3><p>${esc(pick(credential.detail, lang))}</p>
  <div class="project-links"><a class="project-link" href="${escUrl(credential.verifyUrl)}" rel="noreferrer">${esc(l.verify)} ↗</a><a class="project-link secondary" href="${escUrl(`${assetPrefix}${credential.file}`)}" target="_blank" rel="noreferrer">${esc(l.certificate)}</a></div>
</article>`;
}

function home(lang) {
  const l = labels[lang];
  const isEs = lang === "es";
  const assetPrefix = isEs ? "" : "../";
  const canonical = isEs ? `${site.baseUrl}/` : `${site.baseUrl}/en/`;
  const alternate = isEs ? `${site.baseUrl}/en/` : `${site.baseUrl}/`;
  const homeHref = "./index.html";
  const switchHref = isEs ? "en/index.html" : "../index.html";
  const cvHref = isEs ? "cv/Miguel_CV_ES.pdf" : "../cv/Miguel_CV_EN.pdf";
  const title = `${site.name} — ${l.pageTitle}`;
  const primary = projects.filter((project) => project.primary).map((project) => projectCard(project, lang)).join("");
  const support = projects.filter((project) => !project.primary).map((project) => projectCard(project, lang)).join("");
  const skillCards = site.skills.map((skill) => `<article class="skill-card"><h3>${esc(pick(skill.title, lang))}</h3><ul>${skill.items.map((item) => `<li>${esc(item)}</li>`).join("")}</ul></article>`).join("");
  const credentials = certifications.map((credential) => credentialCard(credential, lang, assetPrefix)).join("");

  return `${head({ lang, title, description: pick(site.summary, lang), canonical, alternate, assetPrefix })}
${header(lang, homeHref, switchHref)}
<main id="contenido">
  <section id="inicio" class="hero"><div class="container">
    <div class="hero-meta"><span>${esc(l.heroNote)}</span><span>${esc(pick(site.location, lang))}</span><span>2022—26</span></div>
    <p class="eyebrow">${esc(l.hello)} ${esc(site.name)}</p><h1>${esc(l.heroClaim)}</h1>
    <div class="hero-bottom"><p class="hero-sub"><strong>${esc(pick(site.role, lang))}</strong><br>${esc(pick(site.summary, lang))}</p><div class="hero-actions"><a class="btn btn-primary" href="#proyectos">${esc(l.nav[3])} ↓</a><a class="btn btn-ghost" href="${escUrl(cvHref)}" download>${esc(l.cv)}</a></div></div>
    <div class="signal-strip" aria-label="${esc(l.summaryLabel)}"><div><strong>${projects.length}</strong><span>${esc(l.summaryCases)}</span></div><div><strong>1</strong><span>${esc(l.summaryCandidate)}</span></div><div><strong>ES / EN</strong><span>${esc(l.summaryLanguages)}</span></div><div><strong>100%</strong><span>${esc(l.summaryLimits)}</span></div></div>
  </div></section>
  <section id="habilidades" class="section"><div class="container"><p class="eyebrow center">${esc(l.stack)}</p><h2 class="section-title center">${esc(l.skills)}</h2><div class="skills-grid">${skillCards}</div></div></section>
  <section id="educacion" class="section education-section"><div class="container"><article class="education-card"><div><p class="eyebrow">${esc(l.education)}</p><h2>${esc(pick(site.education.degree, lang))}</h2><p>${esc(site.education.institution)}</p></div><strong>${esc(pick(site.education.dates, lang))}</strong></article></div></section>
  <section id="proyectos" class="section projects-section"><div class="container"><div class="projects-heading"><div><p class="eyebrow">${esc(l.projects)} / ${esc(l.featured)}</p><h2 class="section-title">${esc(l.built)}</h2></div><p class="section-intro">${esc(l.sectionIntro)}</p></div><div class="projects-grid">${primary}</div><div class="projects-heading support-heading"><p class="eyebrow">${esc(l.support)}</p></div><div class="projects-grid support-grid">${support}</div></div></section>
  <section id="certificaciones" class="section"><div class="container"><p class="eyebrow center">${esc(l.credentials)}</p><h2 class="section-title center">${esc(l.certifications)}</h2><div class="credentials-grid">${credentials}</div></div></section>
  <section id="contacto" class="section"><div class="container contact-box"><p class="eyebrow center">${esc(l.contact)}</p><h2 class="section-title center">${esc(l.contactTitle)}</h2><p class="contact-text">${esc(l.contactBody)}</p><div class="hero-actions contact-actions"><a class="btn btn-primary" href="${escUrl(`mailto:${site.email}`)}">${esc(site.email)}</a><a class="btn btn-ghost" href="${escUrl(site.github)}" rel="me noreferrer">${esc(l.github)}</a><a class="btn btn-ghost" href="${escUrl(cvHref)}" download>${esc(l.cv)}</a></div></div></section>
</main>
${footer(lang, assetPrefix)}`;
}

function gallerySection(project, lang, assetPrefix) {
  const l = labels[lang];
  if (!project.gallery?.length) {
    const firstLabel = project.slug.startsWith("n8n") ? "IMAP" : l.flowInput;
    return `<section class="section"><div class="container"><p class="eyebrow center">${esc(l.architecture)}</p><div class="case-flow"><article class="flow-step"><strong>1. ${esc(firstLabel)}</strong><span>${esc(l.flowInputBody)}</span></article><article class="flow-step"><strong>2. ${esc(l.flowDomain)}</strong><span>${esc(l.flowDomainBody)}</span></article><article class="flow-step"><strong>3. ${esc(l.flowOutput)}</strong><span>${esc(l.flowOutputBody)}</span></article></div></div></section>`;
  }
  const figures = project.gallery.map(([src, caption]) => `<figure><img src="${escUrl(`${assetPrefix}${src}`)}" alt="" loading="lazy"><figcaption>${esc(pick(caption, lang))}</figcaption></figure>`).join("");
  return `<section class="section"><div class="container"><p class="eyebrow center">${esc(l.evidence)}</p><h2 class="section-title center">${esc(l.productResults)}</h2><div class="case-gallery">${figures}</div></div></section>`;
}

function casePage(project, lang) {
  const l = labels[lang];
  const isEs = lang === "es";
  const assetPrefix = isEs ? "../../" : "../../../";
  // Las dos variantes de caso viven a dos niveles de su portada localizada.
  const homeHref = "../../index.html";
  const switchHref = isEs ? `../../en/projects/${project.slug}/index.html` : `../../../projects/${project.slug}/index.html`;
  const canonical = isEs ? `${site.baseUrl}/projects/${project.slug}/` : `${site.baseUrl}/en/projects/${project.slug}/`;
  const alternate = isEs ? `${site.baseUrl}/en/projects/${project.slug}/` : `${site.baseUrl}/projects/${project.slug}/`;
  const title = `${project.title} — ${l.caseStudy}`;
  const projectImage = project.gallery?.[0]?.[0] ? `${site.baseUrl}/${project.gallery[0][0]}` : undefined;
  const metrics = project.metrics.map(([value, label]) => `<div><strong>${esc(value)}</strong><span>${esc(pick(label, lang))}</span></div>`).join("");
  const repository = project.repoUrl ? `<a class="btn btn-primary" href="${escUrl(project.repoUrl)}" rel="noreferrer">${esc(l.code)} ↗</a>` : "";
  const downloads = project.downloads?.length ? `<div class="download-list">${project.downloads.map(([href, label]) => `<a class="btn btn-ghost" href="${escUrl(`${assetPrefix}${href}`)}" download>${esc(label)}</a>`).join("")}</div>` : "";

  return `${head({ lang, title, description: pick(project.summary, lang), canonical, alternate, assetPrefix, image: projectImage })}
${header(lang, homeHref, switchHref)}
<main id="contenido" class="case-study">
  <section class="case-hero container"><p class="eyebrow">${esc(project.tech.join(" · "))}</p><h1>${esc(project.title)}</h1><p class="case-lead">${esc(pick(project.summary, lang))}</p><div class="case-actions"><a class="btn btn-ghost" href="${escUrl(`${homeHref}#proyectos`)}">← ${esc(l.back)}</a>${repository}</div><div class="case-metrics">${metrics}</div></section>
  <section class="section alt"><div class="container case-copy"><article><p class="eyebrow">${esc(l.problem)}</p><h2>${esc(l.contextTitle)}</h2><p>${esc(pick(project.problem, lang))}</p></article><article><p class="eyebrow">${esc(l.solution)}</p><h2>${esc(l.approachTitle)}</h2><p>${esc(pick(project.solution, lang))}</p></article></div></section>
  ${gallerySection(project, lang, assetPrefix)}
  <section class="section alt"><div class="container case-note"><p class="eyebrow">${esc(l.quality)}</p><h2>${esc(l.verifiedScope)}</h2><p>${esc(pick(project.quality, lang))}</p>${downloads}</div></section>
</main>
${footer(lang, assetPrefix)}`;
}

function notFound() {
  const l = labels.es;
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <base href="${escUrl(`${site.baseUrl}/`)}">
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="robots" content="noindex">
  <title>404 — ${esc(l.notFoundTitle)}</title>
  <meta name="description" content="${esc(l.notFoundBody)}">
  <link rel="icon" href="favicon.svg" type="image/svg+xml">
  <link rel="stylesheet" href="assets/styles.css">
</head>
<body><main id="contenido" class="case-study"><section class="case-hero container"><p class="eyebrow">ERROR / 404</p><h1>${esc(l.notFoundTitle)}</h1><p class="case-lead">${esc(l.notFoundBody)}</p><div class="case-actions"><a class="btn btn-primary" href="./">${esc(l.notFoundHome)}</a><a class="btn btn-ghost" href="en/" lang="en">${esc(l.notFoundEnglish)}</a></div></section></main></body>
</html>`;
}

async function output(relative, content) {
  const path = join(dist, relative);
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, content, "utf8");
}

await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });
await cp(join(root, "public"), dist, { recursive: true });
await mkdir(join(dist, "assets"), { recursive: true });
await cp(join(root, "src", "styles.css"), join(dist, "assets", "styles.css"));
await cp(join(root, "src", "client.js"), join(dist, "assets", "client.js"));
await output("index.html", home("es"));
await output("en/index.html", home("en"));
for (const project of projects) {
  await output(`projects/${project.slug}/index.html`, casePage(project, "es"));
  await output(`en/projects/${project.slug}/index.html`, casePage(project, "en"));
}

const urls = [
  `${site.baseUrl}/`,
  `${site.baseUrl}/en/`,
  ...projects.flatMap((project) => [`${site.baseUrl}/projects/${project.slug}/`, `${site.baseUrl}/en/projects/${project.slug}/`]),
];
await output("sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((url) => `  <url><loc>${esc(url)}</loc></url>`).join("\n")}\n</urlset>\n`);
await output("robots.txt", `User-agent: *\nAllow: /\nSitemap: ${site.baseUrl}/sitemap.xml\n`);
await output("404.html", notFound());
console.log(`Built ${projects.length * 2 + 2} localized pages plus a dedicated 404 in dist/`);
