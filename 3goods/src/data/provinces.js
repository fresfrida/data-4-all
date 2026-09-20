/**
 * The 63 Vietnamese provinces / centrally-run cities: the seed source for the live `provinces` table (DECISIONS.md D-062).
 * The app itself reads the table (referenceDataService.getAreas), never this file; only `npm run db:seed` and the SQL in
 * supabase/schema.sql use it.
 *
 * - slug     the stable "area id" stored in organisations.city and items.area, and used in the ?area= donate link
 * - mapKey   the `province` value in the map data (vn_provinces.geojson / the map API, spaces removed: "HàTĩnh")
 * - en / vi  display names (the map data only has the Vietnamese name; en is the same name without diacritics, except
 *            Hanoi and Ho Chi Minh City, which have common English forms)
 * - region   the map data's poverty_region for the province
 */
export const PROVINCES = [
  { slug: "an-giang", mapKey: "AnGiang", en: "An Giang", vi: "An Giang", region: "Mekong River Delta" },
  { slug: "ba-ria-vung-tau", mapKey: "BàRịa-VũngTàu", en: "Ba Ria-Vung Tau", vi: "Bà Rịa-Vũng Tàu", region: "South East" },
  { slug: "bac-giang", mapKey: "BắcGiang", en: "Bac Giang", vi: "Bắc Giang", region: "Northern Midlands and Mountains" },
  { slug: "bac-kan", mapKey: "BắcKạn", en: "Bac Kan", vi: "Bắc Kạn", region: "Northern Midlands and Mountains" },
  { slug: "bac-lieu", mapKey: "BạcLiêu", en: "Bac Lieu", vi: "Bạc Liêu", region: "Mekong River Delta" },
  { slug: "bac-ninh", mapKey: "BắcNinh", en: "Bac Ninh", vi: "Bắc Ninh", region: "Red River Delta" },
  { slug: "ben-tre", mapKey: "BếnTre", en: "Ben Tre", vi: "Bến Tre", region: "Mekong River Delta" },
  { slug: "binh-dinh", mapKey: "BìnhĐịnh", en: "Binh Dinh", vi: "Bình Định", region: "North Central and Central Coast" },
  { slug: "binh-duong", mapKey: "BìnhDương", en: "Binh Duong", vi: "Bình Dương", region: "South East" },
  { slug: "binh-phuoc", mapKey: "BìnhPhước", en: "Binh Phuoc", vi: "Bình Phước", region: "South East" },
  { slug: "binh-thuan", mapKey: "BìnhThuận", en: "Binh Thuan", vi: "Bình Thuận", region: "North Central and Central Coast" },
  { slug: "ca-mau", mapKey: "CàMau", en: "Ca Mau", vi: "Cà Mau", region: "Mekong River Delta" },
  { slug: "can-tho", mapKey: "CầnThơ", en: "Can Tho", vi: "Cần Thơ", region: "Mekong River Delta" },
  { slug: "cao-bang", mapKey: "CaoBằng", en: "Cao Bang", vi: "Cao Bằng", region: "Northern Midlands and Mountains" },
  { slug: "da-nang", mapKey: "ĐàNẵng", en: "Da Nang", vi: "Đà Nẵng", region: "North Central and Central Coast" },
  { slug: "dak-lak", mapKey: "ĐắkLắk", en: "Dak Lak", vi: "Đắk Lắk", region: "Central Highlands" },
  { slug: "dak-nong", mapKey: "ĐắkNông", en: "Dak Nong", vi: "Đắk Nông", region: "Central Highlands" },
  { slug: "dien-bien", mapKey: "ĐiệnBiên", en: "Dien Bien", vi: "Điện Biên", region: "Northern Midlands and Mountains" },
  { slug: "dong-nai", mapKey: "ĐồngNai", en: "Dong Nai", vi: "Đồng Nai", region: "South East" },
  { slug: "dong-thap", mapKey: "ĐồngTháp", en: "Dong Thap", vi: "Đồng Tháp", region: "Mekong River Delta" },
  { slug: "gia-lai", mapKey: "GiaLai", en: "Gia Lai", vi: "Gia Lai", region: "Central Highlands" },
  { slug: "ha-giang", mapKey: "HàGiang", en: "Ha Giang", vi: "Hà Giang", region: "Northern Midlands and Mountains" },
  { slug: "ha-nam", mapKey: "HàNam", en: "Ha Nam", vi: "Hà Nam", region: "Red River Delta" },
  { slug: "ha-tinh", mapKey: "HàTĩnh", en: "Ha Tinh", vi: "Hà Tĩnh", region: "North Central and Central Coast" },
  { slug: "hai-duong", mapKey: "HảiDương", en: "Hai Duong", vi: "Hải Dương", region: "Red River Delta" },
  { slug: "hai-phong", mapKey: "HảiPhòng", en: "Hai Phong", vi: "Hải Phòng", region: "Red River Delta" },
  { slug: "hanoi", mapKey: "HàNội", en: "Hanoi", vi: "Hà Nội", region: "Red River Delta" },
  { slug: "hau-giang", mapKey: "HậuGiang", en: "Hau Giang", vi: "Hậu Giang", region: "Mekong River Delta" },
  { slug: "ho-chi-minh-city", mapKey: "HồChíMinh", en: "Ho Chi Minh City", vi: "Hồ Chí Minh", region: "South East" },
  { slug: "hoa-binh", mapKey: "HoàBình", en: "Hoa Binh", vi: "Hòa Bình", region: "Northern Midlands and Mountains" },
  { slug: "hung-yen", mapKey: "HưngYên", en: "Hung Yen", vi: "Hưng Yên", region: "Red River Delta" },
  { slug: "khanh-hoa", mapKey: "KhánhHòa", en: "Khanh Hoa", vi: "Khánh Hòa", region: "North Central and Central Coast" },
  { slug: "kien-giang", mapKey: "KiênGiang", en: "Kien Giang", vi: "Kiên Giang", region: "Mekong River Delta" },
  { slug: "kon-tum", mapKey: "KonTum", en: "Kon Tum", vi: "Kon Tum", region: "Central Highlands" },
  { slug: "lai-chau", mapKey: "LaiChâu", en: "Lai Chau", vi: "Lai Châu", region: "Northern Midlands and Mountains" },
  { slug: "lam-dong", mapKey: "LâmĐồng", en: "Lam Dong", vi: "Lâm Đồng", region: "Central Highlands" },
  { slug: "lang-son", mapKey: "LạngSơn", en: "Lang Son", vi: "Lạng Sơn", region: "Northern Midlands and Mountains" },
  { slug: "lao-cai", mapKey: "LàoCai", en: "Lao Cai", vi: "Lào Cai", region: "Northern Midlands and Mountains" },
  { slug: "long-an", mapKey: "LongAn", en: "Long An", vi: "Long An", region: "Mekong River Delta" },
  { slug: "nam-dinh", mapKey: "NamĐịnh", en: "Nam Dinh", vi: "Nam Định", region: "Red River Delta" },
  { slug: "nghe-an", mapKey: "NghệAn", en: "Nghe An", vi: "Nghệ An", region: "North Central and Central Coast" },
  { slug: "ninh-binh", mapKey: "NinhBình", en: "Ninh Binh", vi: "Ninh Bình", region: "Red River Delta" },
  { slug: "ninh-thuan", mapKey: "NinhThuận", en: "Ninh Thuan", vi: "Ninh Thuận", region: "North Central and Central Coast" },
  { slug: "phu-tho", mapKey: "PhúThọ", en: "Phu Tho", vi: "Phú Thọ", region: "Northern Midlands and Mountains" },
  { slug: "phu-yen", mapKey: "PhúYên", en: "Phu Yen", vi: "Phú Yên", region: "North Central and Central Coast" },
  { slug: "quang-binh", mapKey: "QuảngBình", en: "Quang Binh", vi: "Quảng Bình", region: "North Central and Central Coast" },
  { slug: "quang-nam", mapKey: "QuảngNam", en: "Quang Nam", vi: "Quảng Nam", region: "North Central and Central Coast" },
  { slug: "quang-ngai", mapKey: "QuảngNgãi", en: "Quang Ngai", vi: "Quảng Ngãi", region: "North Central and Central Coast" },
  { slug: "quang-ninh", mapKey: "QuảngNinh", en: "Quang Ninh", vi: "Quảng Ninh", region: "Red River Delta" },
  { slug: "quang-tri", mapKey: "QuảngTrị", en: "Quang Tri", vi: "Quảng Trị", region: "North Central and Central Coast" },
  { slug: "soc-trang", mapKey: "SócTrăng", en: "Soc Trang", vi: "Sóc Trăng", region: "Mekong River Delta" },
  { slug: "son-la", mapKey: "SơnLa", en: "Son La", vi: "Sơn La", region: "Northern Midlands and Mountains" },
  { slug: "tay-ninh", mapKey: "TâyNinh", en: "Tay Ninh", vi: "Tây Ninh", region: "South East" },
  { slug: "thai-binh", mapKey: "TháiBình", en: "Thai Binh", vi: "Thái Bình", region: "Red River Delta" },
  { slug: "thai-nguyen", mapKey: "TháiNguyên", en: "Thai Nguyen", vi: "Thái Nguyên", region: "Northern Midlands and Mountains" },
  { slug: "thanh-hoa", mapKey: "ThanhHóa", en: "Thanh Hoa", vi: "Thanh Hóa", region: "North Central and Central Coast" },
  { slug: "thua-thien-hue", mapKey: "ThừaThiênHuế", en: "Thua Thien Hue", vi: "Thừa Thiên Huế", region: "North Central and Central Coast" },
  { slug: "tien-giang", mapKey: "TiềnGiang", en: "Tien Giang", vi: "Tiền Giang", region: "Mekong River Delta" },
  { slug: "tra-vinh", mapKey: "TràVinh", en: "Tra Vinh", vi: "Trà Vinh", region: "Mekong River Delta" },
  { slug: "tuyen-quang", mapKey: "TuyênQuang", en: "Tuyen Quang", vi: "Tuyên Quang", region: "Northern Midlands and Mountains" },
  { slug: "vinh-long", mapKey: "VĩnhLong", en: "Vinh Long", vi: "Vĩnh Long", region: "Mekong River Delta" },
  { slug: "vinh-phuc", mapKey: "VĩnhPhúc", en: "Vinh Phuc", vi: "Vĩnh Phúc", region: "Red River Delta" },
  { slug: "yen-bai", mapKey: "YênBái", en: "Yen Bai", vi: "Yên Bái", region: "Northern Midlands and Mountains" },
];

/**
 * The 8 area ids used before the provinces table existed (a hand-picked city/region list) and the province each one
 * stands for. Used once, to remap existing organisations/items in the live database (the same mapping is in the SQL).
 * "nhatrang" is a city inside Khánh Hòa; "mekong" was a whole region, so it stands for An Giang (a Mekong Delta province).
 */
export const LEGACY_AREA_TO_PROVINCE = {
  hanoi: "hanoi",
  hcmc: "ho-chi-minh-city",
  danang: "da-nang",
  hue: "thua-thien-hue",
  cantho: "can-tho",
  haiphong: "hai-phong",
  nhatrang: "khanh-hoa",
  mekong: "an-giang",
};
