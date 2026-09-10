-- Step 5: Drag & Drop interactive questions
-- Safe to run more than once.

insert into public.learning_questions (
  id, topic_id, prompt, options, answer, explanation, sort_order,
  question_type, interaction_config, hint
)
values
(
  'pv-dnd-1',
  'place-value',
  'Drag each number to the correct place-value group.',
  '["4,000","70","5","600"]'::jsonb,
  '{"4,000":"thousands","70":"tens","5":"ones","600":"hundreds"}',
  'The position of a digit tells you its place value: thousands, hundreds, tens, then ones.',
  20,
  'drag_drop',
  '{"zones":[{"id":"thousands","label":"Thousands"},{"id":"hundreds","label":"Hundreds"},{"id":"tens","label":"Tens"},{"id":"ones","label":"Ones"}]}'::jsonb,
  'Look at the number of zeros to identify the place value.'
),
(
  'as-dnd-1',
  'addition-subtraction',
  'Drag each calculation to the correct answer group.',
  '["18 + 7","30 - 12","25 + 5","40 - 9"]'::jsonb,
  '{"18 + 7":"25","30 - 12":"18","25 + 5":"30","40 - 9":"31"}',
  'Work out each calculation first, then place it in the matching answer group.',
  21,
  'drag_drop',
  '{"zones":[{"id":"25","label":"25"},{"id":"18","label":"18"},{"id":"30","label":"30"},{"id":"31","label":"31"}]}'::jsonb,
  'Calculate each expression before dragging it.'
),
(
  'mul-dnd-1',
  'multiplication',
  'Drag each multiplication fact to the correct answer group.',
  '["3 × 4","5 × 6","7 × 2","8 × 5"]'::jsonb,
  '{"3 × 4":"12","5 × 6":"30","7 × 2":"14","8 × 5":"40"}',
  'Use your multiplication facts to match each expression with its product.',
  22,
  'drag_drop',
  '{"zones":[{"id":"12","label":"12"},{"id":"30","label":"30"},{"id":"14","label":"14"},{"id":"40","label":"40"}]}'::jsonb,
  'Think of the times table for each first number.'
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
