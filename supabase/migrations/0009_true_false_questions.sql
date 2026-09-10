-- Phase 5: true/false interactive questions.
-- Adds real True/False content using the existing interactive question engine.

insert into public.learning_questions (
  id,
  topic_id,
  prompt,
  options,
  answer,
  explanation,
  sort_order,
  question_type,
  interaction_config,
  hint,
  animation,
  time_limit_seconds,
  media_url
)
values
(
  'pv-tf-1',
  'place-value',
  'True or false: In 4,582, the digit 5 has a value of 500.',
  '["True","False"]'::jsonb,
  'True',
  'The 5 is in the hundreds place, so its value is 500.',
  9,
  'true_false',
  '{"layout":"two_choice","trueLabel":"True","falseLabel":"False"}'::jsonb,
  'Find the place of the digit 5.',
  'question-enter',
  null,
  null
),
(
  'as-tf-1',
  'addition-subtraction',
  'True or false: 36 + 19 = 55.',
  '["True","False"]'::jsonb,
  'True',
  '36 + 19 = 36 + 20 − 1 = 55.',
  9,
  'true_false',
  '{"layout":"two_choice","trueLabel":"True","falseLabel":"False"}'::jsonb,
  'Add 20, then subtract 1.',
  'question-enter',
  null,
  null
),
(
  'mul-tf-1',
  'multiplication',
  'True or false: 7 × 6 = 48.',
  '["True","False"]'::jsonb,
  'False',
  '7 × 6 = 42, not 48.',
  9,
  'true_false',
  '{"layout":"two_choice","trueLabel":"True","falseLabel":"False"}'::jsonb,
  'Recall the 7 times table.',
  'question-enter',
  null,
  null
)
on conflict (id) do update set
  topic_id = excluded.topic_id,
  prompt = excluded.prompt,
  options = excluded.options,
  answer = excluded.answer,
  explanation = excluded.explanation,
  sort_order = excluded.sort_order,
  question_type = excluded.question_type,
  interaction_config = excluded.interaction_config,
  hint = excluded.hint,
  animation = excluded.animation,
  time_limit_seconds = excluded.time_limit_seconds,
  media_url = excluded.media_url;
