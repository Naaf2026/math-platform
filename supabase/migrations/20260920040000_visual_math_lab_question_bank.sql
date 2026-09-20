-- Visual Math Lab question bank V1
-- Kid-friendly, visual-first questions for the Premium Visual Math Lab.

insert into public.learning_topics (id, title, description, level, lessons, sort_order) values
('visual-math', 'Visual Math Lab', 'Explore maths through pictures, patterns, shapes and number models.', 'Foundation', 8, 5)
on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  level = excluded.level,
  lessons = excluded.lessons,
  sort_order = excluded.sort_order;

insert into public.learning_questions (
  id, topic_id, prompt, options, answer, explanation, sort_order,
  difficulty, skill, question_type, interaction_config, hint, animation, media_url
) values

('vml-001','visual-math','Look at the counters. How many counters are there altogether?','["7","8","9","10"]','9','There are 4 counters in the first group and 5 in the second group. 4 + 5 = 9.',101,'easy','Addition','visual_question',
'{"visual":{"kind":"counters_addition","groups":[4,5]}}',
'Count both groups.','question-enter',null),

('vml-002','visual-math','Which number is shown by the tens and ones blocks?','["24","34","42","43"]','34','There are 3 tens and 4 ones, so the number is 34.',102,'easy','Place value','visual_question',
'{"visual":{"kind":"tens_ones","tens":3,"ones":4}}',
'Count the tens first, then the ones.','question-enter',null),

('vml-003','visual-math','What number comes next in the pattern?','["12","13","14","15"]','15','The pattern increases by 3: 6, 9, 12, so the next number is 15.',103,'easy','Patterns','visual_question',
'{"visual":{"kind":"pattern","values":[6,9,12]}}',
'Look at how much the numbers increase each time.','question-enter',null),

('vml-004','visual-math','Which shape has 4 equal sides?','["Circle","Triangle","Square","Oval"]','Square','A square has four equal sides.',104,'easy','2D shapes','visual_question',
'{"visual":{"kind":"shape","shape":"square"}}',
'Look at the number and length of the sides.','question-enter',null),

('vml-005','visual-math','Which number has the greatest value?','["8","12","6","10"]','12','12 is greater than 10, 8 and 6.',105,'easy','Number comparison','visual_question',
'{"visual":{"kind":"number_cards","numbers":[8,12,6,10]}}',
'Compare the numbers from left to right.','question-enter',null),

('vml-006','visual-math','How many more counters are in Group 2 than Group 1?','["2","3","4","5"]','3','Group 2 has 8 counters and Group 1 has 5. 8 - 5 = 3.',106,'medium','Subtraction','visual_question',
'{"visual":{"kind":"counters_addition","groups":[5,8]}}',
'Find the difference between the two groups.','question-enter',null),

('vml-007','visual-math','What number is shown by 5 tens and 7 ones?','["507","57","75","52"]','57','Five tens make 50 and seven ones make 7. Together they make 57.',107,'medium','Place value','visual_question',
'{"visual":{"kind":"tens_ones","tens":5,"ones":7}}',
'Five tens are 50.','question-enter',null),

('vml-008','visual-math','What number completes the pattern?','["20","21","22","24"]','24','The pattern increases by 4: 8, 12, 16, 20, 24.',108,'medium','Patterns','visual_question',
'{"visual":{"kind":"pattern","values":[8,12,16,20]}}',
'Find the amount added each time.','question-enter',null),

('vml-009','visual-math','Which shape is shown?','["Circle","Square","Triangle","Rectangle"]','Triangle','The picture shows a triangle with 3 sides.',109,'easy','2D shapes','visual_question',
'{"visual":{"kind":"shape","shape":"triangle"}}',
'Count the sides.','question-enter',null),

('vml-010','visual-math','Which number is the smallest?','["17","9","14","12"]','9','9 is smaller than 12, 14 and 17.',110,'easy','Number comparison','visual_question',
'{"visual":{"kind":"number_cards","numbers":[17,9,14,12]}}',
'Find the number with the least value.','question-enter',null),

('vml-011','visual-math','How many counters are there in all three groups?','["12","13","14","15"]','14','There are 4 + 6 + 4 counters. That makes 14.',111,'medium','Addition','visual_question',
'{"visual":{"kind":"counters_addition","groups":[4,6,4]}}',
'Add the three groups together.','question-enter',null),

('vml-012','visual-math','Which number is represented by 7 tens and 2 ones?','["27","72","70","79"]','72','Seven tens are 70 and two ones are 2, so the number is 72.',112,'medium','Place value','visual_question',
'{"visual":{"kind":"tens_ones","tens":7,"ones":2}}',
'Think: 7 tens = 70.','question-enter',null)

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
  animation = excluded.animation,
  media_url = excluded.media_url;
