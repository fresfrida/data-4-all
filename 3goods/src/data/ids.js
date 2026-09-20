/**
 * Fixed UUIDs for seed records.
 *
 * The live Supabase schema (see supabase/schema.sql) uses `uuid` primary
 * keys with a `gen_random_uuid()` default. Seed data needs *stable* ids of
 * its own instead of relying on that default — otherwise re-running
 * `scripts/seed-supabase.mjs` would insert a fresh duplicate row every time
 * instead of upserting on id. These were generated once with
 * `crypto.randomUUID()`; never regenerate an existing entry, only add new
 * ones for new seed records.
 */

export const ORG_IDS = {
  foodShare: "2d010a32-47ee-46e4-8208-f07c16475f1a",
  hanoiPantry: "f5d4aaf6-fb78-4018-95d7-be46b19582b5",
  booksChildren: "26133f3c-72e9-454c-bd62-854d7c0e3f3c",
  warmHomes: "12caed3c-ef9c-49fe-9bad-af4c8beb3944",
  careBridge: "5fa82684-2192-4c8b-aef8-55216d654233",
  haiphongRelief: "5cb92636-9bfb-4587-b836-be8e87eea513",
  nhatrangAid: "c5379361-db56-436c-b70d-e5a1ae3d88af",
  mekongNeighbours: "eb237e61-48bd-4ba0-a38f-5f285a5d93e7",
};

export const USER_IDS = {
  donorDemo: "67fd0458-52d3-4b1e-8723-ff9056d56b62",
  orgDemo: "af0804ac-cf8d-4ead-99fc-cdcbfaf90470",
  donor002: "bebf6781-883f-4aca-8c64-85f0c7bc1aa7",
  donor003: "9b27c92a-867c-47ed-a29c-95959c98a635",
  donor004: "90959bb8-0e65-4e68-a065-b25da2b81e2f",
  donor005: "bb261e64-f863-4117-811a-457442ffb79a",
  orgFoodShare: "9534c5df-19b0-4815-9578-0c12ba849e71",
  orgBooksChildren: "2a952f0e-981c-43e1-909a-7dcec7c49d44",
  orgWarmHomes: "8319b0fb-c339-49da-b022-e340c7ea7fdf",
  orgCareBridge: "a689ec08-005e-4035-ad32-27da28eeefb1",
  orgHaiphongRelief: "93709bd6-103f-429a-87d3-e04b88306702",
  orgNhatrangAid: "d3b6e854-c818-493f-8f17-e0b96b5f3485",
  orgMekongNeighbours: "d498fb5d-3461-464f-a059-203a0d3c5e61",
  donor006: "aef03c64-9ad7-4222-aa82-1f1114780605",
  donor007: "64b1a8fb-9951-4590-9de9-d3c6dce1ef64",
  donor008: "af695b74-df4c-4883-9776-2bd2f713ed65",
  donor009: "f9a7d8ea-7b1e-400c-a96e-bc3ab7c2f8de",
  donor010: "e9e4dcf4-6192-4c54-b4e5-d188784d6af5",
  donor011: "726a25f3-29fe-4224-b887-95a028ad0225",
  donor012: "750668e6-786c-46e9-974f-e36c5ecbf67f",
  donor013: "2afc47da-fd9c-4f19-aa01-92d73934688c",
  donor014: "80688f62-e85b-4ab8-a60e-e70c27522f0f",
  donor015: "c6f20225-038d-4850-a96f-9b457048d36d",
  donor016: "dbb19657-dff5-425b-b7b7-7503ed4f3860",
  donor017: "12a4efd4-8f3a-42d8-9d9f-f5202c8fa76d",
  donor018: "b8d25d0c-5be8-4c4d-9575-9ddbfe16d049",
  donor019: "2252e5fb-7c68-41fc-a636-22dc79e26d55",
  donor020: "8a838fbc-f5fd-4eb2-97c2-7dc4857365b9",
};

