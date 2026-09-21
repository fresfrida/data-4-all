-- 3goods: provinces table (DECISIONS.md D-062). Run once in the Supabase SQL Editor.
-- Safe to re-run: every statement is idempotent. Runs as one transaction, so if any step fails nothing is changed.

begin;

-- 1. The table. `slug` is the stable area id the app stores in organisations.city and items.area;
--    `map_key` is the `province` value the map data uses (spaces removed, e.g. "HàTĩnh").
create table if not exists provinces (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  map_key text not null unique,
  name text not null,
  name_vi text not null,
  region text,
  created_at timestamptz default now()
);

alter table provinces enable row level security;
drop policy if exists "public read/write" on provinces;
create policy "public read/write" on provinces for all to anon, authenticated using (true) with check (true);

-- 2. The 63 provinces (names come from the map data; see src/data/provinces.js).
insert into provinces (slug, map_key, name, name_vi, region) values
  ('an-giang', 'AnGiang', 'An Giang', 'An Giang', 'Mekong River Delta'),
  ('ba-ria-vung-tau', 'BàRịa-VũngTàu', 'Ba Ria-Vung Tau', 'Bà Rịa-Vũng Tàu', 'South East'),
  ('bac-giang', 'BắcGiang', 'Bac Giang', 'Bắc Giang', 'Northern Midlands and Mountains'),
  ('bac-kan', 'BắcKạn', 'Bac Kan', 'Bắc Kạn', 'Northern Midlands and Mountains'),
  ('bac-lieu', 'BạcLiêu', 'Bac Lieu', 'Bạc Liêu', 'Mekong River Delta'),
  ('bac-ninh', 'BắcNinh', 'Bac Ninh', 'Bắc Ninh', 'Red River Delta'),
  ('ben-tre', 'BếnTre', 'Ben Tre', 'Bến Tre', 'Mekong River Delta'),
  ('binh-dinh', 'BìnhĐịnh', 'Binh Dinh', 'Bình Định', 'North Central and Central Coast'),
  ('binh-duong', 'BìnhDương', 'Binh Duong', 'Bình Dương', 'South East'),
  ('binh-phuoc', 'BìnhPhước', 'Binh Phuoc', 'Bình Phước', 'South East'),
  ('binh-thuan', 'BìnhThuận', 'Binh Thuan', 'Bình Thuận', 'North Central and Central Coast'),
  ('ca-mau', 'CàMau', 'Ca Mau', 'Cà Mau', 'Mekong River Delta'),
  ('can-tho', 'CầnThơ', 'Can Tho', 'Cần Thơ', 'Mekong River Delta'),
  ('cao-bang', 'CaoBằng', 'Cao Bang', 'Cao Bằng', 'Northern Midlands and Mountains'),
  ('da-nang', 'ĐàNẵng', 'Da Nang', 'Đà Nẵng', 'North Central and Central Coast'),
  ('dak-lak', 'ĐắkLắk', 'Dak Lak', 'Đắk Lắk', 'Central Highlands'),
  ('dak-nong', 'ĐắkNông', 'Dak Nong', 'Đắk Nông', 'Central Highlands'),
  ('dien-bien', 'ĐiệnBiên', 'Dien Bien', 'Điện Biên', 'Northern Midlands and Mountains'),
  ('dong-nai', 'ĐồngNai', 'Dong Nai', 'Đồng Nai', 'South East'),
  ('dong-thap', 'ĐồngTháp', 'Dong Thap', 'Đồng Tháp', 'Mekong River Delta'),
  ('gia-lai', 'GiaLai', 'Gia Lai', 'Gia Lai', 'Central Highlands'),
  ('ha-giang', 'HàGiang', 'Ha Giang', 'Hà Giang', 'Northern Midlands and Mountains'),
  ('ha-nam', 'HàNam', 'Ha Nam', 'Hà Nam', 'Red River Delta'),
  ('ha-tinh', 'HàTĩnh', 'Ha Tinh', 'Hà Tĩnh', 'North Central and Central Coast'),
  ('hai-duong', 'HảiDương', 'Hai Duong', 'Hải Dương', 'Red River Delta'),
  ('hai-phong', 'HảiPhòng', 'Hai Phong', 'Hải Phòng', 'Red River Delta'),
  ('hanoi', 'HàNội', 'Hanoi', 'Hà Nội', 'Red River Delta'),
  ('hau-giang', 'HậuGiang', 'Hau Giang', 'Hậu Giang', 'Mekong River Delta'),
  ('ho-chi-minh-city', 'HồChíMinh', 'Ho Chi Minh City', 'Hồ Chí Minh', 'South East'),
  ('hoa-binh', 'HoàBình', 'Hoa Binh', 'Hòa Bình', 'Northern Midlands and Mountains'),
  ('hung-yen', 'HưngYên', 'Hung Yen', 'Hưng Yên', 'Red River Delta'),
  ('khanh-hoa', 'KhánhHòa', 'Khanh Hoa', 'Khánh Hòa', 'North Central and Central Coast'),
  ('kien-giang', 'KiênGiang', 'Kien Giang', 'Kiên Giang', 'Mekong River Delta'),
  ('kon-tum', 'KonTum', 'Kon Tum', 'Kon Tum', 'Central Highlands'),
  ('lai-chau', 'LaiChâu', 'Lai Chau', 'Lai Châu', 'Northern Midlands and Mountains'),
  ('lam-dong', 'LâmĐồng', 'Lam Dong', 'Lâm Đồng', 'Central Highlands'),
  ('lang-son', 'LạngSơn', 'Lang Son', 'Lạng Sơn', 'Northern Midlands and Mountains'),
  ('lao-cai', 'LàoCai', 'Lao Cai', 'Lào Cai', 'Northern Midlands and Mountains'),
  ('long-an', 'LongAn', 'Long An', 'Long An', 'Mekong River Delta'),
  ('nam-dinh', 'NamĐịnh', 'Nam Dinh', 'Nam Định', 'Red River Delta'),
  ('nghe-an', 'NghệAn', 'Nghe An', 'Nghệ An', 'North Central and Central Coast'),
  ('ninh-binh', 'NinhBình', 'Ninh Binh', 'Ninh Bình', 'Red River Delta'),
  ('ninh-thuan', 'NinhThuận', 'Ninh Thuan', 'Ninh Thuận', 'North Central and Central Coast'),
  ('phu-tho', 'PhúThọ', 'Phu Tho', 'Phú Thọ', 'Northern Midlands and Mountains'),
  ('phu-yen', 'PhúYên', 'Phu Yen', 'Phú Yên', 'North Central and Central Coast'),
  ('quang-binh', 'QuảngBình', 'Quang Binh', 'Quảng Bình', 'North Central and Central Coast'),
  ('quang-nam', 'QuảngNam', 'Quang Nam', 'Quảng Nam', 'North Central and Central Coast'),
  ('quang-ngai', 'QuảngNgãi', 'Quang Ngai', 'Quảng Ngãi', 'North Central and Central Coast'),
  ('quang-ninh', 'QuảngNinh', 'Quang Ninh', 'Quảng Ninh', 'Red River Delta'),
  ('quang-tri', 'QuảngTrị', 'Quang Tri', 'Quảng Trị', 'North Central and Central Coast'),
  ('soc-trang', 'SócTrăng', 'Soc Trang', 'Sóc Trăng', 'Mekong River Delta'),
  ('son-la', 'SơnLa', 'Son La', 'Sơn La', 'Northern Midlands and Mountains'),
  ('tay-ninh', 'TâyNinh', 'Tay Ninh', 'Tây Ninh', 'South East'),
  ('thai-binh', 'TháiBình', 'Thai Binh', 'Thái Bình', 'Red River Delta'),
  ('thai-nguyen', 'TháiNguyên', 'Thai Nguyen', 'Thái Nguyên', 'Northern Midlands and Mountains'),
  ('thanh-hoa', 'ThanhHóa', 'Thanh Hoa', 'Thanh Hóa', 'North Central and Central Coast'),
  ('thua-thien-hue', 'ThừaThiênHuế', 'Thua Thien Hue', 'Thừa Thiên Huế', 'North Central and Central Coast'),
  ('tien-giang', 'TiềnGiang', 'Tien Giang', 'Tiền Giang', 'Mekong River Delta'),
  ('tra-vinh', 'TràVinh', 'Tra Vinh', 'Trà Vinh', 'Mekong River Delta'),
  ('tuyen-quang', 'TuyênQuang', 'Tuyen Quang', 'Tuyên Quang', 'Northern Midlands and Mountains'),
  ('vinh-long', 'VĩnhLong', 'Vinh Long', 'Vĩnh Long', 'Mekong River Delta'),
  ('vinh-phuc', 'VĩnhPhúc', 'Vinh Phuc', 'Vĩnh Phúc', 'Red River Delta'),
  ('yen-bai', 'YênBái', 'Yen Bai', 'Yên Bái', 'Northern Midlands and Mountains')
