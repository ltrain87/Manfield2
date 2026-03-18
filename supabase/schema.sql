-- ═══════════════════════════════════════════════════════════════
-- MANFIELD DATABASE SCHEMA — safe to run multiple times
-- Run this in Supabase SQL Editor (paste and click Run)
-- ═══════════════════════════════════════════════════════════════

-- ── PROFILES ──
create table if not exists public.profiles (
  id                      uuid references auth.users on delete cascade primary key,
  username                text unique,
  display_name            text,
  avatar_color            text default '#0A84FF',
  bio                     text default '',
  tier                    text default 'free',
  stripe_customer_id      text,
  stripe_subscription_id  text,
  subscription_status     text default 'inactive',
  subscription_period_end timestamptz,
  streak_count            integer default 0,
  streak_last_date        date,
  knowledge_score         integer default 0,
  total_saves             integer default 0,
  created_at              timestamptz default now(),
  updated_at              timestamptz default now()
);
alter table public.profiles enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='profiles' and policyname='profiles_select') then
    create policy "profiles_select" on public.profiles for select using (true);
  end if;
  if not exists (select 1 from pg_policies where tablename='profiles' and policyname='profiles_update') then
    create policy "profiles_update" on public.profiles for update using (auth.uid() = id);
  end if;
  if not exists (select 1 from pg_policies where tablename='profiles' and policyname='profiles_insert') then
    create policy "profiles_insert" on public.profiles for insert with check (auth.uid() = id);
  end if;
end $$;

-- ── GOALS ──
create table if not exists public.goals (
  id       bigserial primary key,
  user_id  uuid references public.profiles(id) on delete cascade not null,
  goal     text not null,
  active   boolean default true,
  added_at timestamptz default now()
);
alter table public.goals enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='goals' and policyname='goals_all') then
    create policy "goals_all" on public.goals using (auth.uid() = user_id);
  end if;
end $$;

-- ── SIGNALS ──
create table if not exists public.signals (
  id          bigserial primary key,
  user_id     uuid references public.profiles(id) on delete cascade not null,
  keyword     text not null,
  signal_type text not null,
  weight      real default 1.0,
  created_at  timestamptz default now()
);
alter table public.signals enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='signals' and policyname='signals_all') then
    create policy "signals_all" on public.signals using (auth.uid() = user_id);
  end if;
end $$;
create index if not exists signals_user_time on public.signals(user_id, created_at desc);

-- ── SAVED ITEMS ──
create table if not exists public.saved_items (
  id       bigserial primary key,
  user_id  uuid references public.profiles(id) on delete cascade not null,
  item_id  text,
  title    text not null,
  source   text,
  url      text,
  thumb    text,
  icon     text,
  saved_at timestamptz default now()
);
alter table public.saved_items enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='saved_items' and policyname='saved_all') then
    create policy "saved_all" on public.saved_items using (auth.uid() = user_id);
  end if;
end $$;

-- ── AI CONVERSATION MEMORY ──
create table if not exists public.conversations (
  id         bigserial primary key,
  user_id    uuid references public.profiles(id) on delete cascade not null,
  role       text not null,
  content    text not null,
  created_at timestamptz default now()
);
alter table public.conversations enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='conversations' and policyname='conversations_all') then
    create policy "conversations_all" on public.conversations using (auth.uid() = user_id);
  end if;
end $$;
create index if not exists conversations_user_time on public.conversations(user_id, created_at desc);

-- ── FRIENDSHIPS ──
create table if not exists public.friendships (
  id           bigserial primary key,
  follower_id  uuid references public.profiles(id) on delete cascade not null,
  following_id uuid references public.profiles(id) on delete cascade not null,
  status       text default 'accepted',
  created_at   timestamptz default now(),
  unique(follower_id, following_id)
);
alter table public.friendships enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='friendships' and policyname='friendships_select') then
    create policy "friendships_select" on public.friendships for select using (auth.uid() = follower_id or auth.uid() = following_id);
  end if;
  if not exists (select 1 from pg_policies where tablename='friendships' and policyname='friendships_insert') then
    create policy "friendships_insert" on public.friendships for insert with check (auth.uid() = follower_id);
  end if;
  if not exists (select 1 from pg_policies where tablename='friendships' and policyname='friendships_delete') then
    create policy "friendships_delete" on public.friendships for delete using (auth.uid() = follower_id);
  end if;
end $$;

