begin;
-- Run with: supabase test db
-- This test intentionally exercises RLS with JWT claims, rather than browser guards.
select plan(16);

select tests.create_supabase_user('aeris-user');
select tests.create_supabase_user('aeris-other');
select tests.create_supabase_user('aeris-government');
select tests.create_supabase_user('aeris-admin');

update public.profiles set role = 'government' where id = tests.get_supabase_uid('aeris-government');
update public.profiles set role = 'admin' where id = tests.get_supabase_uid('aeris-admin');

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
insert into public.emergency_requests (user_id, request_type, title) values (tests.get_supabase_uid('aeris-user'), 'food', 'Test food');
select results_eq('select count(*)::int from public.emergency_requests', array[2], 'user reads own emergency requests');

select set_config('request.jwt.claim.sub', tests.get_supabase_uid('aeris-government')::text, true);
select results_eq('select count(*)::int from public.emergency_requests', array[0], 'government cannot read private requests');
select results_eq('select count(*)::int from public.government_incidents', array[0], 'new requests do not reach the government feed');
select throws_ok(
  $$select public.escalate_emergency_request(gen_random_uuid(), 'Government trying to escalate')$$,
  '42501', null, 'government cannot escalate'
);
select throws_ok(
  $$select public.decline_emergency_request(gen_random_uuid(), 'nope')$$,
  '42501', null, 'government cannot decline'
);

select set_config('request.jwt.claim.sub', tests.get_supabase_uid('aeris-user')::text, true);
select throws_ok(
  $$select public.escalate_emergency_request((select id from public.emergency_requests where title = 'Test SOS'), 'User trying to escalate')$$,
  '42501', null, 'user cannot escalate'
);
select throws_ok(
  $$select public.decline_emergency_request((select id from public.emergency_requests where title = 'Test SOS'), 'nope')$$,
  '42501', null, 'user cannot decline'
);

select set_config('request.jwt.claim.sub', tests.get_supabase_uid('aeris-admin')::text, true);
select lives_ok(
  $$select public.escalate_emergency_request((select id from public.emergency_requests where title = 'Test SOS'), 'SOS · Test SOS · critical')$$,
  'admin escalates a request'
);
select lives_ok(
  $$select public.escalate_emergency_request((select id from public.emergency_requests where title = 'Test SOS'), 'SOS · Test SOS · critical')$$,
  'escalating twice is idempotent'
);
select throws_ok(
  $$select public.decline_emergency_request((select id from public.emergency_requests where title = 'Test SOS'), 'Too late')$$,
  '22023', null, 'cannot decline after escalating'
);
select lives_ok(
  $$select public.decline_emergency_request((select id from public.emergency_requests where title = 'Test food'), 'Handled by local volunteers', true)$$,
  'admin declines a request'
);

select set_config('request.jwt.claim.sub', tests.get_supabase_uid('aeris-government')::text, true);
select results_eq('select count(*)::int from public.government_incidents', array[1], 'government sees only the escalated incident, once');

select set_config('request.jwt.claim.sub', tests.get_supabase_uid('aeris-user')::text, true);
select results_eq('select count(*)::int from public.government_incidents', array[0], 'user cannot read government feed');

select * from finish();
rollback;
