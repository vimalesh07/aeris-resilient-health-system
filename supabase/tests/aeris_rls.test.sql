begin;
-- Run with: supabase test db
-- This test intentionally exercises RLS with JWT claims, rather than browser guards.
select plan(8);

select tests.create_supabase_user('aeris-user');
select tests.create_supabase_user('aeris-other');
select tests.create_supabase_user('aeris-government');

update public.profiles set role = 'government' where id = tests.get_supabase_uid('aeris-government');

set local role authenticated;
select set_config('request.jwt.claim.sub', tests.get_supabase_uid('aeris-user')::text, true);
insert into public.user_health_profiles (user_id, age) values (tests.get_supabase_uid('aeris-user'), 25);
select results_eq('select count(*)::int from public.user_health_profiles', array[1], 'user reads own health profile');

select set_config('request.jwt.claim.sub', tests.get_supabase_uid('aeris-other')::text, true);
select results_eq('select count(*)::int from public.user_health_profiles', array[0], 'other user cannot read private profile');
select throws_ok(
  format('insert into public.user_health_profiles (user_id, age) values (''%s'', 30)', tests.get_supabase_uid('aeris-user')),
  '42501', null, 'other user cannot insert another user profile'
);

select set_config('request.jwt.claim.sub', tests.get_supabase_uid('aeris-user')::text, true);
insert into public.emergency_requests (user_id, request_type, title) values (tests.get_supabase_uid('aeris-user'), 'sos', 'Test SOS');
select results_eq('select count(*)::int from public.emergency_requests', array[1], 'user reads own emergency request');

select set_config('request.jwt.claim.sub', tests.get_supabase_uid('aeris-government')::text, true);
select results_eq('select count(*)::int from public.emergency_requests', array[0], 'government cannot read private requests');
select results_eq('select count(*)::int from public.government_incidents', array[1], 'government reads minimized incident feed');

select set_config('request.jwt.claim.sub', tests.get_supabase_uid('aeris-user')::text, true);
select results_eq('select count(*)::int from public.government_incidents', array[0], 'user cannot read government feed');

select * from finish();
rollback;
