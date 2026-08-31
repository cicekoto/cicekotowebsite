alter table public.appointments
  add column if not exists services text[] not null default '{}'::text[];

update public.appointments
set services = array[service]
where cardinality(services) = 0 and service is not null and service <> '';

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'appointments_services_count_check'
      and conrelid = 'public.appointments'::regclass
  ) then
    alter table public.appointments
      add constraint appointments_services_count_check
      check (cardinality(services) between 1 and 6);
  end if;
end $$;
