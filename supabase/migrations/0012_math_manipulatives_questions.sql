-- 0012_math_manipulatives_questions.sql
-- Math Manipulatives Question Bank
-- Safe to run multiple times

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
  hint
)
values
(
  'pv-man-1',
  'place-value',
  'Build 342 using hundreds, tens and ones blocks.',
  '[]'::jsonb,
  '342',
  '342 is 3 hundreds, 4 tens and 2 ones.',
  401,
  'manipulatives',
  '{"mode":"base_ten","target":342}'::jsonb,
  'Use 3 hundreds, 4 tens and 2 ones.'
),
(
  'as-man-1',
  'addition-subtraction',
  'Build 24 counters.',
  '[]'::jsonb,
  '24',
  'A set of 24 counters represents the number 24.',
  402,
  'manipulatives',
  '{"mode":"counters","target":24,"max":30}'::jsonb,
  'Count the counters carefully as you build 24.'
),
(
  'mul-man-1',
  'multiplication',
  'Build 4 equal groups of 6. How many are there altogether?',
  '[]'::jsonb,
  '24',
  'Four groups of six make 24: 4 × 6 = 24.',
  403,
  'manipulatives',
  '{"mode":"groups","target":24,"groups":4,"groupSize":6}'::jsonb,
  'Build all 4 groups. Each group needs 6 counters.'
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
  hint = excluded.hint;
