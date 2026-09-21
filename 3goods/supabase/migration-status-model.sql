-- D-075: one status per thing.
--   items.status:    available -> reserved -> collected   (+ unavailable = donor withdrew the listing)
--   requests.status: pending | accepted | declined
-- Both columns are plain text (no constraint), so this is a data migration only, no schema change. Run once, in this
-- order, inside one transaction. Safe to re-run: after the first run no old value is left for it to match.

begin;

-- 1. Reserved items whose accepted request had already been marked completed were really collected.
update items set status = 'collected'
  where status = 'reserved'
    and accepted_request_id in (select id from requests where status = 'completed');

-- 2. Requests still waiting on an item that another request holds (reserved or collected) were only *displayed* as
--    unavailable. Decline them for real. (Must run before step 4 renames 'requested'.)
update requests set status = 'declined'
  where status = 'requested'
    and item_id in (select id from items where status in ('reserved', 'collected') and accepted_request_id is not null)
    and id not in (select accepted_request_id from items where accepted_request_id is not null);

-- 3. The chosen request just stays accepted; handover progress now lives on the item.
update requests set status = 'accepted' where status in ('arranging_collection', 'completed');

-- 4. Waiting requests.
update requests set status = 'pending' where status = 'requested';

-- 4b. The column default still said 'requested' (the app always writes the status explicitly, this just keeps it honest).
alter table requests alter column status set default 'pending';

-- 5. An item that is not reserved or collected must not point at an accepted request (a stale pointer from an
--    earlier undo left one on an available item).
update items set accepted_request_id = null where status in ('available', 'unavailable');

-- 6. Conversations that never got a message are empty shells from the old "conversation on request" behaviour (D-058).
--    Under D-075 a conversation exists only once someone has sent something, so remove the ones with no messages at all.
delete from conversations c where not exists (select 1 from messages m where m.conversation_id = c.id);

commit;
