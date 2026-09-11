-- 0013_mini_game_questions.sql
-- Mini-game question bank: fraction pizza, money shop, geometry lab
-- Safe to run multiple times

insert into public.learning_questions (
  id, topic_id, prompt, options, answer, explanation, sort_order,
  question_type, interaction_config, hint
)
values
(
  'frac-pizza-1',
  'fractions',
  'Make one half of the pizza. Tap exactly 2 of the 4 slices.',
  '[]'::jsonb,
  '2',
  'Two of four equal slices is one half: 2/4 = 1/2.',
  501,
  'fraction_pizza',
  '{"slices":4,"target":2}'::jsonb,
  'There are 4 equal slices. One half means 2 of them.'
),
(
  'money-1',
  'addition-subtraction',
  'You are at the shop. Make exactly MVR 1.00 using the coins.',
  '[]'::jsonb,
  '100',
  'The target is 100 cents, which is MVR 1.00.',
  502,
  'money',
  '{"targetCents":100,"coins":[5,10,25,50,100]}'::jsonb,
  'You can use one MVR 1.00 coin, or combine smaller coins.'
),
(
  'geometry-1',
  'fractions',
  'Shape Lab: Which object has 3 sides?',
  '[]'::jsonb,
  'triangle',
  'A triangle has exactly 3 sides.',
  503,
  'geometry',
  '{"shapes":["triangle","square","rectangle","circle"]}'::jsonb,
  'Count the sides. The correct shape has 3.'
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
