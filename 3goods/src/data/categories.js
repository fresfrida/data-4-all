/**
 * @typedef {import('./types.js').Category} Category
 */

/**
 * The shared top-level categories. A need or item is just a category (an item
 * may add one optional second category, D-047); the old per-category "tags"
 * were removed in D-059.
 */
export const CATEGORIES = [
  { id: "Rice", en: "Rice", vi: "Gạo" },
  { id: "Clothes", en: "Clothes", vi: "Quần áo" },
  { id: "Books", en: "Books", vi: "Sách & VPP" },
  { id: "Household Items", en: "Household Items", vi: "Đồ gia dụng" },
  { id: "Non-Perishable Food", en: "Non-Perishable Food", vi: "Thực phẩm khô" },
  { id: "Hygiene Products", en: "Hygiene Products", vi: "Sản phẩm vệ sinh" },
  { id: "Children Items", en: "Children Items", vi: "Đồ trẻ em" },
  { id: "Miscellaneous", en: "Miscellaneous", vi: "Nhu yếu phẩm khác" },
];

export function getCategoryById(id) {
  return CATEGORIES.find((c) => c.id === id) ?? null;
}
