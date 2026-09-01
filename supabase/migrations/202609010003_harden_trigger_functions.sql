-- Trigger functions are internal database implementation details. Pin their
-- namespace resolution and prevent PostgREST roles from invoking them directly.
alter function public.touch_updated_at() set search_path = public, pg_temp;
alter function public.log_appointment_status() set search_path = public, pg_temp;

revoke all on function public.touch_updated_at() from public, anon, authenticated;
revoke all on function public.log_appointment_status() from public, anon, authenticated;
