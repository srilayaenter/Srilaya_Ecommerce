// Pure logic functions for SriLaYa Green Ops.
// Loaded as a <script> in index.html (browser globals) and imported via
// require() in Vitest unit tests.

function greenOpsFilteredItems(items, selectedCategory, searchQuery) {
  const q = (searchQuery || '').toLowerCase();
  return items.filter(item => {
    const matchesCat = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesSearch = !q ||
      item.name.toLowerCase().includes(q) ||
      (item.details || '').toLowerCase().includes(q);
    return matchesCat && matchesSearch;
  });
}

function greenOpsDisplayName(item, lang) {
  return lang === 'ta' && item.nameTa ? item.nameTa : item.name;
}

function greenOpsDisplayDetails(item, lang) {
  return lang === 'ta' && item.detailsTa ? item.detailsTa : item.details;
}

function greenOpsDisplaySteps(item, lang) {
  return lang === 'ta' && item.stepsTa && item.stepsTa.length
    ? item.stepsTa
    : (item.steps || []);
}

function greenOpsCategoryLabel(category, lang) {
  if (lang !== 'ta') return category;
  const map = {
    'Wellness':     'நலம் & வாய் பராமரிப்பு',
    'Hair Care':    'முடி பராமரிப்பு',
    'Skincare':     'சருமம் & குளியல்',
    'Household':    'வீட்டு & சுத்தம்',
    'Lye-Free':     'லை-ஃப்ரீ சோப்',
    'Cold Process': 'கோல்ட் ப்ராசஸ்',
  };
  return map[category] || category;
}

function greenOpsCategoryBadgeClass(category) {
  switch (category) {
    case 'Wellness':     return 'bg-purple-100 text-purple-800';
    case 'Hair Care':    return 'bg-rose-100 text-rose-800';
    case 'Skincare':     return 'bg-blue-100 text-blue-800';
    case 'Household':    return 'bg-amber-100 text-amber-800';
    case 'Lye-Free':     return 'bg-teal-100 text-teal-800';
    case 'Cold Process': return 'bg-orange-100 text-orange-800';
    default:             return 'bg-slate-100 text-slate-800';
  }
}

// Returns per-ingredient scaled amounts for a given target batch yield (kg).
// grams = Math.round(ratio * targetYield * 1000 * 10) / 10
function greenOpsScaleBatch(baseRatios, targetYieldKg) {
  const totalGrams = targetYieldKg * 1000;
  return baseRatios.map(ing => ({
    name: ing.name,
    nameTa: ing.nameTa || ing.name,
    ratio: ing.ratio,
    grams: Math.round(totalGrams * ing.ratio * 10) / 10,
  }));
}

// Normalises free-form ingredient rows (name + parts) into baseRatios (name + ratio).
function greenOpsBuildBaseRatios(ingredients) {
  const valid = ingredients.filter(i => i.name && i.parts);
  const total = valid.reduce((sum, i) => sum + Number(i.parts), 0);
  if (!total) return [];
  return valid.map(i => ({ name: i.name, ratio: Number(i.parts) / total }));
}

// Node / Vitest
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    greenOpsFilteredItems,
    greenOpsDisplayName,
    greenOpsDisplayDetails,
    greenOpsDisplaySteps,
    greenOpsCategoryLabel,
    greenOpsCategoryBadgeClass,
    greenOpsScaleBatch,
    greenOpsBuildBaseRatios,
  };
}
