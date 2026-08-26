import { access, readFile, readdir } from "node:fs/promises";
import { dirname, extname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { projects, site } from "../content/site.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "dist");
const errors = [];
const projectSlugs = projects.map((project) => project.slug).sort();
const localizedPages = [
  { relative: "index.html", lang: "es", canonical: `${site.baseUrl}/`, alternate: `${site.baseUrl}/en/` },
  { relative: "en/index.html", lang: "en", canonical: `${site.baseUrl}/en/`, alternate: `${site.baseUrl}/` },
  ...projects.flatMap((project) => [
    { relative: `projects/${project.slug}/index.html`, lang: "es", canonical: `${site.baseUrl}/projects/${project.slug}/`, alternate: `${site.baseUrl}/en/projects/${project.slug}/` },
    { relative: `en/projects/${project.slug}/index.html`, lang: "en", canonical: `${site.baseUrl}/en/projects/${project.slug}/`, alternate: `${site.baseUrl}/projects/${project.slug}/` },
  ]),
];
const textExtensions = new Set([".css", ".html", ".js", ".json", ".md", ".txt", ".xml"]);
const sensitivePatterns = [
  { label: "private filesystem path", pattern: /(?:C:\\Users\\|\/Users\/|\/home\/)[^\s\"'<>]+/i },
  { label: "OneDrive path", pattern: /OneDrive[\\/][^\s\"'<>]+/i },
  { label: "private key", pattern: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/ },
  { label: "GitHub token", pattern: /\bgh[oprsu]_[A-Za-z0-9_]{20,}\b/ },
  { label: "AWS access key", pattern: /\bAKIA[0-9A-Z]{16}\b/ },
  { label: "JWT-like secret", pattern: /\beyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\b/ },
];

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const absolute = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(absolute));
    else files.push(absolute);
  }
  return files;
}

async function read(relativePath) {
  try {
    return await readFile(join(dist, relativePath), "utf8");
  } catch (error) {
    errors.push(`${relativePath}: cannot read (${error.code || error.message})`);
    return null;
  }
}

async function validateLocalReferences(relativePath, html) {
  for (const match of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
    const ref = match[1].split(/[?#]/)[0];
    if (!ref || /^(https?:|mailto:|tel:)/.test(ref)) continue;
    const target = resolve(dirname(join(dist, relativePath)), ref);
    try {
      await access(target);
    } catch {
      errors.push(`${relativePath}: broken ${match[1]}`);
    }
  }
}

function validateImages(relativePath, html) {
  for (const match of html.matchAll(/<img\b[^>]*>/g)) {
    const tag = match[0];
    const alt = tag.match(/\balt="([^"]*)"/);
    if (!alt) {
      errors.push(`${relativePath}: image missing alt`);
      continue;
    }
    if (alt[1] === "") {
      const before = html.slice(0, match.index);
      const figureOpen = before.lastIndexOf("<figure");
      const figureClose = before.lastIndexOf("</figure>");
      const after = html.slice(match.index + tag.length);
      if (figureOpen <= figureClose || !after.slice(0, after.indexOf("</figure>")).includes("<figcaption>")) {
        errors.push(`${relativePath}: empty alt requires a figure with figcaption`);
      }
    }
  }
}

for (const page of localizedPages) {
  const html = await read(page.relative);
  if (html === null) continue;
  const required = ["<title>", 'name="description"', 'property="og:title"', 'name="twitter:card"', "<h1", 'aria-expanded="false"'];
  for (const token of required) if (!html.includes(token)) errors.push(`${page.relative}: missing ${token}`);

  const expectedDefault = page.lang === "es" ? page.canonical : page.alternate;
  const metadata = [
    `rel="canonical" href="${page.canonical}"`,
    `rel="alternate" hreflang="${page.lang}" href="${page.canonical}"`,
    `hreflang="${page.lang === "es" ? "en" : "es"}" href="${page.alternate}"`,
    `hreflang="x-default" href="${expectedDefault}"`,
  ];
  for (const token of metadata) if (!html.includes(token)) errors.push(`${page.relative}: metadata mismatch ${token}`);
  await validateLocalReferences(page.relative, html);
  validateImages(page.relative, html);
}

const notFound = await read("404.html");
if (notFound !== null) {
  if (!notFound.includes(`<base href="${site.baseUrl}/">`)) errors.push("404.html: missing absolute base URL");
  if (!notFound.includes('name="robots" content="noindex"')) errors.push("404.html: missing noindex");
  if (notFound.includes('rel="canonical"')) errors.push("404.html: must not canonicalize to another page");
  for (const file of ["favicon.svg", "assets/styles.css", "index.html", "en/index.html"]) {
    try { await access(join(dist, file)); } catch { errors.push(`404.html: missing target ${file}`); }
  }
}

for (const langPrefix of ["", "en/"]) {
  const entries = await readdir(join(dist, langPrefix, "projects"), { withFileTypes: true });
  const actual = entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort();
  if (actual.join("\n") !== projectSlugs.join("\n")) errors.push(`${langPrefix || "es/"}: project slugs differ (${actual.join(", ")})`);
}

const expectedSitemap = localizedPages.map((page) => page.canonical).sort();
const sitemap = await read("sitemap.xml");
if (sitemap !== null) {
  const actualSitemap = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]).sort();
  if (actualSitemap.join("\n") !== expectedSitemap.join("\n")) errors.push("sitemap.xml: URLs do not match generated pages");
  for (const url of actualSitemap) {
    const pathname = url.slice(site.baseUrl.length).replace(/^\//, "");
    const target = join(dist, pathname, "index.html");
    try { await access(target); } catch { errors.push(`sitemap.xml: missing page for ${url}`); }
  }
}

for (const file of await walk(dist)) {
  if (!textExtensions.has(extname(file).toLowerCase())) continue;
  const body = await readFile(file, "utf8");
  const fileName = relative(dist, file);
  for (const { label, pattern } of sensitivePatterns) if (pattern.test(body)) errors.push(`${fileName}: possible ${label}`);
  for (const match of body.matchAll(/PEGA_AQUI_TU_[A-Z_]+/g)) {
    if (!/^PEGA_AQUI_TU_(?:API_KEY|CHAT_ID)$/.test(match[0])) errors.push(`${fileName}: unexpected placeholder ${match[0]}`);
  }
}

if (errors.length) {
  console.error([...new Set(errors)].join("\n"));
  process.exit(1);
}
console.log(`PASS: ${localizedPages.length} localized pages + 404, ${projects.length} projects per language, links/images/sitemap/security valid.`);
