-- Phase 5: ordering / sequencing interactive questions.
-- Uses exact pipe-delimited answer strings because the ordering renderer
-- submits the learner's final sequence as item1|item2|item3...

insert into public.learning_questions (
  id, topic_id, prompt, options, answer, explanation, sort_order,
  difficulty, skill, question_type, interaction_config, hint, animation
) values
(
  'pv-order-1',
  'place-value',
  'Put the place-value positions in order from greatest to smallest.',
  '["Ones","Hundreds","Tens","Thousands"]'::jsonb,
  'Thousands|Hundreds|Tens|Ones',
  'A thousands place is greater than a hundreds place, which is greater than tens, then ones.',
  20,
  'easy',
  'place_value_order',
  'ordering',
  '{"direction":"greatest_to_smallest","label":"Place-value order"}'::jsonb,
  'Start with the place that represents the largest value.',
  'question-enter'
),
(
  'as-order-1',
  'addition-subtraction',
  'Put these numbers in order from smallest to greatest.',
  '["47","12","35","68"]'::jsonb,
  '12|35|47|68',
  'Compare the tens digits first. The numbers increase from 12 to 35 to 47 to 68.',
  20,
  'easy',
  'number_order',
  'ordering',
  '{"direction":"smallest_to_greatest","label":"Number order"}'::jsonb,
  'Look at the tens digit first, then compare the ones digit when needed.',
  'question-enter'
),
(
  'mul-order-1',
  'multiplication',
  'Put these multiplication facts in order from smallest product to largest product.',
  '["8 × 2","5 × 6","7 × 4","9 × 3"]'::jsonb,
  '8 × 2|9 × 3|5 × 6|7 × 4',
  'The products are 16, 27, 30 and 28. Therefore the correct order is 16, 27, 28, 30.',
  20,
  'medium',
  'multiplication_order',
  'ordering',
  '{"direction":"smallest_to_greatest","label":"Order the products"}'::jsonb,
  'Work out each multiplication fact before comparing the products.',
  'question-enter'
)
on conflict (id) do update set
  topic_id = excluded.topic_id,
  prompt = excluded.prompt,
  options = excluded.options,
  answer = excluded.answer,
  explanation = excluded.explanation,
  sort_order = excluded.sort_order,
  difficulty = excluded.difficulty,
  skill = excluded.skill,
  question_type = excluded.question_type,
  interaction_config = excluded.interaction_config,
  hint = excluded.hint,
  animation = excluded.animation;

-- Keep the ordering interaction available to authenticated learners through
-- the existing adaptive RPC; no function recreation is needed here because
-- migration 0008 already exposes question_type and interaction_config.
