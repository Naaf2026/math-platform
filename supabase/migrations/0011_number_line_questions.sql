-- Step 6: Number Line interactive questions.
-- Safe to run more than once.

insert into public.learning_questions (
  id, topic_id, prompt, options, answer, explanation, sort_order,
  question_type, interaction_config, hint
)
values
(
  'as-nl-1',
  'addition-subtraction',
  'Start at 12 and move 5 steps to the right. Where do you land?',
  '[]'::jsonb,
  '17',
  'Moving right means adding. 12 + 5 = 17.',
  30,
  'number_line',
  '{"min":0,"max":20,"step":1,"initial":12,"target":17}'::jsonb,
  'Moving right on a number line means add.'
),
(
  'as-nl-2',
  'addition-subtraction',
  'Start at 15 and move 6 steps to the left. Where do you land?',
  '[]'::jsonb,
  '9',
  'Moving left means subtracting. 15 - 6 = 9.',
  31,
  'number_line',
  '{"min":0,"max":20,"step":1,"initial":15,"target":9}'::jsonb,
  'Moving left on a number line means subtract.'
),
(
  'pv-nl-1',
  'place-value',
  'Place the point on 6,000 on the number line.',
  '[]'::jsonb,
  '6000',
  'The point should be placed at 6,000.',
  32,
  'number_line',
  '{"min":0,"max":10000,"step":1000,"initial":0,"target":6000}'::jsonb,
  'Count the thousands from 0.'
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
