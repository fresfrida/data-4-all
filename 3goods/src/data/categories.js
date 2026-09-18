/**
 * @typedef {import('./types.js').Category} Category
 */

/**
 * The four shared top-level categories. One category per item/need — no
 * second "matching need category" field (DECISIONS.md D-005). See D-012 for
 * why this is 4 categories with tags, not the map site's current 8.
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

/**
 * Need tags for each category.
 * @type {Record<string, {id: string, en: string, vi: string}[]>}
 */
export const NEED_TAGS_BY_CATEGORY = {
  Rice: [{ id: "rice", en: "Rice packs", vi: "Bao gạo 10-25kg" }],
  Clothes: [
    { id: "adult_clothes", en: "Adult clothing", vi: "Quần áo người lớn" },
    { id: "childrens_clothes", en: "Children's clothing", vi: "Quần áo trẻ em" },
  ],
  Books: [
    { id: "textbooks_stationery", en: "Textbooks & stationery", vi: "Sách giáo khoa & văn phòng phẩm" },
    { id: "childrens_books", en: "Story books", vi: "Sách truyện thiếu nhi" },
  ],
  "Household Items": [
    { id: "household_general", en: "General household items", vi: "Đồ gia dụng thông thường" },
    { id: "blankets_mats", en: "Blankets & mats", vi: "Chăn mền & chiếu" },
    { id: "cookware", en: "Cooking utensils", vi: "Dụng cụ nấu nướng" },
  ],
  "Non-Perishable Food": [
    { id: "non_perishable_food", en: "Canned food & noodles", vi: "Mì gói & đồ đóng hộp" },
    { id: "dry_provisions", en: "Dry rations", vi: "Lương khô & bánh mì" },
  ],
  "Hygiene Products": [
    { id: "hygiene_products", en: "Sanitary products & soap", vi: "Xà phòng & dung dịch vệ sinh" },
    { id: "water_tablets", en: "Water purification tablets", vi: "Viên lọc nước" },
  ],
  "Children Items": [
    { id: "baby_items", en: "Diapers & formula", vi: "Tã bỉm & sữa bột" },
    { id: "school_bags", en: "School bags", vi: "Cặp sách học sinh" },
  ],
  Miscellaneous: [
    { id: "misc_essentials", en: "Flashlights & batteries", vi: "Đèn pin, pin & đồ thiết yếu khác" },
  ],
};

export function getCategoryById(id) {
  return CATEGORIES.find((c) => c.id === id) ?? null;
}

export function getTagsForCategory(categoryId) {
  return NEED_TAGS_BY_CATEGORY[categoryId] ?? [];
}
