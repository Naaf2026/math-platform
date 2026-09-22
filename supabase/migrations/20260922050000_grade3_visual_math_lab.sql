-- Grade 3 Visual Math Lab question bank
-- Curriculum basis: Exploring Maths Student Activity Book 3 (Maldives).
-- Adds Grade 3 questions without changing the existing Visual Math Lab UI.

insert into public.learning_questions (
  id, topic_id, prompt, options, answer, explanation, sort_order,
  difficulty, skill, question_type, interaction_config, hint, animation, media_url, grade
) values
('g3-vml-001','visual-math','Which number is shown by 4 thousands, 6 hundreds, 7 tens and 8 ones?','["4678","4768","40678","467"]','4678','4000 + 600 + 70 + 8 = 4678.',301,'easy','Place value','visual_question','{"visual":{"kind":"number_cards","numbers":[4678,4768,40678,467]}}','Read thousands, hundreds, tens and ones in order.','question-enter',null,3),
('g3-vml-002','visual-math','Which expanded form makes 6,239?','["6000 + 200 + 30 + 9","6000 + 20 + 3 + 9","600 + 200 + 30 + 9","6000 + 200 + 39 + 9"]','6000 + 200 + 30 + 9','6,239 has 6 thousands, 2 hundreds, 3 tens and 9 ones.',302,'easy','Expanded form','visual_question','{"visual":{"kind":"number_cards","numbers":["6000 + 200 + 30 + 9","6000 + 20 + 3 + 9","600 + 200 + 30 + 9","6000 + 200 + 39 + 9"]}}','Split the number by place value.','question-enter',null,3),
('g3-vml-003','visual-math','What number comes next?','["292","293","294","296"]','294','The pattern counts forward by 3: 282, 285, 288, 291, 294.',303,'easy','Counting patterns','visual_question','{"visual":{"kind":"pattern","values":[282,285,288,291]}}','Find how much is added each time.','question-enter',null,3),
('g3-vml-004','visual-math','What number comes next when counting by 100s?','["3150","3250","3300","4150"]','3250','Counting by 100 adds 100 each time.',304,'easy','Counting patterns','visual_question','{"visual":{"kind":"pattern","values":[2850,2950,3050,3150]}}','Add 100 to the last number.','question-enter',null,3),
('g3-vml-005','visual-math','Which number is greatest?','["8236","6175","8326","8263"]','8326','Compare the thousands first, then hundreds, tens and ones.',305,'easy','Compare numbers','visual_question','{"visual":{"kind":"number_cards","numbers":[8236,6175,8326,8263]}}','Compare place values from left to right.','question-enter',null,3),
('g3-vml-006','visual-math','Which number is smallest?','["2193","1392","1932","2319"]','1392','1,392 has the smallest thousands digit.',306,'easy','Compare numbers','visual_question','{"visual":{"kind":"number_cards","numbers":[2193,1392,1932,2319]}}','Start by comparing the thousands digits.','question-enter',null,3),
('g3-vml-007','visual-math','Which list is in ascending order?','["1391, 1614, 3576, 4285","4285, 3576, 1614, 1391","1614, 1391, 4285, 3576","1391, 3576, 1614, 4285"]','1391, 1614, 3576, 4285','Ascending order goes from the smallest number to the greatest.',307,'medium','Ordering numbers','visual_question','{"visual":{"kind":"number_cards","numbers":[4285,3576,1614,1391]}}','Find the smallest first.','question-enter',null,3),
('g3-vml-008','visual-math','Which list is in descending order?','["8878, 8877, 2289, 2287","2287, 2289, 8877, 8878","8877, 8878, 2287, 2289","8878, 2289, 8877, 2287"]','8878, 8877, 2289, 2287','Descending order goes from greatest to smallest.',308,'medium','Ordering numbers','visual_question','{"visual":{"kind":"number_cards","numbers":[2289,8877,2287,8878]}}','Find the greatest first.','question-enter',null,3),
('g3-vml-009','visual-math','Round 2,534 to the nearest ten.','["2500","2530","2540","2600"]','2530','The ones digit is 4, so 2,534 rounds down to 2,530.',309,'medium','Rounding','visual_question','{"visual":{"kind":"number_cards","numbers":[2534,2530,2540]}}','Look at the ones digit.','question-enter',null,3),
('g3-vml-010','visual-math','Round 2,358 to the nearest hundred.','["2300","2350","2400","2500"]','2400','The tens digit is 5, so 2,358 rounds up to 2,400.',310,'medium','Rounding','visual_question','{"visual":{"kind":"number_cards","numbers":[2358,2300,2400]}}','Look at the tens digit.','question-enter',null,3),
('g3-vml-011','visual-math','Which number comes immediately after 4,689?','["4688","4690","4699","4789"]','4690','One more than 4,689 is 4,690.',311,'easy','Number sequence','visual_question','{"visual":{"kind":"pattern","values":[4687,4688,4689]}}','Count forward by one.','question-enter',null,3),
('g3-vml-012','visual-math','Which number belongs between 7,566 and 7,568?','["7565","7567","7569","7667"]','7567','7,567 is one more than 7,566 and one less than 7,568.',312,'easy','Number sequence','visual_question','{"visual":{"kind":"pattern","values":[7566,null,7568]}}','Count forward by one.','question-enter',null,3),
('g3-vml-013','visual-math','What is 5 more than 3,622?','["3627","3617","3672","4122"]','3627','3,622 + 5 = 3,627.',313,'easy','Mental addition','visual_question','{"visual":{"kind":"number_cards","numbers":[3622,3627]}}','Add 5 to the ones place.','question-enter',null,3),
('g3-vml-014','visual-math','What is 9 less than 3,455?','["3446","3464","3454","3365"]','3446','3,455 - 9 = 3,446.',314,'medium','Mental subtraction','visual_question','{"visual":{"kind":"number_cards","numbers":[3455,3446]}}','Subtract 9 carefully.','question-enter',null,3),
('g3-vml-015','visual-math','Add the numbers shown: 478 + 649.','["1027","1127","1117","1227"]','1127','478 + 649 = 1,127.',315,'medium','Addition','visual_question','{"visual":{"kind":"number_cards","numbers":[478,649]}}','Add ones, tens and hundreds by place value.','question-enter',null,3),
('g3-vml-016','visual-math','Three groups show 236, 481 and 176. How many altogether?','["793","883","893","903"]','893','236 + 481 + 176 = 893.',316,'hard','Addition','visual_question','{"visual":{"kind":"number_cards","numbers":[236,481,176]}}','Add all three groups.','question-enter',null,3),
('g3-vml-017','visual-math','Subtract 238 from 459.','["211","221","231","321"]','221','459 - 238 = 221.',317,'medium','Subtraction','visual_question','{"visual":{"kind":"number_cards","numbers":[459,238]}}','Subtract ones, tens and hundreds.','question-enter',null,3),
('g3-vml-018','visual-math','Which answer shows the difference between 86 and 23?','["52","63","73","109"]','63','86 - 23 = 63.',318,'easy','Subtraction','visual_question','{"visual":{"kind":"number_cards","numbers":[86,23]}}','Difference means subtract.','question-enter',null,3),
('g3-vml-019','visual-math','A mountain is 937 m high and another is 650 m high. What is the difference?','["187 m","277 m","287 m","387 m"]','287 m','937 - 650 = 287 metres.',319,'hard','Visual problem solving','visual_question','{"visual":{"kind":"number_cards","numbers":[937,650]}}','Subtract the shorter height from the taller height.','question-enter',null,3),
('g3-vml-020','visual-math','Which mountain height is tallest?','["650 m","721 m","850 m","937 m"]','937 m','937 m is greater than all the other heights.',320,'easy','Compare measurements','visual_question','{"visual":{"kind":"number_cards","numbers":[650,721,850,937]}}','Choose the greatest height.','question-enter',null,3)
on conflict (id) do update set
 topic_id=excluded.topic_id,prompt=excluded.prompt,options=excluded.options,answer=excluded.answer,
 explanation=excluded.explanation,sort_order=excluded.sort_order,difficulty=excluded.difficulty,
 skill=excluded.skill,question_type=excluded.question_type,interaction_config=excluded.interaction_config,
 hint=excluded.hint,animation=excluded.animation,media_url=excluded.media_url,grade=excluded.grade;

