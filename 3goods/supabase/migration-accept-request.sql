-- D-076: accepting a request is one transaction.
-- accept_request() reserves the item, marks the request accepted and declines every other pending request on the item in ONE
-- transaction (a function body is atomic), so a failure part-way can never leave the item reserved with siblings still pending.
-- It mirrors the rules that used to live in requestsService.acceptRequest and raises the same error codes (the message IS the
-- code: requestNotFound, itemForRequestNotFound, requestNotPending, itemAlreadyReserved), which the app turns into AppError.
-- The item row is locked first, so two people accepting different requests on the same item at once are serialised and the
-- second one gets itemAlreadyReserved. Accepting a request that is already accepted changes nothing ("changed": false).
-- Additive and safe to re-run (create or replace). To remove: drop function accept_request(uuid);

create or replace function accept_request(p_request_id uuid)
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

  if v_request.status = 'accepted' then
    return jsonb_build_object('changed', false, 'request', to_jsonb(v_request), 'item', to_jsonb(v_item));
  end if;
  if v_request.status is distinct from 'pending' then
    raise exception 'requestNotPending';
  end if;
  if v_item.status is distinct from 'available' then
    raise exception 'itemAlreadyReserved';
  end if;

  update items set status = 'reserved', accepted_request_id = p_request_id
    where id = v_item.id
    returning * into v_item;

  update requests set status = 'accepted'
    where id = p_request_id
    returning * into v_request;

  update requests set status = 'declined'
    where item_id = v_item.id and status = 'pending' and id <> p_request_id;

  return jsonb_build_object('changed', true, 'request', to_jsonb(v_request), 'item', to_jsonb(v_item));
end;
$$;