export const ITEM_IDS = {
  item001: "ed6ead6c-f667-4db3-8d0d-fd806a77ebab",
  item002: "a6d45b35-4db0-4375-94d7-071565ca6067",
  item003: "c52b90ee-7e2d-4c91-a472-2e64abdcb89b",
  item004: "03cf374d-11dd-427e-84b6-e5f1836bd9e1",
  item005: "34db0213-efe6-444e-b471-fb34d85559f4",
  item006: "d4a97222-f490-4d1e-b97b-3cb02da719e2",
  item007: "5e33288b-ee6d-4c4f-a3c2-bbaffd670243",
  item008: "9ee544d3-3b84-4b16-a788-3dc195ad862a",
  item009: "ed2971f7-61b7-4faa-8398-569e19ae2402",
  item010: "7653edf6-ccaf-4f8f-92bf-206dd9b8b1d4",
  item011: "a09e7f74-41bf-4fd9-84a5-0794d911cea6",
  item012: "a9185314-4253-4145-9f03-624c2c589486",
  item013: "3db55f46-960a-43c8-b33a-6622881baef3",
  item014: "914dcec3-1cf8-4352-8e15-319d91fb1d5f",
  item015: "d264aeb4-4b70-41ef-89b5-35c5b6d1a8ad",
  item016: "2bd92481-4ee2-434c-883a-f675045ea84a",
  item017: "2e1e4fe8-6ec9-4540-bc49-46e340b6d1ed",
  item018: "6b70c9f4-bf1e-4686-8034-3b99cca603b7",
};

export const NEED_IDS = {
  need001: "127caac9-4f40-4691-b4d9-ebeba51ece03",
  need002: "7fc659b9-3fbf-4172-a13f-18383313e570",
  need003: "e27eca88-2ee0-45ad-96cb-2253e69c71bc",
  need004: "3e1b63d5-2562-4c00-a8e3-f4718144c4a4",
  need005: "ff019210-0f11-4161-9448-0a64d9987647",
  need006: "f64f4d09-c08c-41e6-9f94-40607665845e",
  need007: "52c89b69-bde4-4509-9a98-74f1e7217294",
  need008: "74508d58-0091-4d41-8340-6c4ee3139688",
  need009: "82d53157-447b-4345-85da-47d8a016936e",
  need010: "b2fe6826-ba54-4853-bbd4-142c6fba47b4",
  need011: "9ab10d78-c7a8-45e2-8458-05e159205393",
  need012: "33b2b63b-6f87-48d5-a0cc-6d20223fd048",
  need013: "a28d044f-cf61-4bc0-81fd-5fdf2a4ee55a",
  need014: "819b49f5-5b7a-4150-ba7f-bd8905ef2c89",
  need015: "fb9c5510-2e33-42ec-82bb-6e01f114fd11",
  // need016/need017 already existed in the live table (added by hand during testing); adopted here with their live ids so a re-seed updates them instead of duplicating.
  need016: "c74050ae-2a37-4062-85ea-758f49021fa8",
  need017: "c310ec9e-1770-46fd-95ea-50e34bd85721",
  need018: "851e64cf-77fe-4c51-b47e-3f9ca73b5f6c",
  need019: "cc8e8ce4-d352-4bb1-a46f-72050e4285e3",
  need020: "75ee33b3-7d61-4d47-9f7a-53a741b213fd",
  need021: "164faba8-e9d0-4411-bfb8-8d8f4c9e1534",
  need022: "3f4892e5-fd68-48ee-bee2-4d87f976e7d7",
  need023: "1b2aa61a-4806-489b-b3b1-378a2552a57c",
  need024: "776c805f-486c-4726-938e-5967d3018072",
  need025: "dd4d2bf2-f54b-43a6-bda9-b7701e791239",
  need026: "657ddaa0-b784-48e7-9265-0c0075ee9806",
};

export const REQUEST_IDS = {
  request001: "07b8120d-e79f-416a-86d2-c7a9c8b86ef1",
  request002: "29d2195b-6f43-4d09-856a-34e1500265a7",
  request003: "5e1ebdb5-3fd4-4184-b442-cbb1a54e8b56",
};

export const CONVERSATION_IDS = {
  conversation001: "0e05dbf4-8200-4c4d-8d34-20988e98944b",
  conversation002: "08deb6c0-af0d-4e9d-b81a-68e277cda2ed",
  // conversation003 already existed live (created by an earlier accept); adopted with its live id so a re-seed updates it.
  conversation003: "71ac055f-774b-48ed-a323-c80f6b30d1a3",
};

export const MESSAGE_IDS = {
  message001: "1078100b-3ccc-4817-b5a5-5e964f5e9635",
  message002: "7ba5ce40-9424-451d-8d49-98f195ba845f",
  message003: "266ca8e6-d426-4354-a882-be156d81bc98",
};

export const UPDATE_IDS = {
  update001: "5f3ea9e6-f6d1-43da-89a7-efb31bfc77e2",
  update002: "ab9fb538-06a8-45a9-9370-fe5d0141b0a4",
  update003: "60831b29-bdac-401f-9e99-e33f1b0be4dd",
};
