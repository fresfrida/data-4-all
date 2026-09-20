/**
 * @typedef {import('./types.js').Organisation} Organisation
 *
 * All organisations here are fictional demonstration data created for this
 * prototype — none are real Vietnamese charities. `isDemo: true` is surfaced
 * in the UI (OrganisationCard, OrganisationProfile), not just recorded here.
 *
 * IDs are fixed UUIDs (see data/ids.js) matching the live Supabase schema's
 * `uuid` primary keys — not the DB's `gen_random_uuid()` default — so
 * seeding stays idempotent and other seed files can reference them.
 */

import { ORG_IDS } from "./ids.js";

/** @type {Organisation[]} */
export const ORGANISATIONS = [
  {
    id: ORG_IDS.foodShare,
    name: { en: "Vietnam Food Share", vi: "Chia Sẻ Thực Phẩm Việt Nam" },
    mission: {
      en: "Redistributing edible surplus food to families facing food insecurity.",
      vi: "Điều phối thực phẩm dư thừa còn dùng được đến các gia đình khó khăn về lương thực.",
    },
    areaId: "hcmc",
    verified: true,
    isDemo: true,
    pastReceivedItemIds: [],
  },
  {
    id: ORG_IDS.hanoiPantry,
    name: { en: "Hanoi Community Pantry", vi: "Kho Thực Phẩm Cộng Đồng Hà Nội" },
    mission: {
      en: "A neighbourhood pantry stocked entirely from local donations.",
      vi: "Kho thực phẩm khu phố hoạt động hoàn toàn nhờ đóng góp từ cộng đồng địa phương.",
    },
    areaId: "hanoi",
    verified: true,
    isDemo: true,
    pastReceivedItemIds: [],
  },
  {
    id: ORG_IDS.booksChildren,
    name: { en: "Books for Children Vietnam", vi: "Sách Cho Trẻ Em Việt Nam" },
    mission: {
      en: "Building small reading corners in under-resourced schools.",
      vi: "Xây dựng các góc đọc sách nhỏ cho các trường học còn thiếu nguồn lực.",
    },
    areaId: "hue",
    verified: true,
    isDemo: true,
    pastReceivedItemIds: [],
  },
  {
    id: ORG_IDS.warmHomes,
    name: { en: "Warm Homes Collective", vi: "Liên Minh Mái Ấm" },
    mission: {
      en: "Furnishing basic household items for families rebuilding after loss.",
      vi: "Cung cấp đồ gia dụng thiết yếu cho các gia đình đang gây dựng lại sau mất mát.",
    },
    areaId: "cantho",
    verified: false,
    isDemo: true,
    pastReceivedItemIds: [],
  },
  {
    id: ORG_IDS.careBridge,
    name: { en: "Care Bridge Da Nang", vi: "Cầu Nối Yêu Thương Đà Nẵng" },
    mission: {
      en: "Connecting new parents with essential baby and hygiene items.",
      vi: "Kết nối các gia đình có con nhỏ với đồ dùng thiết yếu cho trẻ và sản phẩm vệ sinh.",
    },
    areaId: "danang",
    verified: true,
    isDemo: true,
    pastReceivedItemIds: [],
  },
  {
    id: ORG_IDS.haiphongRelief,
    name: { en: "Hai Phong Harbour Relief", vi: "Cứu Trợ Cảng Hải Phòng" },
    mission: {
      en: "Delivering food and essentials to coastal families after storms.",
      vi: "Chuyển thực phẩm và nhu yếu phẩm đến các gia đình ven biển sau bão.",
    },
    areaId: "haiphong",
    verified: true,
    isDemo: true,
    pastReceivedItemIds: [],
  },
  {
    id: ORG_IDS.nhatrangAid,
    name: { en: "Nha Trang Seaside Aid", vi: "Hỗ Trợ Biển Nha Trang" },
    mission: {
      en: "Supporting fishing families with hygiene items, clothing and school supplies.",
      vi: "Hỗ trợ các gia đình làm nghề biển với đồ vệ sinh, quần áo và dụng cụ học tập.",
    },
    areaId: "nhatrang",
    verified: true,
    isDemo: true,
    pastReceivedItemIds: [],
  },
  {
    id: ORG_IDS.mekongNeighbours,
    name: { en: "Mekong Delta Neighbours", vi: "Láng Giềng Đồng Bằng Sông Cửu Long" },
    mission: {
      en: "Helping flood-prone Mekong households with blankets, clean water and clothing.",
      vi: "Giúp các hộ dân vùng ngập lũ miền Tây với chăn mền, nước sạch và quần áo.",
    },
    areaId: "mekong",
    verified: false,
    isDemo: true,
    pastReceivedItemIds: [],
  },
];

export function getOrganisationById(id) {
  return ORGANISATIONS.find((o) => o.id === id) ?? null;
}
