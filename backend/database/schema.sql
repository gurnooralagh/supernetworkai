-- Enable pgvector extension
create extension if not exists vector;

-- ============================================================
-- USERS
-- ============================================================
create table if not exists users (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null unique,
  created_at  timestamptz not null default now()
);

-- ============================================================
-- PROFILES
-- ============================================================
create table if not exists profiles (
  id                          uuid primary key default gen_random_uuid(),
  user_id                     uuid not null unique references users(id) on delete cascade,

  -- Basic info
  name                        text not null,
  headline                    text,
  bio                         text,
  avatar_url                  text,
  location                    text,

  -- Intent (replaces role_seeking)
  intent                      text check (intent in ('cofounder', 'teammate', 'top_management')),

  -- Ikigai framework (8 fields)
  ikigai_passion_1            text,
  ikigai_passion_2            text,
  ikigai_strength_1           text,
  ikigai_strength_2           text,
  ikigai_mission_1            text,
  ikigai_mission_2            text,
  ikigai_vocation_1           text,
  ikigai_vocation_2           text,

  -- Collaboration fit
  collaboration_fit_1         text,
  collaboration_fit_2         text,
  collaboration_fit_3         text,

  -- Portfolio (11 fields)
  portfolio_what              text,
  portfolio_why               text,
  portfolio_knew              text,
  portfolio_assumptions       text,
  portfolio_start             text,
  portfolio_role              text,
  portfolio_decision          text,
  portfolio_differently       text,
  portfolio_learning          text,
  portfolio_thinking          text,
  portfolio_pressure          text,

  -- Profile summary
  profile_summary             text,
  profile_summary_confirmed   boolean         default false,

  -- Skills and goals
  skills                      text[]          default '{}',
  goals                       text[]          default '{}',

  -- Contact and visibility
  contact_visibility          text            default 'after_connect'
                                              check (contact_visibility in ('public', 'after_connect', 'hidden')),
  working_style               text            check (working_style in ('async', 'sync', 'hybrid')),
  availability                text,
  linkedin_url                text,
  github_url                  text,
  portfolio_url               text,
  contact_email               text,

  -- Vector embedding for AI matching
  embedding                   vector(1536),

  created_at                  timestamptz     not null default now(),
  updated_at                  timestamptz     not null default now()
);

-- ============================================================
-- MATCHES
-- ============================================================
create table if not exists matches (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references users(id) on delete cascade,
  matched_user_id     uuid not null references users(id) on delete cascade,

  -- Per-category scores
  cofounder_score     float,
  teammate_score      float,
  top_management_score float,
  best_category       text,
  overall_score       float not null check (overall_score >= 0 and overall_score <= 100),

  explanation         text,
  source              text default 'auto' check (source in ('auto', 'search')),
  created_at          timestamptz not null default now(),

  unique (user_id, matched_user_id)
);

-- ============================================================
-- CONNECTIONS
-- ============================================================
create table if not exists connections (
  id            uuid primary key default gen_random_uuid(),
  requester_id  uuid not null references users(id) on delete cascade,
  recipient_id  uuid not null references users(id) on delete cascade,
  status        text not null default 'pending' check (status in ('pending', 'accepted', 'rejected')),
  message       text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  unique (requester_id, recipient_id)
);

-- ============================================================
-- USER EVENTS
-- ============================================================
create table if not exists user_events (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references users(id) on delete cascade,
  event_type  text not null,
  target_id   uuid references users(id),
  query       text,
  created_at  timestamptz not null default now()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table users        enable row level security;
alter table profiles     enable row level security;
alter table matches      enable row level security;
alter table connections  enable row level security;
alter table user_events  enable row level security;

-- users
create policy "users_own_data" on users
  for all using (auth.uid() = id);

-- profiles
create policy "profiles: owner can select" on profiles
  for select using (auth.uid() = user_id);

create policy "profiles: owner can insert" on profiles
  for insert with check (auth.uid() = user_id);

create policy "profiles: owner can update" on profiles
  for update using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "profiles: owner can delete" on profiles
  for delete using (auth.uid() = user_id);

-- matches
create policy "matches: owner can select" on matches
  for select using (auth.uid() = user_id);

create policy "matches: owner can insert" on matches
  for insert with check (auth.uid() = user_id);

-- connections
create policy "users_own_connections" on connections
  for all using (
    auth.uid() = requester_id or
    auth.uid() = recipient_id
  );

-- user_events
create policy "users_own_events" on user_events
  for all using (auth.uid() = user_id);

-- ============================================================
-- INDEXES
-- ============================================================

-- Vector similarity search index (cosine distance)
create index if not exists profiles_embedding_idx
  on profiles using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

create index if not exists matches_user_id_idx       on matches(user_id);
create index if not exists connections_requester_idx on connections(requester_id);
create index if not exists connections_recipient_idx on connections(recipient_id);
create index if not exists user_events_user_id_idx   on user_events(user_id);
create index if not exists user_events_type_idx      on user_events(event_type);

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at
  before update on profiles
  for each row execute function set_updated_at();

create trigger connections_updated_at
  before update on connections
  for each row execute function set_updated_at();



create or replace function match_profiles(
  query_embedding vector(1536),
  exclude_user_id uuid,
  match_count int default 20
)
returns table (
  user_id uuid,
  similarity float
)
language sql stable
as $$
  select
    p.user_id,
    1 - (p.embedding <=> query_embedding) as similarity
  from profiles p
  where p.user_id <> exclude_user_id
    and p.embedding is not null
  order by p.embedding <=> query_embedding
  limit match_count;
$$;