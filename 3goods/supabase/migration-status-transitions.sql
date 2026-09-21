-- D-077: undoing an acceptance and marking goods collected are each ONE transaction, like accept_request (D-076).
-- Two functions, same conventions as accept_request: the item row is locked first (so concurrent actions on one item are
-- serialised), the rules are re-checked inside the lock, the error message IS the code the app turns into an AppError
-- (requestNotFound, itemForRequestNotFound, itemNotFound, itemStatusChangeInvalid), and repeating an action that already
-- happened changes nothing and returns "changed": false. Additive and safe to re-run (create or replace).
-- To remove: drop function undo_acceptance(uuid); drop function mark_item_collected(uuid);

-- Undo an acceptance while the goods are not collected yet: item -> available (pointer cleared), the accepted request ->
-- pending, and the requests that accepting it declined -> pending again (declined only ever comes from an acceptance).
create or replace function undo_acceptance(p_request_id uuid)
returns jsonb
language plpgsql
set search_path = public
as $$
declare
  v_item_id uuid;
  v_item items;
  v_request requests;
begin
  select item_id into v_item_id from requests where id = p_request_id;
  if not found then
    raise exception 'requestNotFound';
  end if;

  select * into v_item from items where id = v_item_id for update;
  if not found then
    raise exception 'itemForRequestNotFound';
  end if;

  select * into v_request from requests where id = p_request_id for update;

  if v_request.status is distinct from 'accepted' then
    return jsonb_build_object('changed', false, 'request', to_jsonb(v_request), 'item', to_jsonb(v_item));
  end if;
  -- Collected goods cannot be un-collected; and this request must be the one the item is actually reserved for.
  if v_item.status is distinct from 'reserved' or v_item.accepted_request_id is distinct from p_request_id then
    raise exception 'itemStatusChangeInvalid';
  end if;

  update items set status = 'available', accepted_request_id = null
    where id = v_item.id
    returning * into v_item;

  update requests set status = 'pending'
    where id = p_request_id
    returning * into v_request;

  update requests set status = 'pending'
    where item_id = v_item.id and status = 'declined';

  return jsonb_build_object('changed', true, 'request', to_jsonb(v_request), 'item', to_jsonb(v_item));
end;
$$;

-- The goods were handed over: item reserved -> collected (the accepted request stays accepted), and the item is added to
-- the accepted organisation's past-received list. Returns the accepted request so the app can notify the donor.
create or replace function mark_item_collected(p_item_id uuid)
returns jsonb
language plpgsql
set search_path = public
as $$
declare
  v_item items;
  v_request requests;
begin
  select * into v_item from items where id = p_item_id for update;
  if not found then
    raise exception 'itemNotFound';
  end if;

  select * into v_request from requests where id = v_item.accepted_request_id;

  if v_item.status = 'collected' then
    return jsonb_build_object('changed', false, 'item', to_jsonb(v_item), 'request', to_jsonb(v_request));
  end if;
  if v_item.status is distinct from 'reserved' then
    raise exception 'itemStatusChangeInvalid';
  end if;

  update items set status = 'collected'
    where id = v_item.id
    returning * into v_item;

  update organisations set past_received_item_ids = array_append(past_received_item_ids, v_item.id)
    where id = v_request.org_id and not (v_item.id = any (past_received_item_ids));

  return jsonb_build_object('changed', true, 'item', to_jsonb(v_item), 'request', to_jsonb(v_request));
end;
$$;
