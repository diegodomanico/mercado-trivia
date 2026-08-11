create table public.participant_contacts (
  user_id uuid not null references public.profiles(id) on delete cascade,
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  email text not null check (email = lower(email) and char_length(email) between 3 and 320),
  whatsapp_e164 text not null check (whatsapp_e164 ~ '^\+[1-9][0-9]{7,14}$'),
  email_verified_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, campaign_id)
);

alter table public.participant_contacts enable row level security;

revoke all on public.participant_contacts from anon;
grant select on public.participant_contacts to authenticated;
grant all on public.participant_contacts to service_role;

create policy "Users read their own campaign contact"
  on public.participant_contacts for select
  to authenticated
  using ((select auth.uid()) = user_id);

create index participant_contacts_campaign_id_idx
  on public.participant_contacts(campaign_id);