on conflict (slug) do update
  set map_key = excluded.map_key, name = excluded.name, name_vi = excluded.name_vi, region = excluded.region;

-- 3. Remap the 8 old area ids onto real provinces (existing organisations and items keep a correct location).
--    nhatrang -> khanh-hoa (Nha Trang is a city in Khánh Hòa); mekong was a whole region -> an-giang.
--    Rows already holding a province slug are left alone.
update organisations set city = case city
    when 'hcmc' then 'ho-chi-minh-city' when 'danang' then 'da-nang' when 'hue' then 'thua-thien-hue'
    when 'cantho' then 'can-tho' when 'haiphong' then 'hai-phong' when 'nhatrang' then 'khanh-hoa'
    when 'mekong' then 'an-giang' else city end
  where city in ('hcmc', 'danang', 'hue', 'cantho', 'haiphong', 'nhatrang', 'mekong');

update items set area = case area
    when 'hcmc' then 'ho-chi-minh-city' when 'danang' then 'da-nang' when 'hue' then 'thua-thien-hue'
    when 'cantho' then 'can-tho' when 'haiphong' then 'hai-phong' when 'nhatrang' then 'khanh-hoa'
    when 'mekong' then 'an-giang' else area end
  where area in ('hcmc', 'danang', 'hue', 'cantho', 'haiphong', 'nhatrang', 'mekong');
-- ("hanoi" is unchanged: it is also the province slug.)

-- 4. Needs cleanup (DECISIONS.md D-064): Books for Children Vietnam had two Books needs (100 books + 80 sets).
--    Merge them into one (180, priority kept), then count every quantified need in the one generic unit "items".
--    A need with no quantity stays as it is: that means "ongoing" (D-063).
update needs set quantity = 180, unit = 'items', priority = 'high' where id = 'ff019210-0f11-4161-9448-0a64d9987647';
delete from needs where id = 'f64f4d09-c08c-41e6-9f94-40607665845e';
update needs set unit = 'items' where quantity is not null;

-- 5. One need per organisation per category. Fails, and rolls everything back, if a duplicate still exists.
create unique index if not exists needs_one_per_org_category on needs (org_id, category_id);

commit;

-- Check afterwards (should return 63, then no rows):
--   select count(*) from provinces;
--   select city, count(*) from organisations where city not in (select slug from provinces) group by city;
--   select area, count(*) from items where area not in (select slug from provinces) group by area;
