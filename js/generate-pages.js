// File: js/generate-pages.js
import fs from "fs";
import path from "path";

const assetsDir = "assets";
const stylesFile = "styles.css";
const jsDir = "js";
const dataDir = "data";
const i18nDir = "i18n";

const SITE_URL = "https://travel-comp.pages.dev";
const outDir = "dist";

// --- load base + EN i18n (SEO pages in EN) ---
const base = JSON.parse(fs.readFileSync(path.join(dataDir, "countries.base.json"), "utf8"));
const en = JSON.parse(fs.readFileSync(path.join(dataDir, "countries.i18n.en.json"), "utf8"));

// merge (base first, then name/notes from i18n)
const countries = {};
for (const slug of Object.keys(base)) {
  countries[slug] = {
    ...base[slug],
    name: en?.[slug]?.name ?? slug,
    notes: en?.[slug]?.notes ?? [],
  };
}

// --- clean dist ---
fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });

// --- helpers ---
const escapeHtml = (s) =>
  String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const toAbsoluteAssetPath = (img) => {
  if (!img) return "/assets/pixel/placeholder.png";
  if (img.startsWith("./")) return img.slice(1); // "./assets/.." -> "/assets/.."
  if (!img.startsWith("/")) return "/" + img;
  return img;
};

function layout({ title, description, content }) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}" />
  <link rel="stylesheet" href="/styles.css" />
</head>
<body>
  <nav style="padding:12px 16px;">
    <a href="/">Compare</a> |
    <a href="/countries/">Countries</a>
  </nav>
  <main style="padding:0 16px 24px;">
    ${content}
  </main>
</body>
</html>`;
}

const generatedUrls = [];

// --- /countries/ (sorted by name) ---
const sorted = Object.entries(countries).sort((a, b) =>
  (a[1].name || a[0]).localeCompare(b[1].name || b[0])
);

const listItems = sorted
  .map(([slug, c]) => {
    const name = escapeHtml(c.name || slug);
    const b = c?.budgetPerDay ?? {};
    return `<li>
      <a href="/country/${escapeHtml(slug)}/">${name}</a>
      — Backpacker: ${escapeHtml(b.backpacker ?? "—")}/day
      — Comfort: ${escapeHtml(b.comfort ?? "—")}/day
      — Luxury: ${escapeHtml(b.luxury ?? "—")}/day
    </li>`;
  })
  .join("\n");

const countriesHtml = layout({
  title: "Travel Budgets by Country",
  description: "Compare daily travel budgets by country: backpacker, comfort, and luxury.",
  content: `<h1>Countries</h1><ul>${listItems}</ul>`,
});

fs.mkdirSync(path.join(outDir, "countries"), { recursive: true });
fs.writeFileSync(path.join(outDir, "countries", "index.html"), countriesHtml);
generatedUrls.push("/countries/");

// --- /country/:slug/ ---
for (const [slug, c] of Object.entries(countries)) {
  const name = c.name || slug;
  const imgPath = toAbsoluteAssetPath(c.image);
  const notes = (c.notes || []).map((n) => `<li>${escapeHtml(n)}</li>`).join("");

  const b = c?.budgetPerDay ?? {};

  const page = layout({
    title: `${name} Travel Budget`,
    description: `Daily travel costs in ${name}: backpacker, comfort, luxury. Flight from Europe and tips.`,
    content: `
      <h1>${escapeHtml(name)}</h1>

      <img
        src="${escapeHtml(imgPath)}"
        alt="${escapeHtml(name + " pixel art")}"
        onerror="this.onerror=null;this.src='/assets/pixel/placeholder.png';"
        style="max-width:240px;height:auto;image-rendering:pixelated;border-radius:12px;"
      />

      <p><strong>Flight from Europe:</strong> ${escapeHtml(c.flightFromEurope ?? "—")}</p>

      <h2>Budget per day</h2>
      <ul>
        <li>Backpacker: ${escapeHtml(b.backpacker ?? "—")}</li>
        <li>Comfort: ${escapeHtml(b.comfort ?? "—")}</li>
        <li>Luxury: ${escapeHtml(b.luxury ?? "—")}</li>
      </ul>

      <h2>Notes</h2>
      <ul>${notes}</ul>

      <p><a href="/countries/">← Back to list</a></p>
    `,
  });

  const dir = path.join(outDir, "country", slug);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "index.html"), page);
  generatedUrls.push(`/country/${slug}/`);
}

// --- Home ---
if (!fs.existsSync("index.html")) throw new Error("Missing root index.html");
fs.copyFileSync("index.html", path.join(outDir, "index.html"));
generatedUrls.unshift("/");

// --- robots + sitemap ---
fs.writeFileSync(
  path.join(outDir, "robots.txt"),
  `User-agent: *
Allow: /

Sitemap: ${SITE_URL}/sitemap.xml
`
);

const sitemapXml =
  `<?xml version="1.0" encoding="UTF-8"?>\n` +
  `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  generatedUrls.map((u) => `  <url><loc>${escapeHtml(SITE_URL + u)}</loc></url>`).join("\n") +
  `\n</urlset>\n`;

fs.writeFileSync(path.join(outDir, "sitemap.xml"), sitemapXml);

// --- Copy static ---
if (fs.existsSync(assetsDir)) fs.cpSync(assetsDir, path.join(outDir, assetsDir), { recursive: true });
if (fs.existsSync(stylesFile)) fs.copyFileSync(stylesFile, path.join(outDir, "styles.css"));
if (fs.existsSync(jsDir)) fs.cpSync(jsDir, path.join(outDir, jsDir), { recursive: true });
if (fs.existsSync(dataDir)) fs.cpSync(dataDir, path.join(outDir, dataDir), { recursive: true });
if (fs.existsSync(i18nDir)) fs.cpSync(i18nDir, path.join(outDir, i18nDir), { recursive: true });

console.log("✅ Built dist/: comparator + pages + robots + sitemap + i18n");
