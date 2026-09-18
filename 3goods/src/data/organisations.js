/**
 * @typedef {import('./types.js').Organisation} Organisation
 *
 * All organisations here are fictional demonstration data created for this
 * prototype — none are real Vietnamese charities. `isDemo: true` is surfaced
 * in the UI (OrganisationCard, OrganisationProfile), not just recorded here.
 */

/** @type {Organisation[]} */
export const ORGANISATIONS = [
  {
    id: "org-food-share",
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
    id: "org-hanoi-pantry",
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
    id: "org-books-children",
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
    id: "org-warm-homes",
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
    id: "org-care-bridge",
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
];

export function getOrganisationById(id) {
  return ORGANISATIONS.find((o) => o.id === id) ?? null;
}
