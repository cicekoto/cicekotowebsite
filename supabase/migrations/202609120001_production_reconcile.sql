-- Idempotent production reconciliation for installations where only part of the
-- original migration sequence was applied. Safe to run after every older file.
create extension if not exists pgcrypto;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'appointment_status' and typnamespace = 'public'::regnamespace) then
    create type public.appointment_status as enum ('pending','confirmed','rescheduled','completed','cancelled');
  end if;
end $$;

create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  status public.appointment_status not null default 'pending',
  service text not null,
  services text[] not null default '{}'::text[],
  duration_minutes integer not null default 120,
  vehicle_brand text not null,
  vehicle_model text not null,
  vehicle_year text,
  plate text,
  requested_date date not null,
  requested_time time not null,
  customer_name text not null,
  customer_phone text not null,
  customer_email text,
  notes text,
  kvkk_consent boolean not null default false,
  whatsapp_consent boolean not null default false,
  source text not null default 'website',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint appointment_phone_check check (customer_phone ~ '^\+90[0-9]{10}$'),
  constraint appointment_reference_check check (reference ~ '^CO-[A-Z0-9-]{5,16}$')
);

alter table public.appointments add column if not exists services text[] not null default '{}'::text[];
alter table public.appointments add column if not exists duration_minutes integer not null default 120;

update public.appointments
set services = array[service]
where cardinality(services) = 0 and service is not null and service <> '';

update public.appointments
set duration_minutes = case
  when cardinality(services) = 1 and services[1] = 'Periyodik Bakım' then 60
  else 120
end
where duration_minutes not in (60,120) or duration_minutes is null;

alter table public.appointments drop constraint if exists appointments_services_count_check;
alter table public.appointments
  add constraint appointments_services_count_check check (cardinality(services) between 1 and 9);

alter table public.appointments drop constraint if exists appointments_duration_check;
alter table public.appointments
  add constraint appointments_duration_check check (duration_minutes in (60,120));

create index if not exists appointments_created_at_idx on public.appointments (created_at desc);
create index if not exists appointments_requested_date_idx on public.appointments (requested_date, requested_time);
create index if not exists appointments_status_idx on public.appointments (status);

