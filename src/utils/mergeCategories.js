export function mergeCategories(a, b) {
  const seen = new Map();
  for (const cat of [...a, ...b]) {
    const key = cat.toLowerCase();
    if (!seen.has(key)) seen.set(key, cat);
  }
  return [...seen.values()];
}
