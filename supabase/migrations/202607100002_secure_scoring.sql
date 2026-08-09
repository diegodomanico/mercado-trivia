create or replace function public.submit_game_answer(
  p_session_id uuid,
  p_position smallint,
  p_selected_index smallint
)
returns table (
  is_correct boolean,
  explanation text,
  points_awarded integer,
  total_score integer,
  correct_answers smallint,
  chances smallint,
  completed boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_row public.game_session_questions%rowtype;
  question_row public.questions%rowtype;
  original_selected smallint;
  answer_correct boolean;
  answer_points integer;
  updated_session public.game_sessions%rowtype;
begin
  if p_selected_index < 0 or p_selected_index > 3 then
    raise exception 'selected index out of range';
  end if;

  select * into current_row
  from public.game_session_questions
  where session_id = p_session_id and position = p_position
  for update;

  if not found or current_row.answered_at is not null then
    raise exception 'question unavailable or already answered';
  end if;

  select * into question_row
  from public.questions
  where id = current_row.question_id and status = 'approved';

  if not found then
    raise exception 'approved question not found';
  end if;

  original_selected := current_row.option_order[p_selected_index + 1];
  answer_correct := original_selected = question_row.correct_index;
  answer_points := case
    when not answer_correct then 0
    when question_row.difficulty = 1 then 100
    when question_row.difficulty = 2 then 200
    when question_row.difficulty = 3 then 500
    when question_row.difficulty = 4 then 1000
    when question_row.difficulty = 5 then 2000
    else 0
  end;

  update public.game_session_questions
  set selected_index = p_selected_index,
      is_correct = answer_correct,
      points_awarded = answer_points,
      answered_at = now()
  where id = current_row.id;

  update public.game_sessions
  set score = score + answer_points,
      correct_answers = correct_answers + case when answer_correct then 1 else 0 end,
      chances = floor((correct_answers + case when answer_correct then 1 else 0 end) / 5.0),
      status = case when p_position = 25 then 'completed'::public.game_status else status end,
      completed_at = case when p_position = 25 then now() else completed_at end
  where id = p_session_id and status = 'playing'
  returning * into updated_session;

  if not found then
    raise exception 'session is not active';
  end if;

  return query select
    answer_correct,
    question_row.explanation,
    answer_points,
    updated_session.score,
    updated_session.correct_answers,
    updated_session.chances,
    updated_session.status = 'completed';
end;
$$;

revoke all on function public.submit_game_answer(uuid, smallint, smallint) from public;
revoke all on function public.submit_game_answer(uuid, smallint, smallint) from anon;
revoke all on function public.submit_game_answer(uuid, smallint, smallint) from authenticated;
grant execute on function public.submit_game_answer(uuid, smallint, smallint) to service_role;
