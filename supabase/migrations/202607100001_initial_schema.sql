create extension if not exists pgcrypto;

create type public.campaign_status as enum ('draft', 'active', 'paused', 'closed');
create type public.question_status as enum ('draft', 'review', 'approved', 'retired');
create type public.game_mode as enum ('practice', 'campaign');
create type public.game_status as enum ('created', 'playing', 'completed', 'abandoned', 'disqualified');

create table public.countries (
  code text primary key check (code ~ '^[A-Z]{2}$'),
  name text not null,
  site_id text not null unique check (site_id ~ '^M[A-Z]{2}$'),
  locale text not null,
  launch_order smallint not null unique
);

create table public.campaigns (
  id uuid primary key default gen_random_uuid(),
  country_code text not null references public.countries(code),
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  name text not null,
  event_starts_at timestamptz not null,
  registration_starts_at timestamptz,
  registration_ends_at timestamptz,
  expected_participants integer not null check (expected_participants > 0),
  status public.campaign_status not null default 'draft',
  terms_version text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  whatsapp_e164 text unique check (whatsapp_e164 is null or whatsapp_e164 ~ '^\+[1-9][0-9]{7,14}$'),
  whatsapp_verified_at timestamptz,
  display_name text check (char_length(display_name) <= 80),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.seller_verifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  country_code text not null references public.countries(code),
  seller_id text not null check (seller_id ~ '^[0-9]+$'),
  nickname text not null check (char_length(nickname) <= 100),
  verified_at timestamptz not null,
  created_at timestamptz not null default now(),
  unique (user_id, country_code),
  unique (country_code, seller_id)
);

create table public.verified_publications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  item_id text not null check (item_id ~ '^ML[A-Z][0-9]+$'),
  seller_id text not null check (seller_id ~ '^[0-9]+$'),
  permalink text not null,
  title text not null,
  verified_at timestamptz not null,
  created_at timestamptz not null default now(),
  unique (user_id, campaign_id),
  unique (campaign_id, item_id)
);

create table public.competencies (
  id smallint primary key,
  slug text not null unique,
  name text not null,
  description text not null,
  display_order smallint not null unique
);

create table public.questions (
  id uuid primary key default gen_random_uuid(),
  competency_id smallint not null references public.competencies(id),
  difficulty smallint not null check (difficulty between 1 and 5),
  applicable_countries text[] not null default '{}',
  prompt text not null check (char_length(prompt) between 20 and 600),
  options jsonb not null check (
    jsonb_typeof(options) = 'array' and jsonb_array_length(options) = 4
  ),
  correct_index smallint not null check (correct_index between 0 and 3),
  explanation text not null check (char_length(explanation) between 20 and 1200),
  source_url text not null,
  source_title text not null,
  source_checked_at date not null,
  status public.question_status not null default 'draft',
  approved_by text,
  approved_at timestamptz,
  version integer not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (status = 'approved' and approved_by is not null and approved_at is not null)
    or status <> 'approved'
  )
);

create table public.consent_acceptances (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  terms_version text not null,
  privacy_version text not null,
  accepted_at timestamptz not null default now(),
  ip_hash text,
  unique (user_id, campaign_id, terms_version, privacy_version)
);

create table public.game_sessions (
  id uuid primary key default gen_random_uuid(),
  mode public.game_mode not null,
  campaign_id uuid references public.campaigns(id),
  country_code text not null references public.countries(code),
  user_id uuid references public.profiles(id) on delete cascade,
  guest_token_hash text,
  status public.game_status not null default 'created',
  score integer not null default 0 check (score >= 0),
  correct_answers smallint not null default 0 check (correct_answers between 0 and 25),
  chances smallint not null default 0 check (chances between 0 and 5),
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  check (
    (mode = 'campaign' and campaign_id is not null and user_id is not null and guest_token_hash is null)
    or (mode = 'practice' and campaign_id is null and user_id is null and guest_token_hash is not null)
  )
);

create unique index one_campaign_attempt_per_user
  on public.game_sessions(campaign_id, user_id)
  where mode = 'campaign' and status <> 'disqualified';

