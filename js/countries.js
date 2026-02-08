// File: js/countries.js
export async function loadCountries(lang) {
  const baseRes = await fetch("/data/countries.base.json");
  if (!baseRes.ok) throw new Error("Missing /data/countries.base.json");
  const base = await baseRes.json();

  const textRes = await fetch(`/data/countries.i18n.${lang}.json`);
  if (!textRes.ok) throw new Error(`Missing /data/countries.i18n.${lang}.json`);
  const text = await textRes.json();

  // merge
  const merged = {};
  for (const slug of Object.keys(base)) {
    merged[slug] = { ...base[slug], ...(text[slug] ?? { name: slug, notes: [] }) };
  }
  return merged;
}
