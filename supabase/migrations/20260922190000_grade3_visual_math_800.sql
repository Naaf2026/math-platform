-- Grade 3 Visual Math Lab: 800 genuinely visual, textbook-aligned questions
-- Derived from the Grade 3 Number Concept and Addition/Subtraction strands.
-- Every item requires interpreting a rendered visual; plain quiz items are excluded.

delete from public.learning_questions where id like 'g3-v2-%';

insert into public.learning_questions
(id,topic_id,prompt,options,answer,explanation,difficulty,skill,question_type,interaction_config,hint,subject,status,tags,grade_level)
select 'g3-v2-pv-'||g,'place-value','What number is shown in the place-value house?',
 jsonb_build_array(n::text,(n+100)::text,(n+10)::text,(n+1)::text),n::text,
 'Read the thousands, hundreds, tens and ones columns.','easy','Place value house','visual_question',
 jsonb_build_object('visual',jsonb_build_object('kind','place_value_house','thousands',n/1000,'hundreds',(n/100)%10,'tens',(n/10)%10,'ones',n%10)),
 'Read each place-value column from left to right.','Mathematics','published',jsonb_build_array('grade3','visual','place-value'),'Grade 3'
from (select g,1200+g*37 as n from generate_series(1,100) g) s
union all
select 'g3-v2-ab-'||g,'number-line-and-abacus','Which number does this abacus represent?',
 jsonb_build_array(n::text,(n+1000)::text,(n+100)::text,(n+10)::text),n::text,
 'Count the beads in the Th, H, T and O columns.','easy','Abacus place value','visual_question',
 jsonb_build_object('visual',jsonb_build_object('kind','abacus','thousands',n/1000,'hundreds',(n/100)%10,'tens',(n/10)%10,'ones',n%10)),
 'Each column represents a different place value.','Mathematics','published',jsonb_build_array('grade3','visual','abacus'),'Grade 3'
from (select g,1000+g*53 as n from generate_series(1,100) g) s
union all
select 'g3-v2-pat-'||g,'skip-counting','What number comes next in the visual pattern?',
 jsonb_build_array((a+5*step)::text,(a+4*step)::text,(a+6*step)::text,(a+3*step)::text),(a+5*step)::text,
 'Continue the same counting interval.','easy','Visual skip counting','visual_question',
 jsonb_build_object('visual',jsonb_build_object('kind','pattern','values',jsonb_build_array(a,a+step,a+2*step,a+3*step,a+4*step))),
 'Look at how much each card increases.','Mathematics','published',jsonb_build_array('grade3','visual','counting'),'Grade 3'
from (select g,200+g*11 as a,(array[2,3,5,10,100])[(g%5)+1] as step from generate_series(1,100) g) s
union all
select 'g3-v2-r10-'||g,'estimation','Use the number line. What is '||n||' rounded to the nearest ten?',
 jsonb_build_array(lo::text,hi::text,(lo-10)::text,(hi+10)::text),(case when n-lo<5 then lo else hi end)::text,
 'Use the nearest multiple of ten on the number line.','medium','Rounding to tens','visual_question',
 jsonb_build_object('visual',jsonb_build_object('kind','rounding_number_line','lower',lo,'value',n,'upper',hi)),
 'Compare the distance to the two endpoints.','Mathematics','published',jsonb_build_array('grade3','visual','rounding'),'Grade 3'
from (select g,n,n-(n%10) lo,n-(n%10)+10 hi from (select g,121+g*23 n from generate_series(1,100) g) x) s
union all
select 'g3-v2-r100-'||g,'estimation','Use the number line. What is '||n||' rounded to the nearest hundred?',
 jsonb_build_array(lo::text,hi::text,(lo-100)::text,(hi+100)::text),(case when n-lo<50 then lo else hi end)::text,
 'Use the nearest multiple of one hundred on the number line.','medium','Rounding to hundreds','visual_question',
 jsonb_build_object('visual',jsonb_build_object('kind','rounding_number_line','lower',lo,'value',n,'upper',hi)),
 'Compare the distance to the two hundreds.','Mathematics','published',jsonb_build_array('grade3','visual','rounding'),'Grade 3'
from (select g,n,n-(n%100) lo,n-(n%100)+100 hi from (select g,650+g*71 n from generate_series(1,100) g) x) s
union all
select 'g3-v2-add-'||g,'addition-subtraction','Use the H-T-O columns to find the sum.',
 jsonb_build_array((a+b)::text,(a+b+10)::text,(a+b-10)::text,(a+b+1)::text),(a+b)::text,
 'Add the values shown in the place-value columns.','medium','Visual column addition','visual_question',
 jsonb_build_object('visual',jsonb_build_object('kind','hto_columns','operation','addition','rows',jsonb_build_array(a,b))),
 'Line up hundreds, tens and ones before adding.','Mathematics','published',jsonb_build_array('grade3','visual','addition'),'Grade 3'
from (select g,120+(g*17)%700 a,105+(g*29)%600 b from generate_series(1,100) g) s
union all
select 'g3-v2-sub-'||g,'addition-subtraction','Use the H-T-O columns to find the difference.',
 jsonb_build_array((a-b)::text,(a-b+10)::text,greatest(0,a-b-10)::text,(a-b+1)::text),(a-b)::text,
 'Subtract the lower value from the upper value using place-value columns.','medium','Visual column subtraction','visual_question',
 jsonb_build_object('visual',jsonb_build_object('kind','hto_columns','operation','subtraction','rows',jsonb_build_array(a,b))),
 'Work through ones, tens and hundreds.','Mathematics','published',jsonb_build_array('grade3','visual','subtraction'),'Grade 3'
from (select g,500+(g*31)%450 a,100+(g*13)%350 b from generate_series(1,100) g) s
union all
select 'g3-v2-mtn-'||g,'addition-subtraction','Look at the mountain diagram. Which peak is tallest?',
 jsonb_build_array('A','B','C','D'),label,
 'Compare the heights printed below the four peaks.','medium','Visual height comparison','visual_question',
 jsonb_build_object('visual',jsonb_build_object('kind','mountain_heights','peaks',jsonb_build_array(
   jsonb_build_object('label','A','height',a),jsonb_build_object('label','B','height',b),
   jsonb_build_object('label','C','height',c),jsonb_build_object('label','D','height',d)))),
 'Find the greatest height, then choose its peak label.','Mathematics','published',jsonb_build_array('grade3','visual','comparison'),'Grade 3'
from (
 select g,a,b,c,d,case greatest(a,b,c,d) when a then 'A' when b then 'B' when c then 'C' else 'D' end label
 from (select g,500+(g*17)%350 a,540+(g*23)%350 b,580+(g*29)%350 c,620+(g*31)%350 d from generate_series(1,100) g) z
) s;

-- Retire the temporary repetitive emergency batch.
update public.learning_questions set status='draft'
where grade_level='Grade 3' and skill='Compare 4-digit numbers' and id like 'g3-fix-%';
