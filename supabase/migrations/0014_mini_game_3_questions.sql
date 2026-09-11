-- 0014_mini_game_3_questions.sql
-- Mini Game 3.0: richer game-mechanics questions
-- Safe to run multiple times

insert into public.learning_questions (
  id, topic_id, prompt, options, answer, explanation, sort_order,
  question_type, interaction_config, hint
)
values
(
  'pv-game-1', 'place-value',
  'Build 3 hundreds, 4 tens and 2 ones. What number did you build?',
  '[]'::jsonb, '342',
  '3 hundreds + 4 tens + 2 ones = 342.', 501,
  'manipulatives',
  '{"mode":"base_ten","target":342,"game":"block_builder","maxHundreds":5,"maxTens":9,"maxOnes":9}'::jsonb,
  'Start with the hundreds. Then add tens and ones.'
),
(
  'as-game-1', 'addition-subtraction',
  'Build 18 counters, then take away 5. How many remain?',
  '[]'::jsonb, '13',
  '18 - 5 = 13. Start with 18 counters and remove 5.', 502,
  'manipulatives',
  '{"mode":"counters","target":13,"start":18,"remove":5,"max":25,"game":"take_away"}'::jsonb,
  'Build 18 first. Then remove exactly 5 counters.'
),
(
  'mul-game-1', 'multiplication',
  'Build 4 equal groups of 6. How many counters are there altogether?',
  '[]'::jsonb, '24',
  '4 groups of 6 make 24: 4 × 6 = 24.', 503,
  'manipulatives',
  '{"mode":"groups","target":24,"groups":4,"groupSize":6,"game":"group_builder"}'::jsonb,
  'Make every group the same size: 6 counters.'
),
(
  'frac-game-1', 'fractions',
  'Make one half of the pizza. Select 2 of the 4 slices.',
  '[]'::jsonb, '2/4',
  '2 out of 4 equal slices is one half.', 504,
  'manipulatives',
  '{"mode":"fraction_pizza","target":"2/4","numerator":2,"denominator":4,"game":"pizza_builder"}'::jsonb,
  'There are 4 equal slices. Select 2.'
),
(
  'money-game-1', 'addition-subtraction',
  'Pay exactly MVR 1.50 using coins.',
  '[]'::jsonb, '1.50',
  'MVR 1 + 50 laari = MVR 1.50.', 505,
  'manipulatives',
  '{"mode":"money","target":"1.50","game":"money_shop","currency":"MVR"}'::jsonb,
  'Try one MVR 1 coin and one 50 laari coin.'
),
(
  'geo-game-1', 'place-value',
  'Choose the shape with 3 sides.',
  '[]'::jsonb, 'triangle',
  'A triangle has 3 sides.', 506,
  'manipulatives',
  '{"mode":"geometry","target":"triangle","game":"shape_lab"}'::jsonb,
  'Look for the shape with three straight sides.'
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
