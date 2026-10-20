-- Fresh project-owned Supabase database only. Do not apply to the imported project.
create table if not exists public.organizers(id uuid primary key default gen_random_uuid(),user_id uuid not null unique references auth.users(id),name text not null default 'Organizer',slug text not null unique);
create table if not exists public.events(
 id uuid primary key,organizer_id uuid not null references public.organizers(id),title text not null check(length(title) between 1 and 200),description text not null check(length(description) between 1 and 4000),event_type text not null check(event_type in('one_time','recurring')),venue text not null,timezone text not null,content jsonb not null check(octet_length(content::text)<=32000),is_published boolean not null default false,created_at timestamptz not null default now(),updated_at timestamptz not null default now());
create table if not exists public.ticket_tiers(id uuid primary key,event_id uuid not null references public.events(id) on delete cascade,name text not null check(length(name) between 1 and 100),description text not null default '' check(length(description)<=1000),price numeric(12,2) not null check(price between 0 and 100000),currency text not null default 'USD' check(currency='USD'),quantity integer not null check(quantity between 1 and 1000000),sold integer not null default 0 check(sold>=0 and sold<=quantity),sort_order integer not null default 0);
create table if not exists public.event_occurrences(event_id uuid not null references public.events(id) on delete cascade,local_start timestamp not null,timezone text not null,starts_at timestamptz not null,ends_at timestamptz not null check(ends_at>starts_at),primary key(event_id,local_start));
alter table public.organizers enable row level security;
alter table public.events enable row level security;
alter table public.ticket_tiers enable row level security;
alter table public.event_occurrences enable row level security;
revoke all on public.organizers,public.events,public.ticket_tiers,public.event_occurrences from public,anon,authenticated;
grant select on public.organizers,public.events,public.ticket_tiers,public.event_occurrences to authenticated;
drop policy if exists organizer_owner_read on public.organizers;
create policy organizer_owner_read on public.organizers for select to authenticated using(user_id=(select auth.uid()));
drop policy if exists event_owner_read on public.events;
create policy event_owner_read on public.events for select to authenticated using(organizer_id in(select id from public.organizers where user_id=(select auth.uid())));
drop policy if exists tier_owner_read on public.ticket_tiers;
create policy tier_owner_read on public.ticket_tiers for select to authenticated using(event_id in(select id from public.events));
drop policy if exists occurrence_owner_read on public.event_occurrences;
create policy occurrence_owner_read on public.event_occurrences for select to authenticated using(event_id in(select id from public.events));

create or replace function public.publish_event_draft(event_id uuid,event_draft jsonb,event_owner uuid)
returns uuid language plpgsql security definer set search_path=public as $$
#variable_conflict use_variable
declare
 org uuid; owner_of_event uuid; tiers jsonb; tier jsonb; tier_ids uuid[]='{}'; tier_id uuid;
 s jsonb; local_value text; local_values text[]='{}'; day_value date; first_day date; last_day date;
 local_start_value timestamp; utc_start timestamptz; zone text; duration_value integer; tier_index integer=0;
 total_quantity bigint=0; raw_quantity text; raw_price text;