-- Grade-aware Visual Math Lab loader. Existing grade-null questions remain as fallback.
create or replace function public.get_visual_questions(
  p_limit integer default 20,
  p_exclude_ids text[] default array[]::text[]
)
returns table(
  id text, prompt text, options jsonb, answer text, explanation text,
  difficulty text, skill text, question_type text, interaction_config jsonb,
  hint text, points integer, grade_level text
)
language sql stable security invoker set search_path=public
as $$
with learner as (
  select nullif(regexp_replace(coalesce(p.grade,''), '[^0-9]', '', 'g'), '')::integer as grade
  from public.profiles p where p.id=auth.uid()
), candidates as (
  select q.id,q.prompt,q.options,q.answer,q.explanation,q.difficulty,q.skill,q.question_type,
         q.interaction_config,q.hint,
         case q.difficulty when 'hard' then 20 when 'medium' then 15 else 10 end as points,
         q.grade::text as grade_level,
         case when q.grade=(select grade from learner) then 0 when q.grade is null then 1 else 2 end as grade_rank
  from public.learning_questions q
  where q.topic_id='visual-math'
    and (q.grade=(select grade from learner) or q.grade is null)
    and not (q.id = any(coalesce(p_exclude_ids,array[]::text[])))
)
select c.id,c.prompt,c.options,c.answer,c.explanation,c.difficulty,c.skill,c.question_type,
       c.interaction_config,c.hint,c.points,c.grade_level
from candidates c
order by c.grade_rank, random()
limit greatest(1,least(coalesce(p_limit,20),20));
$$;

revoke all on function public.get_visual_questions(integer,text[]) from public,anon;
grant execute on function public.get_visual_questions(integer,text[]) to authenticated;
