-- Grade 1 teaching lessons for the Learn pathway.
insert into public.learning_lessons (id,topic_id,title,objective,lesson_number,sort_order) values
('g1-counting-adding','g1-numbers-50','Counting and adding','Count objects and add two small groups together.',1,1),
('g1-number-names','g1-numbers-100','Number names','Read and write numbers using their names.',1,1),
('g1-tens-ones','g1-numbers-100','Tens and ones','Make groups of ten and identify leftover ones.',2,2),
('g1-before-after','g1-numbers-100','Before and after','Find the number immediately before or after a given number.',3,3),
('g1-comparing','g1-numbers-100','Comparing numbers','Compare two numbers using tens and ones.',4,4),
('g1-ordering','g1-numbers-100','Ordering numbers','Arrange numbers from smallest to greatest or greatest to smallest.',5,5),
('g1-patterns','g1-numbers-100','Number patterns','Find and extend a simple number pattern.',6,6),
('g1-skip-counting','g1-numbers-100','Skip counting','Count forward in equal jumps of two, five or ten.',7,7)
on conflict (id) do update set title=excluded.title, objective=excluded.objective, lesson_number=excluded.lesson_number, sort_order=excluded.sort_order;
