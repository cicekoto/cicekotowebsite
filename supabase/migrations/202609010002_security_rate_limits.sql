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

create index if not exists api_rate_limits_updated_at_idx on public.api_rate_limits(updated_at);