begin
 if event_id is null or event_owner is null or jsonb_typeof(event_draft) is distinct from 'object' or octet_length(event_draft::text)>32000 then raise exception 'Invalid event draft.'; end if;
 if not exists(select 1 from auth.users where id=event_owner) then raise exception 'Log in before publishing.'; end if;
 perform pg_advisory_xact_lock(hashtextextended(event_id::text,0));
 select o.user_id into owner_of_event from public.events e join public.organizers o on o.id=e.organizer_id where e.id=event_id;
 if owner_of_event is not null and owner_of_event<>event_owner then raise exception 'This event belongs to another organizer.' using errcode='42501'; end if;
 if coalesce(length(btrim(event_draft->>'title')),0) not between 1 and 200 or coalesce(length(btrim(event_draft->>'description')),0) not between 1 and 4000 or coalesce(length(btrim(event_draft->>'location')),0) not between 1 and 200 or coalesce(event_draft->>'type','') not in('event','activity') then raise exception 'Complete the event details.'; end if;
 zone=event_draft->>'timezone';
 if zone is null or zone not in('America/New_York','America/Detroit','America/Kentucky/Louisville','America/Kentucky/Monticello','America/Indiana/Indianapolis','America/Indiana/Vincennes','America/Indiana/Winamac','America/Indiana/Marengo','America/Indiana/Petersburg','America/Indiana/Vevay','America/Chicago','America/Indiana/Tell_City','America/Indiana/Knox','America/Menominee','America/North_Dakota/Center','America/North_Dakota/New_Salem','America/North_Dakota/Beulah','America/Denver','America/Boise','America/Phoenix','America/Los_Angeles','America/Anchorage','America/Juneau','America/Sitka','America/Metlakatla','America/Yakutat','America/Nome','America/Adak','Pacific/Honolulu') then raise exception 'Choose a United States time zone.'; end if;
 if coalesce(event_draft->>'duration','') !~ '^\d{1,4}$' then raise exception 'Check the event duration.'; end if;
 duration_value=(event_draft->>'duration')::integer;
 if duration_value not between 5 and 1440 then raise exception 'Check the event duration.'; end if;
 s=event_draft->'schedule';
 if coalesce(s->>'kind','')='dates' then
  if jsonb_typeof(s->'dates') is distinct from 'array' or jsonb_array_length(s->'dates') not between 1 and 50 then raise exception 'Add between one and fifty event dates.'; end if;
  select array_agg(distinct value order by value) into local_values from jsonb_array_elements_text(s->'dates');
 elsif coalesce(s->>'kind','')='weekly' and event_draft->>'type'='activity' then
  if coalesce(s->>'start','') !~ '^\d{4}-\d{2}-\d{2}$' or coalesce(s->>'until','') !~ '^\d{4}-\d{2}-\d{2}$' or coalesce(s->>'time','') !~ '^([01]\d|2[0-3]):[0-5]\d$' or jsonb_typeof(s->'weekdays') is distinct from 'array' or jsonb_array_length(s->'weekdays') not between 1 and 7 then raise exception 'Complete the repeating schedule.'; end if;
  if exists(select 1 from jsonb_array_elements_text(s->'weekdays') w(value) where value !~ '^[0-6]$') then raise exception 'Check the repeat days.'; end if;
  first_day=(s->>'start')::date;last_day=(s->>'until')::date;
  if last_day<first_day or last_day-first_day>365 then raise exception 'Use a repeating range of at most 366 days.'; end if;
  for day_value in select first_day+n from generate_series(0,last_day-first_day) n loop
   if s->'weekdays' @> to_jsonb(array[extract(dow from day_value)::integer]) then local_values=array_append(local_values,day_value::text||'T'||(s->>'time')); end if;
  end loop;
 else raise exception 'Choose individual dates or an activity repeat schedule.'; end if;
 if coalesce(array_length(local_values,1),0) not between 1 and 366 then raise exception 'Choose between one and 366 occurrences.'; end if;
 tiers=coalesce(event_draft->'ticketTiers','[]'::jsonb);
 if jsonb_typeof(tiers)<>'array' or jsonb_array_length(tiers)>10 then raise exception 'Use at most ten ticket types.'; end if;
 if jsonb_array_length(tiers)=0 then tiers=jsonb_build_array(jsonb_build_object('id',md5(event_id::text||':general-admission')::uuid,'name','General admission','description','','price',event_draft->>'price','quantity',event_draft->>'capacity')); end if;
 insert into public.organizers(user_id,name,slug) values(event_owner,'Organizer',event_owner::text) on conflict(user_id) do nothing;
 select id into org from public.organizers where user_id=event_owner;
 insert into public.events as e(id,organizer_id,title,description,event_type,venue,timezone,content,is_published)
 values(event_id,org,btrim(event_draft->>'title'),btrim(event_draft->>'description'),case when s->>'kind'='weekly' then 'recurring' else 'one_time' end,btrim(event_draft->>'location'),zone,event_draft,true)
 on conflict(id) do update set title=excluded.title,description=excluded.description,event_type=excluded.event_type,venue=excluded.venue,timezone=excluded.timezone,content=excluded.content,is_published=true,updated_at=now();
 for tier in select value from jsonb_array_elements(tiers) loop
  if coalesce(tier->>'id','') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' or coalesce(length(btrim(tier->>'name')),0) not between 1 and 100 or coalesce(length(tier->>'description'),0)>1000 then raise exception 'Check each ticket type.'; end if;
  tier_id=(tier->>'id')::uuid;
  if tier_id=any(tier_ids) then raise exception 'Use a unique ticket type identifier.'; end if;
  tier_ids=array_append(tier_ids,tier_id);raw_price=tier->>'price';raw_quantity=tier->>'quantity';
  if coalesce(raw_price,'') !~ '^\d{1,6}(\.\d{1,2})?$' or coalesce(raw_quantity,'') !~ '^\d{1,7}$' then raise exception 'Check each ticket price and quantity.'; end if;
  if raw_price::numeric>100000 or raw_quantity::integer not between 1 and 1000000 then raise exception 'Check each ticket price and quantity.'; end if;
  total_quantity=total_quantity+raw_quantity::integer;
  if total_quantity>1000000 then raise exception 'Total ticket quantity must not exceed one million.'; end if;
  if exists(select 1 from public.ticket_tiers t where t.id=tier_id and t.event_id<>publish_event_draft.event_id) then raise exception 'This ticket type belongs to another event.'; end if;
  insert into public.ticket_tiers as t(id,event_id,name,description,price,quantity,sort_order) values(tier_id,event_id,btrim(tier->>'name'),coalesce(tier->>'description',''),raw_price::numeric,raw_quantity::integer,tier_index)
  on conflict(id) do update set name=excluded.name,description=excluded.description,price=excluded.price,quantity=excluded.quantity,sort_order=excluded.sort_order where t.event_id=publish_event_draft.event_id;
  if not found then raise exception 'This ticket type belongs to another event.'; end if;
  tier_index=tier_index+1;
 end loop;
 if exists(select 1 from public.ticket_tiers t where t.event_id=publish_event_draft.event_id and not(t.id=any(tier_ids)) and t.sold>0) then raise exception 'A sold ticket type cannot be removed.'; end if;
 delete from public.ticket_tiers t where t.event_id=publish_event_draft.event_id and not(t.id=any(tier_ids));
 delete from public.event_occurrences o where o.event_id=publish_event_draft.event_id;
 foreach local_value in array local_values loop
  if local_value !~ '^\d{4}-\d{2}-\d{2}T([01]\d|2[0-3]):[0-5]\d$' then raise exception 'Check each event date.'; end if;
  local_start_value=local_value::timestamp;utc_start=local_start_value at time zone zone;
  if utc_start at time zone zone<>local_start_value then raise exception 'This local time does not exist because the clocks change. Choose another time.'; end if;
  if (utc_start-interval '1 hour') at time zone zone=local_start_value or (utc_start+interval '1 hour') at time zone zone=local_start_value then raise exception 'This local time occurs twice because the clocks change. Choose another time.'; end if;
  insert into public.event_occurrences(event_id,local_start,timezone,starts_at,ends_at) values(event_id,local_start_value,zone,utc_start,utc_start+make_interval(mins=>duration_value));
 end loop;
 return event_id;
end; $$;
revoke all on function public.publish_event_draft(uuid,jsonb,uuid) from public,anon,authenticated;
grant execute on function public.publish_event_draft(uuid,jsonb,uuid) to service_role;
create or replace view public.published_events with(security_barrier=true) as select id,content,created_at,updated_at from public.events where is_published=true;
grant select on public.published_events to anon,authenticated;

create table if not exists public.ai_allowance(id integer primary key check(id=1),reserved_usd numeric not null default 0 check(reserved_usd>=0 and reserved_usd<=10));
insert into public.ai_allowance(id) values(1) on conflict do nothing;
alter table public.ai_allowance enable row level security;
revoke all on public.ai_allowance from public,anon,authenticated;
create or replace function public.reserve_ai_budget(amount numeric) returns boolean language plpgsql security definer set search_path=public as $$
begin
 if amount is null or amount<=0 or amount>1 then return false; end if;
 update public.ai_allowance set reserved_usd=reserved_usd+amount where id=1 and reserved_usd+amount<=10;
 return found;
end; $$;
revoke all on function public.reserve_ai_budget(numeric) from public,anon,authenticated;
grant execute on function public.reserve_ai_budget(numeric) to service_role;