create table if not exists public.appointment_events (
  id bigint generated always as identity primary key,
  appointment_id uuid not null references public.appointments(id) on delete cascade,
  event_type text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.appointments enable row level security;
alter table public.appointment_events enable row level security;
revoke all on public.appointments from public, anon, authenticated;
revoke all on public.appointment_events from public, anon, authenticated;

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists appointments_touch_updated_at on public.appointments;
create trigger appointments_touch_updated_at
before update on public.appointments
for each row execute function public.touch_updated_at();

create or replace function public.log_appointment_status()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.appointment_events(appointment_id,event_type,metadata)
    values(new.id,'created',jsonb_build_object('status',new.status));
  elsif old.status is distinct from new.status then
    insert into public.appointment_events(appointment_id,event_type,metadata)
    values(new.id,'status_changed',jsonb_build_object('from',old.status,'to',new.status));
  end if;
  return new;
end $$;

drop trigger if exists appointments_log_event on public.appointments;
create trigger appointments_log_event
after insert or update on public.appointments
for each row execute function public.log_appointment_status();

revoke all on function public.touch_updated_at() from public, anon, authenticated;
revoke all on function public.log_appointment_status() from public, anon, authenticated;

create table if not exists public.api_rate_limits (
  bucket text not null,
  subject_hash text not null,
  window_started_at timestamptz not null,
  request_count integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (bucket, subject_hash),
  constraint api_rate_limits_bucket_check check (bucket ~ '^[a-z0-9_-]{1,40}$'),
  constraint api_rate_limits_subject_check check (subject_hash ~ '^[a-f0-9]{64}$'),
  constraint api_rate_limits_count_check check (request_count between 0 and 100000)
);

alter table public.api_rate_limits enable row level security;
revoke all on public.api_rate_limits from public, anon, authenticated;
create index if not exists api_rate_limits_updated_at_idx on public.api_rate_limits(updated_at);

create or replace function public.consume_api_rate_limit(
  p_bucket text,
  p_subject_hash text,
  p_limit integer,
  p_window_seconds integer
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now timestamptz := clock_timestamp();
  v_window_start timestamptz;
  v_count integer;
  v_retry integer;
begin
  if p_bucket !~ '^[a-z0-9_-]{1,40}$'
    or p_subject_hash !~ '^[a-f0-9]{64}$'
    or p_limit < 1 or p_limit > 1000
    or p_window_seconds < 10 or p_window_seconds > 86400 then
    raise exception 'INVALID_RATE_LIMIT_ARGUMENT';
  end if;

  v_window_start := to_timestamp(floor(extract(epoch from v_now) / p_window_seconds) * p_window_seconds);
  perform pg_advisory_xact_lock(hashtextextended(p_bucket || ':' || p_subject_hash, 0));

  insert into public.api_rate_limits(bucket,subject_hash,window_started_at,request_count,updated_at)
  values(p_bucket,p_subject_hash,v_window_start,1,v_now)
  on conflict(bucket,subject_hash) do update
  set window_started_at = case
        when api_rate_limits.window_started_at < v_window_start then v_window_start
        else api_rate_limits.window_started_at
      end,
      request_count = case
        when api_rate_limits.window_started_at < v_window_start then 1
        else api_rate_limits.request_count + 1
      end,
      updated_at = v_now
  returning request_count into v_count;

  v_retry := greatest(1, ceil(extract(epoch from (v_window_start + make_interval(secs => p_window_seconds) - v_now)))::integer);
  return jsonb_build_object('allowed',v_count <= p_limit,'retry_after',v_retry);
end $$;

revoke all on function public.consume_api_rate_limit(text,text,integer,integer) from public, anon, authenticated;
grant execute on function public.consume_api_rate_limit(text,text,integer,integer) to service_role;

create or replace function public.create_website_appointment(p_record jsonb)
returns public.appointments
language plpgsql
security definer
set search_path = public
as $$
declare
  v_result public.appointments;
  v_date date := (p_record->>'requested_date')::date;
  v_time time := (p_record->>'requested_time')::time;
  v_duration integer := (p_record->>'duration_minutes')::integer;
  v_services text[] := array(select jsonb_array_elements_text(p_record->'services'));
  v_start timestamp;
begin
  if cardinality(v_services) < 1 or cardinality(v_services) > 9 or v_duration not in (60,120) then
    raise exception 'INVALID_APPOINTMENT';
  end if;

  v_start := v_date + v_time;
  perform pg_advisory_xact_lock(hashtextextended(v_date::text, 0));

  if extract(isodow from v_date) = 7 or v_time < time '09:00' or v_time > time '17:00' then
    raise exception 'SLOT_UNAVAILABLE';
  end if;

  if exists (
    select 1 from public.appointments
    where requested_date = v_date
      and status <> 'cancelled'
      and requested_date + requested_time < v_start + make_interval(mins => v_duration)
      and requested_date + requested_time + make_interval(mins => duration_minutes) > v_start
  ) then
    raise exception 'SLOT_UNAVAILABLE';
  end if;

  insert into public.appointments (
    reference,status,service,services,duration_minutes,vehicle_brand,vehicle_model,
    vehicle_year,plate,requested_date,requested_time,customer_name,customer_phone,
    customer_email,notes,kvkk_consent,whatsapp_consent,source
  ) values (
    p_record->>'reference','pending',p_record->>'service',v_services,v_duration,
    p_record->>'vehicle_brand',p_record->>'vehicle_model',nullif(p_record->>'vehicle_year',''),
    nullif(p_record->>'plate',''),v_date,v_time,p_record->>'customer_name',
    p_record->>'customer_phone',nullif(p_record->>'customer_email',''),
    nullif(p_record->>'notes',''),true,coalesce((p_record->>'whatsapp_consent')::boolean,false),'website'
  ) returning * into v_result;

  return v_result;
end $$;

revoke all on function public.create_website_appointment(jsonb) from public, anon, authenticated;
grant execute on function public.create_website_appointment(jsonb) to service_role;
