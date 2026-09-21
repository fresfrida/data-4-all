-- D-075: a conversation only exists once its first message is sent.
-- start_conversation() finds or creates the (item, organisation, donor) thread and inserts the first message in ONE
-- transaction (a function body is atomic), so a conversation row can never exist without a message. Additive and safe
-- to re-run (create or replace). To remove: drop function start_conversation(uuid, uuid, uuid, uuid, text, text);

create or replace function start_conversation(
  p_item_id uuid,
  p_org_id uuid,
  p_donor_id uuid,
  p_sender_id uuid,
  p_sender_role text,
  p_body text
) returns jsonb
language plpgsql
set search_path = public
as $$
declare
  v_conversation conversations;
  v_message messages;
begin
  if p_body is null or btrim(p_body) = '' then
    raise exception 'message body required' using errcode = '22023';
  end if;

  -- Two people opening the same thread at once must not create two conversations.
  perform pg_advisory_xact_lock(hashtextextended(p_item_id::text || p_org_id::text || p_donor_id::text, 0));

  select * into v_conversation
    from conversations
    where item_id = p_item_id and org_id = p_org_id and donor_id = p_donor_id
    order by created_at
    limit 1;

  if not found then
    insert into conversations (item_id, org_id, donor_id)
      values (p_item_id, p_org_id, p_donor_id)
      returning * into v_conversation;
  end if;

  insert into messages (conversation_id, sender_id, sender_role, body, created_at)
    values (v_conversation.id, p_sender_id, p_sender_role, btrim(p_body), now())
    returning * into v_message;

  return jsonb_build_object('conversation', to_jsonb(v_conversation), 'message', to_jsonb(v_message));
end;
$$;
