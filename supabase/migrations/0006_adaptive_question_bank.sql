-- Phase 4: adaptive question bank and personalised daily missions.

alter table public.learning_questions
  add column if not exists difficulty text not null default 'medium',
  add column if not exists skill text not null default 'core';

alter table public.topic_progress
  add column if not exists mastery integer not null default 0;

update public.learning_questions set difficulty='easy', skill='place value' where id='pv-1';
update public.learning_questions set difficulty='medium', skill='compare numbers' where id='pv-2';
update public.learning_questions set difficulty='easy', skill='addition' where id='as-1';
update public.learning_questions set difficulty='medium', skill='subtraction' where id='as-2';
update public.learning_questions set difficulty='easy', skill='multiplication facts' where id='mul-1';
update public.learning_questions set difficulty='easy', skill='multiplication facts' where id='mul-2';
update public.learning_questions set difficulty='easy', skill='equivalent fractions' where id='fr-1';
update public.learning_questions set difficulty='medium', skill='fraction comparison' where id='fr-2';

insert into public.learning_questions (id, topic_id, prompt, options, answer, explanation, sort_order, difficulty, skill) values
('pv-3','place-value','What is the value of the 6 in 5,641?','["6","60","600","6,000"]','600','The 6 is in the hundreds place, so its value is 600.',3,'place value'),
('pv-4','place-value','Which number is smallest?','["4,208","4,280","4,082","4,820"]','4,082','Compare from left to right. 4,082 is the smallest.',4,'compare numbers'),
('pv-5','place-value','Which number has 8 in the thousands place?','["8,214","2,814","4,821","1,284"]','8,214','In 8,214 the digit 8 is in the thousands place.',5,'place value'),
('pv-6','place-value','What number is 3 thousands + 5 hundreds + 2 tens + 7 ones?','["3,527","3,572","3,257","3,725"]','3,527','3,000 + 500 + 20 + 7 = 3,527.',6,'expanded form'),
('pv-7','place-value','Which is greater: 6,405 or 6,450?','["6,405","6,450","They are equal","Cannot tell"]','6,450','Both have 6 thousands and 4 hundreds; compare the tens: 5 is greater than 0.',7,'compare numbers'),
('pv-8','place-value','What is 10 more than 2,395?','["2,305","2,395","2,405","2,495"]','2,405','Adding 10 changes the tens place: 2,395 + 10 = 2,405.',8,'number patterns'),
('as-3','addition-subtraction','What is 156 + 238?','["384","394","404","414"]','394','156 + 200 = 356, +30 = 386, +8 = 394.',3,'addition'),
('as-4','addition-subtraction','What is 500 − 276?','["214","224","234","244"]','224','500 − 200 = 300, then 300 − 76 = 224.',4,'subtraction'),
('as-5','addition-subtraction','What is 347 + 185?','["522","532","542","552"]','532','347 + 100 = 447, +80 = 527, +5 = 532.',5,'addition'),
('as-6','addition-subtraction','A class has 425 books and receives 175 more. How many books now?','["500","550","600","650"]','600','425 + 175 = 600 books.',6,'word problems'),
('as-7','addition-subtraction','A shop has 800 apples and sells 365. How many remain?','["425","435","445","465"]','435','800 − 365 = 435.',7,'word problems'),
('as-8','addition-subtraction','Mia has 275 stickers, gets 125 more, then gives away 80. How many remain?','["300","320","340","360"]','320','275 + 125 = 400, then 400 − 80 = 320.',8,'multi-step problems'),
('mul-3','multiplication','What is 7 × 8?','["54","56","58","64"]','56','Seven groups of eight make 56.',3,'multiplication facts'),
('mul-4','multiplication','What is 9 × 6?','["45","48","54","63"]','54','Nine groups of six make 54.',4,'multiplication facts'),
('mul-5','multiplication','There are 8 bags with 7 marbles each. How many marbles?','["48","54","56","64"]','56','8 × 7 = 56 marbles.',5,'word problems'),
('mul-6','multiplication','What is 12 × 4?','["36","42","48","52"]','48','12 groups of 4 make 48.',6,'multiplication facts'),
('mul-7','multiplication','Which expression equals 6 × 15?','["6 × 10","5 × 18","3 × 20","2 × 40"]','3 × 20','Both expressions equal 90.',7,'multiplication strategies'),
('mul-8','multiplication','A teacher puts 9 pencils in each of 6 boxes. How many pencils?','["45","54","63","72"]','54','9 × 6 = 54 pencils.',8,'word problems'),
('fr-3','fractions','Which fraction is equivalent to 2/3?','["3/6","4/6","4/9","6/12"]','4/6','Multiplying numerator and denominator by 2 gives 4/6.',3,'equivalent fractions'),
('fr-4','fractions','Which is greater?','["2/5","4/5","3/5","1/5"]','4/5','The fractions have the same denominator, so 4/5 is greatest.',4,'fraction comparison'),
('fr-5','fractions','What is 2/7 + 3/7?','["4/7","5/7","5/14","6/7"]','5/7','The denominators are the same, so add the numerators: 2 + 3 = 5.',5,'adding fractions'),
('fr-6','fractions','What is 6/8 in simplest form?','["1/2","2/3","3/4","4/5"]','3/4','Divide numerator and denominator by 2 to get 3/4.',6,'simplifying fractions'),
('fr-7','fractions','A pizza is cut into 8 equal pieces. Sara eats 3. What fraction remains?','["3/8","4/8","5/8","6/8"]','5/8','8 − 3 = 5 pieces remain, so 5/8 remains.',7,'word problems'),
('fr-8','fractions','Which statement is true?','["1/3 > 1/2","3/4 > 2/4","2/5 > 4/5","1/6 > 1/3"]','3/4 > 2/4','With equal denominators, the larger numerator represents the larger fraction.',8,'fraction comparison')
on conflict (id) do update set topic_id=excluded.topic_id,prompt=excluded.prompt,options=excluded.options,answer=excluded.answer,explanation=excluded.explanation,sort_order=excluded.sort_order,difficulty=excluded.difficulty,skill=excluded.skill;

