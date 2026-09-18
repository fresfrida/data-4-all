/**
 * @typedef {import('./types.js').Area} Area
 */

/** @type {Area[]} */
export const AREAS = [
  { id: "hanoi", en: "Hanoi", vi: "Hà Nội" },
  { id: "hcmc", en: "Ho Chi Minh City", vi: "Thành phố Hồ Chí Minh" },
  { id: "danang", en: "Da Nang", vi: "Đà Nẵng" },
  { id: "hue", en: "Hue", vi: "Huế" },
  { id: "cantho", en: "Can Tho", vi: "Cần Thơ" },
  { id: "haiphong", en: "Hai Phong", vi: "Hải Phòng" },
  { id: "nhatrang", en: "Nha Trang", vi: "Nha Trang" },
  { id: "mekong", en: "Mekong Delta", vi: "Đồng bằng sông Cửu Long" },
];

export function getAreaById(id) {
  return AREAS.find((a) => a.id === id) ?? null;
}
