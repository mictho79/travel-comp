export function computeBudget({ country, days, profile, includeFlight }) {
  if (!country) return null;

  const perDay = country.budgetPerDay?.[profile];
  if (typeof perDay !== "number") return null;

  const flight = includeFlight ? (country.flightFromEurope ?? 0) : 0;
  const total = (perDay * days) + flight;

  return { perDay, flight, total };
}

export function compareBudgets(a, b) {
  if (!a || !b) return null;

  const diff = b.total - a.total; // positive => B more expensive
  const diffAbs = Math.abs(diff);
  const diffPct = a.total > 0 ? (diffAbs / a.total) * 100 : null;

  return {
    diff,
    diffAbs,
    diffPct,
    cheaper: diff <= 0 ? "B" : "A",
    moreExpensive: diff <= 0 ? "A" : "B"
  };
}
