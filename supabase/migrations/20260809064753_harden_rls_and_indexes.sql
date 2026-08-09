revoke all on function public.handle_new_user() from public, anon, authenticated;

alter policy "Public countries are readable"
  on public.countries to anon, authenticated using (true);
alter policy "Active campaigns are readable"
  on public.campaigns to anon, authenticated using (status = 'active');
alter policy "Competencies are readable"
  on public.competencies to anon, authenticated using (true);
alter policy "Users read their own profile"
  on public.profiles to authenticated using ((select auth.uid()) = id);
alter policy "Users read their seller verification"
  on public.seller_verifications to authenticated using ((select auth.uid()) = user_id);
alter policy "Users read their verified publication"
  on public.verified_publications to authenticated using ((select auth.uid()) = user_id);
alter policy "Users read their consent"
  on public.consent_acceptances to authenticated using ((select auth.uid()) = user_id);
alter policy "Users read their campaign sessions"
  on public.game_sessions to authenticated
  using ((select auth.uid()) = user_id and mode = 'campaign');
alter policy "Users read their campaign question progress"
  on public.game_session_questions to authenticated using (
    exists (
      select 1
      from public.game_sessions sessions
      where sessions.id = session_id
        and sessions.user_id = (select auth.uid())
    )
  );

create index campaigns_country_code_idx
  on public.campaigns(country_code);
create index consent_acceptances_campaign_id_idx
  on public.consent_acceptances(campaign_id);
create index game_session_questions_question_id_idx
  on public.game_session_questions(question_id);
create index game_sessions_country_code_idx
  on public.game_sessions(country_code);
create index game_sessions_user_id_idx
  on public.game_sessions(user_id);
create index questions_competency_id_idx
  on public.questions(competency_id);
create index audit_events_actor_user_id_idx
  on public.audit_events(actor_user_id);
