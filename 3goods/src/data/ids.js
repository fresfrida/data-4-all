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
};

export const USER_IDS = {
  donorDemo: "67fd0458-52d3-4b1e-8723-ff9056d56b62",
  orgDemo: "af0804ac-cf8d-4ead-99fc-cdcbfaf90470",
  donor002: "bebf6781-883f-4aca-8c64-85f0c7bc1aa7",
  donor003: "9b27c92a-867c-47ed-a29c-95959c98a635",
  donor004: "90959bb8-0e65-4e68-a065-b25da2b81e2f",
  donor005: "bb261e64-f863-4117-811a-457442ffb79a",
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
};

export const REQUEST_IDS = {
  request001: "07b8120d-e79f-416a-86d2-c7a9c8b86ef1",
  request002: "29d2195b-6f43-4d09-856a-34e1500265a7",
  request003: "5e1ebdb5-3fd4-4184-b442-cbb1a54e8b56",
};

export const CONVERSATION_IDS = {
  conversation001: "0e05dbf4-8200-4c4d-8d34-20988e98944b",
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
