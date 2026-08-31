create extension if not exists pgcrypto;

create type public.appointment_status as enum ('pending','confirmed','rescheduled','completed','cancelled');

create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  status public.appointment_status not null default 'pending',
  service text not null,
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

create index appointments_created_at_idx on public.appointments (created_at desc);
create index appointments_requested_date_idx on public.appointments (requested_date, requested_time);
create index appointments_status_idx on public.appointments (status);
alter table public.appointments enable row level security;
revoke all on public.appointments from anon, authenticated;

create table public.appointment_events (
  id bigint generated always as identity primary key,
  appointment_id uuid not null references public.appointments(id) on delete cascade,
  event_type text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
alter table public.appointment_events enable row level security;
revoke all on public.appointment_events from anon, authenticated;

create or replace function public.touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
create trigger appointments_touch_updated_at before update on public.appointments for each row execute function public.touch_updated_at();

create or replace function public.log_appointment_status() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then insert into public.appointment_events(appointment_id,event_type,metadata) values(new.id,'created',jsonb_build_object('status',new.status));
  elsif old.status is distinct from new.status then insert into public.appointment_events(appointment_id,event_type,metadata) values(new.id,'status_changed',jsonb_build_object('from',old.status,'to',new.status));
  end if;
  return new;
end $$;
create trigger appointments_log_event after insert or update on public.appointments for each row execute function public.log_appointment_status();
