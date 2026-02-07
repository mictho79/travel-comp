// File: js/generate-pages.js
import fs from "fs";
import path from "path";

const countriesPath = "data/countries.en.json";
const assetsDir = "assets";
const stylesFile = "styles.css";
const jsDir = "js";
const dataDir = "data";

const outDir = "dist";

const countries = JSON.parse(fs.readFileSync(countriesPath, "utf8"));

// Clean dist
fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });

// Helpers
const escapeHtml = (s) =>
  String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const toAbsoluteAssetPath = (img) => {
  if (!img) return "/assets/pixel/placeholder.png";
  if (img.startsWith("./")) return img.slice(1); // "./assets/..." -> "/assets/..."
  if (!img.startsWith("/")) return "/" + img; // "assets/..." -> "/assets/..."
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

// Track urls for sitemap (relative locs for now)
const generatedUrls = [];

// --------------------
// 1) /countries/
// --------------------
const listItems = Object.entries(countries)
  .map(([slug, c]) => {
    const name = escapeHtml(c.name);
    return `<li>
      <a href="/country/${slug}/">${name}</a>
      — Backpacker: ${c.budgetPerDay.backpacker}/day
      — Comfort: ${c.budgetPerDay.comfort}/day
      — Luxury: ${c.budgetPerDay.luxury}/day
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

// --------------------
// 2) /country/:slug/
// --------------------
for (const [slug, c] of Object.entries(countries)) {
  const imgPath = toAbsoluteAssetPath(c.image);
  const notes = (c.notes || []).map((n) => `<li>${escapeHtml(n)}</li>`).join("");

  const page = layout({
    title: `${c.name} Travel Budget`,
    description: `Daily travel costs in ${c.name}: backpacker, comfort, luxury. Flight from Europe and tips.`,
    content: `
      <h1>${escapeHtml(c.name)}</h1>

      <img
        src="${escapeHtml(imgPath)}"
        alt="${escapeHtml(c.name)} pixel art"
        onerror="this.onerror=null;this.src='/assets/pixel/placeholder.png';"
        style="max-width:240px;height:auto;image-rendering:pixelated;border-radius:12px;"
      />

      <p><strong>Flight from Europe:</strong> ${c.flightFromEurope}</p>

      <h2>Budget per day</h2>
      <ul>
        <li>Backpacker: ${c.budgetPerDay.backpacker}</li>
        <li>Comfort: ${c.budgetPerDay.comfort}</li>
        <li>Luxury: ${c.budgetPerDay.luxury}</li>
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

// --------------------
// 3) Home page = COPY your real comparator (root index.html)
// --------------------
const mainIndexPath = "index.html";
if (!fs.existsSync(mainIndexPath)) {
  throw new Error("Missing root index.html (your comparator homepage).");
}

fs.copyFileSync(mainIndexPath, path.join(outDir, "index.html"));
generatedUrls.unshift("/");

// --------------------
// 4) robots.txt
// --------------------
const robotsTxt = `User-agent: *
Allow: /

Sitemap: /sitemap.xml
`;
fs.writeFileSync(path.join(outDir, "robots.txt"), robotsTxt);

// --------------------
// 5) sitemap.xml (relative URLs for now)
// --------------------
const sitemapXml =
  `<?xml version="1.0" encoding="UTF-8"?>\n` +
  `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  generatedUrls.map((u) => `  <url><loc>${escapeHtml(u)}</loc></url>`).join("\n") +
  `\n</urlset>\n`;

fs.writeFileSync(path.join(outDir, "sitemap.xml"), sitemapXml);

// --------------------
// 6) Copy static files: assets, styles, js, data
// --------------------
if (fs.existsSync(assetsDir)) {
  fs.cpSync(assetsDir, path.join(outDir, assetsDir), { recursive: true });
}

if (fs.existsSync(stylesFile)) {
  fs.copyFileSync(stylesFile, path.join(outDir, "styles.css"));
}

if (fs.existsSync(jsDir)) {
  fs.cpSync(jsDir, path.join(outDir, jsDir), { recursive: true });
}

if (fs.existsSync(dataDir)) {
  fs.cpSync(dataDir, path.join(outDir, dataDir), { recursive: true });
}

console.log("✅ Built dist/: comparator homepage + countries pages + country pages + robots + sitemap");
