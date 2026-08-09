alter table public.questions
  add column source_record_id text unique;

create table public.historical_import_batches (
  id uuid primary key default gen_random_uuid(),
  source_key text not null,
  source_snapshot_at timestamptz not null,
  question_rows integer not null check (question_rows >= 0),
  result_rows integer not null check (result_rows >= 0),
  metadata jsonb not null default '{}',
  imported_at timestamptz not null default now(),
  unique (source_key, source_snapshot_at)
);

create table public.historical_question_rows (
  source_record_id text primary key,
  batch_id uuid not null references public.historical_import_batches(id) on delete restrict,
  source_created_at timestamptz not null,
  pillar text,
  difficulty_label text,
  prompt text,
  options jsonb,
  correct_index smallint,
  correct_sound_url text,
  wrong_sound_url text,
  candidate_question_id uuid unique references public.questions(id) on delete set null,
  raw_payload jsonb not null,
  imported_at timestamptz not null default now(),
  is_valid boolean generated always as (
    prompt is not null
    and char_length(trim(prompt)) > 0
    and jsonb_typeof(options) = 'array'
    and jsonb_array_length(options) = 4
    and correct_index between 0 and 3
  ) stored
);

create table public.historical_game_results (
  source_record_id text primary key,
  batch_id uuid not null references public.historical_import_batches(id) on delete restrict,
  source_created_at timestamptz not null,
  participant_name text not null,
  phone_raw text not null,
  score integer not null check (score >= 0),
  chances integer not null check (chances between 0 and 5),
  max_level text,
  occurred_at timestamptz not null,
  roulette_player_1 text,
  roulette_player_2 text,
  raw_payload jsonb not null,
  imported_at timestamptz not null default now()
);

create index historical_question_rows_batch_idx
  on public.historical_question_rows(batch_id);
create index historical_game_results_batch_idx
  on public.historical_game_results(batch_id);
create index historical_game_results_occurred_idx
  on public.historical_game_results(occurred_at desc);

alter table public.historical_import_batches enable row level security;
alter table public.historical_question_rows enable row level security;
alter table public.historical_game_results enable row level security;

revoke all on public.historical_import_batches from public, anon, authenticated;
revoke all on public.historical_question_rows from public, anon, authenticated;
revoke all on public.historical_game_results from public, anon, authenticated;
grant all on public.historical_import_batches to service_role;
grant all on public.historical_question_rows to service_role;
grant all on public.historical_game_results to service_role;

comment on table public.historical_question_rows is
  'Immutable source snapshot. Valid rows may link to review-only question candidates.';
comment on table public.historical_game_results is
  'Private historical results. Never exposed through the public application API.';