create or replace function public.get_adaptive_questions(p_limit integer default 10)
returns table(id text, topic_id text, topic text, prompt text, options jsonb, answer text, explanation text, difficulty text, skill text, points integer)
language sql
security definer
set search_path=public
as $$
  with topic_stats as (
    select t.id as topic_id,
           coalesce(tp.questions_answered,0) as answered,
           coalesce(tp.correct_answers,0) as correct,
           case when coalesce(tp.questions_answered,0)=0 then 0
                else round((tp.correct_answers::numeric / tp.questions_answered::numeric)*100) end as accuracy
      from public.learning_topics t
      left join public.topic_progress tp on tp.topic_id=t.id and tp.user_id=auth.uid()
  ),
  candidates as (
    select q.id,q.topic_id,t.title as topic,q.prompt,q.options,q.answer,q.explanation,q.difficulty,q.skill,
           case q.difficulty when 'easy' then 10 when 'medium' then 15 else 20 end as points,
           coalesce(s.accuracy,0) as accuracy,
           row_number() over (partition by q.topic_id order by
             case when not exists (select 1 from public.question_attempts a where a.user_id=auth.uid() and a.question_id=q.id) then 0 else 1 end,
             random()) as topic_rank
      from public.learning_questions q
      join public.learning_topics t on t.id=q.topic_id
      join topic_stats s on s.topic_id=q.topic_id
     where auth.uid() is not null
  ),
  ranked as (
    select c.*,
      case
        when c.accuracy < 60 and c.difficulty='easy' then 0
        when c.accuracy < 60 and c.difficulty='medium' then 1
        when c.accuracy >= 60 and c.accuracy < 80 and c.difficulty='medium' then 0
        when c.accuracy >= 60 and c.accuracy < 80 and c.difficulty='easy' then 1
        when c.accuracy >= 80 and c.difficulty='hard' then 0
        when c.accuracy >= 80 and c.difficulty='medium' then 1
        else 2 end as difficulty_rank,
      row_number() over (order by c.accuracy asc, difficulty_rank, c.topic_rank, random()) as mission_rank
    from candidates c
  )
  select id,topic_id,topic,prompt,options,answer,explanation,difficulty,skill,points
  from ranked
  order by mission_rank
  limit greatest(1,least(coalesce(p_limit,10),20));
$$;

revoke all on function public.get_adaptive_questions(integer) from public,anon;
grant execute on function public.get_adaptive_questions(integer) to authenticated;

create or replace function public.submit_learning_answer(p_question_id text, p_selected_answer text)
returns table(is_correct boolean, correct_answer text, explanation text, xp_awarded integer)
language plpgsql
security definer
set search_path=public
as $$
declare
  v_user_id uuid:=auth.uid();
  v_question public.learning_questions%rowtype;
  v_correct boolean;
  v_xp integer:=0;
  v_attempt_id uuid;
  v_topic_id text;
  v_answered integer;
  v_correct_count integer;
  v_mastery integer;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  select * into v_question from public.learning_questions where id=p_question_id;
  if not found then raise exception 'Question not found'; end if;
  v_correct:=p_selected_answer=v_question.answer;
  insert into public.question_attempts(user_id,question_id,selected_answer,is_correct,xp_awarded)
  values(v_user_id,p_question_id,p_selected_answer,v_correct,0) returning id into v_attempt_id;

  if v_correct then
    v_xp:=case v_question.difficulty when 'easy' then 10 when 'medium' then 15 else 20 end;
    update public.question_attempts set xp_awarded=v_xp where id=v_attempt_id;
    update public.profiles set xp=coalesce(xp,0)+v_xp,updated_at=now() where id=v_user_id;
  end if;

  v_topic_id:=v_question.topic_id;
  insert into public.topic_progress(user_id,topic_id,questions_answered,correct_answers,updated_at)
  values(v_user_id,v_topic_id,1,case when v_correct then 1 else 0 end,now())
  on conflict(user_id,topic_id) do update set
    questions_answered=public.topic_progress.questions_answered+1,
    correct_answers=public.topic_progress.correct_answers+case when v_correct then 1 else 0 end,
    updated_at=now();

  select questions_answered,correct_answers into v_answered,v_correct_count
    from public.topic_progress where user_id=v_user_id and topic_id=v_topic_id;
  v_mastery:=least(100,round((v_correct_count::numeric/greatest(v_answered,1))*100)::integer);
  update public.topic_progress set mastery=v_mastery where user_id=v_user_id and topic_id=v_topic_id;

  perform public.record_learning_activity();
  perform public.refresh_learning_achievements();
  return query select v_correct,v_question.answer,v_question.explanation,v_xp;
end;
$$;

revoke all on function public.submit_learning_answer(text,text) from public,anon;
grant execute on function public.submit_learning_answer(text,text) to authenticated;
