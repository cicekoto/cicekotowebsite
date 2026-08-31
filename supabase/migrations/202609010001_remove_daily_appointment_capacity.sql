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
  v_start timestamp;
begin
  v_start := v_date + v_time;
  perform pg_advisory_xact_lock(hashtextextended(v_date::text, 0));

  if v_time < time '09:00' or v_time > time '17:00' then
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
    p_record->>'reference','pending',p_record->>'service',
    array(select jsonb_array_elements_text(p_record->'services')),v_duration,
    p_record->>'vehicle_brand',p_record->>'vehicle_model',nullif(p_record->>'vehicle_year',''),
    nullif(p_record->>'plate',''),v_date,v_time,p_record->>'customer_name',
    p_record->>'customer_phone',nullif(p_record->>'customer_email',''),
    nullif(p_record->>'notes',''),true,coalesce((p_record->>'whatsapp_consent')::boolean,false),'website'
  ) returning * into v_result;

  return v_result;
end $$;

revoke all on function public.create_website_appointment(jsonb) from public, anon, authenticated;
grant execute on function public.create_website_appointment(jsonb) to service_role;