-- ── DM THREADS ──
create table if not exists public.dm_threads (
  id              uuid default gen_random_uuid() primary key,
  participant_ids uuid[] not null,
  last_message_at timestamptz default now(),
  created_at      timestamptz default now()
);
alter table public.dm_threads enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='dm_threads' and policyname='threads_select') then
    create policy "threads_select" on public.dm_threads using (auth.uid() = any(participant_ids));
  end if;
  if not exists (select 1 from pg_policies where tablename='dm_threads' and policyname='threads_insert') then
    create policy "threads_insert" on public.dm_threads for insert with check (auth.uid() = any(participant_ids));
  end if;
end $$;

-- ── MESSAGES ──
create table if not exists public.messages (
  id         uuid default gen_random_uuid() primary key,
  thread_id  uuid references public.dm_threads(id) on delete cascade not null,
  sender_id  uuid references public.profiles(id) on delete cascade not null,
  content    text,
  media      jsonb,
  read_by    uuid[] default '{}',
  created_at timestamptz default now()
);
alter table public.messages enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='messages' and policyname='messages_select') then
    create policy "messages_select" on public.messages for select using (
      exists(select 1 from public.dm_threads t where t.id = thread_id and auth.uid() = any(t.participant_ids))
    );
  end if;
  if not exists (select 1 from pg_policies where tablename='messages' and policyname='messages_insert') then
    create policy "messages_insert" on public.messages for insert with check (
      auth.uid() = sender_id and
      exists(select 1 from public.dm_threads t where t.id = thread_id and auth.uid() = any(t.participant_ids))
    );
  end if;
end $$;
create index if not exists messages_thread_time on public.messages(thread_id, created_at desc);

-- ── DAILY BRIEFS ──
create table if not exists public.daily_briefs (
  id         bigserial primary key,
  user_id    uuid references public.profiles(id) on delete cascade not null,
  content    text not null,
  brief_date date default current_date,
  unique(user_id, brief_date)
);
alter table public.daily_briefs enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='daily_briefs' and policyname='briefs_all') then
    create policy "briefs_all" on public.daily_briefs using (auth.uid() = user_id);
  end if;
end $$;

-- ── ACTIVITY FEED ──
create table if not exists public.activities (
  id         bigserial primary key,
  user_id    uuid references public.profiles(id) on delete cascade not null,
  type       text not null,
  data       jsonb default '{}',
  created_at timestamptz default now()
);
alter table public.activities enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='activities' and policyname='activities_select') then
    create policy "activities_select" on public.activities for select using (true);
  end if;
  if not exists (select 1 from pg_policies where tablename='activities' and policyname='activities_insert') then
    create policy "activities_insert" on public.activities for insert with check (auth.uid() = user_id);
  end if;
end $$;
create index if not exists activities_user_time on public.activities(user_id, created_at desc);

-- ── CHALLENGES ──
create table if not exists public.challenges (
  id            bigserial primary key,
  challenger_id uuid references public.profiles(id) on delete cascade not null,
  challenged_id uuid references public.profiles(id) on delete cascade not null,
  topic         text not null,
  status        text default 'pending',
  winner_id     uuid references public.profiles(id),
  ends_at       timestamptz,
  created_at    timestamptz default now()
);
alter table public.challenges enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='challenges' and policyname='challenges_select') then
    create policy "challenges_select" on public.challenges for select using (auth.uid() = challenger_id or auth.uid() = challenged_id);
  end if;
  if not exists (select 1 from pg_policies where tablename='challenges' and policyname='challenges_insert') then
    create policy "challenges_insert" on public.challenges for insert with check (auth.uid() = challenger_id);
  end if;
end $$;

-- ── AUTO-CREATE PROFILE ON SIGNUP ──
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  uname text;
  dname text;
begin
  dname := coalesce(
    new.raw_user_meta_data->>'display_name',
    split_part(new.email, '@', 1),
    'User'
  );
  uname := lower(regexp_replace(dname, '[^a-zA-Z0-9]', '_', 'g'))
           || '_' || substr(replace(new.id::text, '-', ''), 1, 4);
  insert into public.profiles (id, display_name, username)
  values (new.id, dname, uname)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── ENABLE REALTIME ──
do $$
begin
  begin
    alter publication supabase_realtime add table public.messages;
  exception when others then null;
  end;
  begin
    alter publication supabase_realtime add table public.activities;
  exception when others then null;
  end;
end $$;
