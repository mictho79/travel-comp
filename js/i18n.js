// File: js/i18n.js
const SUPPORTED = ["en", "fr", "es", "pt"];

function normalizeLang(raw) {
  const base = String(raw || "en").toLowerCase().split("-")[0];
  return SUPPORTED.includes(base) ? base : "en";
}

export function detectLang() {
  const saved = localStorage.getItem("lang");
  if (saved) return normalizeLang(saved);
  return normalizeLang(navigator.language);
}

export function setLang(lang) {
  const n = normalizeLang(lang);
  localStorage.setItem("lang", n);
  document.documentElement.lang = n;
  return n;
}

export async function loadDict(lang) {
  // NOTE: on charge les JSON (pas le JS)
  const res = await fetch(`/i18n/${lang}.json`);
  if (!res.ok) throw new Error(`Missing i18n file for ${lang}: /i18n/${lang}.json`);
  return res.json();
}

export function applyI18n(dict) {
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (dict[key] != null) el.textContent = dict[key];
  });
}

export function formatTemplate(str, vars) {
  return String(str).replace(/\{(\w+)\}/g, (_, k) => (vars?.[k] ?? `{${k}}`));
}