create table public.game_session_questions (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.game_sessions(id) on delete cascade,
  question_id uuid not null references public.questions(id),
  position smallint not null check (position between 1 and 25),
  option_order smallint[] not null check (cardinality(option_order) = 4),
  selected_index smallint check (selected_index between 0 and 3),
  is_correct boolean,
  points_awarded integer check (points_awarded >= 0),
  presented_at timestamptz,
  answered_at timestamptz,
  unique (session_id, position),
  unique (session_id, question_id)
);

create table public.audit_events (
  id bigint generated always as identity primary key,
  actor_user_id uuid references public.profiles(id) on delete set null,
  campaign_id uuid references public.campaigns(id) on delete set null,
  event_type text not null,
  entity_type text,
  entity_id text,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index questions_selection_idx
  on public.questions(status, difficulty, competency_id);
create index questions_countries_gin_idx
  on public.questions using gin(applicable_countries);
create index session_questions_progress_idx
  on public.game_session_questions(session_id, answered_at, position);
create index audit_events_campaign_time_idx
  on public.audit_events(campaign_id, created_at desc);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, whatsapp_e164, whatsapp_verified_at)
  values (new.id, new.phone, case when new.phone_confirmed_at is null then null else new.phone_confirmed_at end)
  on conflict (id) do update
  set whatsapp_e164 = excluded.whatsapp_e164,
      whatsapp_verified_at = excluded.whatsapp_verified_at,
      updated_at = now();
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert or update of phone, phone_confirmed_at on auth.users
  for each row execute procedure public.handle_new_user();

alter table public.countries enable row level security;
alter table public.campaigns enable row level security;
alter table public.profiles enable row level security;
alter table public.seller_verifications enable row level security;
alter table public.verified_publications enable row level security;
alter table public.competencies enable row level security;
alter table public.questions enable row level security;
alter table public.consent_acceptances enable row level security;
alter table public.game_sessions enable row level security;
alter table public.game_session_questions enable row level security;
alter table public.audit_events enable row level security;

create policy "Public countries are readable"
  on public.countries for select using (true);
create policy "Active campaigns are readable"
  on public.campaigns for select using (status = 'active');
create policy "Competencies are readable"
  on public.competencies for select using (true);
create policy "Users read their own profile"
  on public.profiles for select using (auth.uid() = id);
create policy "Users read their seller verification"
  on public.seller_verifications for select using (auth.uid() = user_id);
create policy "Users read their verified publication"
  on public.verified_publications for select using (auth.uid() = user_id);
create policy "Users read their consent"
  on public.consent_acceptances for select using (auth.uid() = user_id);
create policy "Users read their campaign sessions"
  on public.game_sessions for select using (auth.uid() = user_id and mode = 'campaign');
create policy "Users read their campaign question progress"
  on public.game_session_questions for select using (
    exists (
      select 1 from public.game_sessions sessions
      where sessions.id = session_id and sessions.user_id = auth.uid()
    )
  );

insert into public.countries (code, name, site_id, locale, launch_order) values
  ('CL', 'Chile', 'MLC', 'es-CL', 1),
  ('AR', 'Argentina', 'MLA', 'es-AR', 2),
  ('CO', 'Colombia', 'MCO', 'es-CO', 3),
  ('MX', 'México', 'MLM', 'es-MX', 4),
  ('UY', 'Uruguay', 'MLU', 'es-UY', 5);

insert into public.competencies (id, slug, name, description, display_order) values
  (1, 'oferta-catalogo', 'Oferta, catálogo y calidad', 'Cómo construir publicaciones competitivas y confiables.', 1),
  (2, 'trafico-conversion', 'Tráfico, publicidad y conversión', 'Cómo atraer demanda y convertirla de manera rentable.', 2),
  (3, 'operacion-logistica', 'Operación, stock y logística', 'Cómo cumplir la promesa de entrega a escala.', 3),
  (4, 'servicio-reputacion', 'Servicio, postventa y reputación', 'Cómo proteger la experiencia y la confianza del comprador.', 4),
  (5, 'rentabilidad-data', 'Rentabilidad, estrategia y data', 'Cómo decidir con métricas, costos y objetivos.', 5);

insert into public.campaigns (
  country_code, slug, name, event_starts_at, expected_participants, status
) values
  ('CL', 'melixp-chile-2026', 'MELIXP Chile 2026', '2026-08-27T09:00:00-04:00', 3000, 'draft'),
  ('AR', 'melixp-argentina-2026', 'MELIXP Argentina 2026', '2026-09-10T09:00:00-03:00', 7000, 'draft');
