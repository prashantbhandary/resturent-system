// Resolves an appetizing photo for a menu item.
// Priority: admin-uploaded item.image → curated dish match → category fallback → null
// (null → the card renders a gradient + food-emoji placeholder, so a broken/offline
//  image URL never shows. NOTE: these are remote Unsplash URLs for the demo; on a
//  fully-offline Pi, dish photos should be uploaded and served locally.)

const U = (id) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=600&q=60`;

// Keyword → photo. First matching keyword in the dish name wins.
const DISH_PHOTOS = [
  ['margherita', U('1574071318508-1cdbab80d002')],
  ['pepperoni', U('1628840042765-356cda07504e')],
  ['pizza', U('1513104890138-7c749659a591')],
  ['butter chicken', U('1603894584373-5ac82b2ae398')],
  ['biryani', U('1563379091339-03b21ab4a4f8')],
  ['dal', U('1546833999-b9f581a1996d')],
  ['makhani', U('1546833999-b9f581a1996d')],
  ['paneer', U('1631452180519-c014fe946bc7')],
  ['tikka', U('1599487488170-d11ec9c172f0')],
  ['wings', U('1527477396000-e27163b481c2')],
  ['spring roll', U('1606333259737-3a3f3d3a3a3a')],
  ['roll', U('1548507200-47c5fdf5c1e8')],
  ['cola', U('1554866585-cd94860890b7')],
  ['soda', U('1621263764928-df1444c5e859')],
  ['lime', U('1621263764928-df1444c5e859')],
  ['chai', U('1597318181409-cf64d0b5d8a2')],
  ['tea', U('1597318181409-cf64d0b5d8a2')],
  ['gulab', U('1666190092159-3171cf0fbb12')],
  ['brownie', U('1606313564200-e75d5e30476c')],
  ['cake', U('1578985545062-69928b1d9587')],
];

// Category name (lowercased) → fallback photo.
const CATEGORY_PHOTOS = {
  starters: U('1541014741259-de529411b96a'),
  mains: U('1585937421612-70a008356fbe'),
  pizza: U('1513104890138-7c749659a591'),
  drinks: U('1437418747212-8d9709afab22'),
  desserts: U('1551024601-bec78aea704b'),
};

const FOOD_EMOJIS = [
  ['chicken', '🍗'], ['wings', '🍗'], ['biryani', '🍛'], ['paneer', '🧀'],
  ['tikka', '🍢'], ['roll', '🥗'], ['spring', '🥗'], ['dal', '🫘'],
  ['makhani', '🫘'], ['pizza', '🍕'], ['margherita', '🍕'], ['pepperoni', '🍕'],
  ['cola', '🥤'], ['soda', '🥤'], ['lime', '🍋'], ['chai', '☕'], ['tea', '☕'],
  ['gulab', '🍮'], ['brownie', '🍫'], ['cake', '🍰'], ['dessert', '🍰'],
];

const NON_VEG = [
  'chicken', 'mutton', 'fish', 'prawn', 'egg', 'pepperoni',
  'wings', 'meat', 'lamb', 'bacon', 'ham', 'beef',
];

export function getDishImage(item, categoryName) {
  if (item?.image) return item.image;
  const name = (item?.name || '').toLowerCase();
  for (const [kw, url] of DISH_PHOTOS) if (name.includes(kw)) return url;
  const cat = (categoryName || '').toLowerCase();
  return CATEGORY_PHOTOS[cat] || null;
}

export function getFoodEmoji(name = '') {
  const lower = name.toLowerCase();
  return FOOD_EMOJIS.find(([k]) => lower.includes(k))?.[1] ?? '🍽️';
}

export function isVegetarian(name = '') {
  const lower = name.toLowerCase();
  return !NON_VEG.some((k) => lower.includes(k));
}

export const CARD_GRADIENTS = [
  'from-orange-100 to-amber-50 dark:from-orange-950/40 dark:to-amber-950/20',
  'from-blue-100 to-cyan-50 dark:from-blue-950/40 dark:to-cyan-950/20',
  'from-emerald-100 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/20',
  'from-purple-100 to-violet-50 dark:from-purple-950/40 dark:to-violet-950/20',
  'from-pink-100 to-rose-50 dark:from-pink-950/40 dark:to-rose-950/20',
];
