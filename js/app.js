// File: js/app.js
import { computeBudget, compareBudgets } from "./calc.js";

const els = {
  countryA: document.querySelector("#countryA"),
  countryB: document.querySelector("#countryB"),
  days: document.querySelector("#days"),
  daysValue: document.querySelector("#daysValue"),
  profile: document.querySelector("#profile"),
  includeFlight: document.querySelector("#includeFlight"),
  resultsCard: document.querySelector("#resultsCard"),

  imgA: document.querySelector("#imgA"),
  imgB: document.querySelector("#imgB"),

  nameA: document.querySelector("#nameA"),
  totalA: document.querySelector("#totalA"),
  perDayA: document.querySelector("#perDayA"),
  flightA: document.querySelector("#flightA"),

  nameB: document.querySelector("#nameB"),
  totalB: document.querySelector("#totalB"),
  perDayB: document.querySelector("#perDayB"),
  flightB: document.querySelector("#flightB"),

  compareBox: document.querySelector("#compareBox"),

  notesTitleA: document.querySelector("#notesTitleA"),
  notesTitleB: document.querySelector("#notesTitleB"),
  notesA: document.querySelector("#notesA"),
  notesB: document.querySelector("#notesB")
};

function money(n) {
  if (typeof n !== "number") return "—";
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0
  }).format(n);
}

function clearList(ul) {
  while (ul.firstChild) ul.removeChild(ul.firstChild);
}

function renderNotes(country, titleEl, listEl) {
  titleEl.textContent = country?.name ?? "";
  clearList(listEl);

  (country?.notes ?? []).forEach((line) => {
    const li = document.createElement("li");
    li.textContent = line;
    listEl.appendChild(li);
  });
}

let countries = {};

async function loadData() {
  const res = await fetch("./data/countries.en.json");
  countries = await res.json();

  const keys = Object.keys(countries);

  for (const key of keys) {
    els.countryA.add(new Option(countries[key].name, key));
    els.countryB.add(new Option(countries[key].name, key));
  }

  // defaults
  els.countryA.value = "thailand";
  els.countryB.value = "uae";

  update();
}

function update() {
  const days = Number(els.days.value);
  els.daysValue.textContent = String(days);

  const profile = els.profile.value;
  const includeFlight = els.includeFlight.checked;

  const aKey = els.countryA.value;
  const bKey = els.countryB.value;

  const aCountry = countries[aKey];
  const bCountry = countries[bKey];

  const a = computeBudget({ country: aCountry, days, profile, includeFlight });
  const b = computeBudget({ country: bCountry, days, profile, includeFlight });

  if (!a || !b) {
    els.resultsCard.hidden = true;
    return;
  }

  els.resultsCard.hidden = false;

  // images
  els.imgA.src = aCountry?.image || "";
  els.imgA.alt = aCountry?.name ? `${aCountry.name} pixel art` : "";
  els.imgB.src = bCountry?.image || "";
  els.imgB.alt = bCountry?.name ? `${bCountry.name} pixel art` : "";

  // numbers
  els.nameA.textContent = aCountry.name;
  els.totalA.textContent = money(a.total);
  els.perDayA.textContent = money(a.perDay);
  els.flightA.textContent = money(a.flight);

  els.nameB.textContent = bCountry.name;
  els.totalB.textContent = money(b.total);
  els.perDayB.textContent = money(b.perDay);
  els.flightB.textContent = money(b.flight);

  // comparison text
  const cmp = compareBudgets(a, b);
  const cheaperName = cmp.cheaper === "A" ? aCountry.name : bCountry.name;
  const expensiveName = cmp.moreExpensive === "A" ? aCountry.name : bCountry.name;

  const pct = cmp.diffPct == null ? "—" : `${cmp.diffPct.toFixed(0)}%`;

  els.compareBox.textContent =
    `${cheaperName} is cheaper. ${expensiveName} costs +${money(cmp.diffAbs)} (~${pct}) over ${days} days.`;

  // notes
  renderNotes(aCountry, els.notesTitleA, els.notesA);
  renderNotes(bCountry, els.notesTitleB, els.notesB);
}

["change", "input"].forEach((evt) => {
  els.countryA.addEventListener(evt, update);
  els.countryB.addEventListener(evt, update);
  els.days.addEventListener(evt, update);
  els.profile.addEventListener(evt, update);
  els.includeFlight.addEventListener(evt, update);
});

loadData().catch((e) => console.error("Data load failed:", e));
