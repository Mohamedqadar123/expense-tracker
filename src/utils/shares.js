// Whole-number percentages for a set of amounts that always add up to 100.
// Rounding each share on its own can total 99 or 101, which reads as an
// error next to a chart; here every share is rounded down and the points
// left over go to the shares that lost the most by it. Returns all zeros
// when there is nothing to take a share of.
export function toWholePercents(amounts) {
  const total = amounts.reduce((sum, amount) => sum + amount, 0);
  if (total <= 0) return amounts.map(() => 0);

  const exact = amounts.map((amount) => (amount / total) * 100);
  const percents = exact.map(Math.floor);
  const leftover = 100 - percents.reduce((sum, percent) => sum + percent, 0);

  exact
    .map((value, index) => ({ index, lost: value - Math.floor(value) }))
    .sort((a, b) => b.lost - a.lost)
    .slice(0, leftover)
    .forEach(({ index }) => { percents[index] += 1; });

  return percents;
}

// A real but tiny share shows as "<1%" rather than a misleading "0%".
export function formatShare(percent, amount) {
  return percent === 0 && amount > 0 ? '<1%' : `${percent}%`;
}
