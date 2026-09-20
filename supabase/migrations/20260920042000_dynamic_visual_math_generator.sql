-- Visual Math Lab dynamic generator V1
-- Keeps the curated bank, while adding fresh randomized visual questions on every session.

create or replace function public.get_visual_questions(p_limit integer default 20)
returns table(
  id text,
  prompt text,
  options jsonb,
  answer text,
  explanation text,
  difficulty text,
  skill text,
  question_type text,
  interaction_config jsonb,
  hint text,
  points integer,
  grade_level text
)
language sql stable security invoker set search_path=public
as $$
with requested as (
  select greatest(1, least(coalesce(p_limit,20),20))::integer as n
),
templates as (
  select
    gs,
    ((floor(random()*5))::integer + 1) as kind,
    (floor(random()*9)::integer + 2) as a,
    (floor(random()*9)::integer + 2) as b,
    (floor(random()*9)::integer + 1) as tens,
    (floor(random()*10)::integer) as ones,
    (floor(random()*14)::integer + 4) as start_num,
    (floor(random()*4)::integer + 2) as step,
    (floor(random()*90)::integer + 5) as n1,
    (floor(random()*90)::integer + 5) as n2,
    (floor(random()*90)::integer + 5) as n3,
    (floor(random()*90)::integer + 5) as n4
  from generate_series(1,(select n from requested)) gs
),
normalized as (
  select *,
    start_num + step as p2,
    start_num + step*2 as p3,
    start_num + step*3 as p4,
    start_num + step*4 as p5
  from templates
),
generated as (
  select
    'vml-gen-' || gs::text || '-' || substr(md5(random()::text || clock_timestamp()::text),1,8) id,
    case kind
      when 1 then 'How many counters are there altogether?'
      when 2 then 'Which number is shown by the tens and ones blocks?'
      when 3 then 'What number comes next in the pattern?'
      when 4 then 'Which number has the greatest value?'
      else 'Which shape is shown?'
    end prompt,
    case kind
      when 1 then to_jsonb(array[
        (a+b)::text,
        greatest(1,a+b-1)::text,
        (a+b+1)::text,
        (a+b+2)::text
      ])
      when 2 then to_jsonb(array[
        (tens*10+ones)::text,
        (tens*10+ones+10)::text,
        greatest(10,tens*10+ones-10)::text,
        (ones*10+tens)::text
      ])
      when 3 then to_jsonb(array[
        p5::text,
        (p5+1)::text,
        greatest(1,p5-1)::text,
        (p5+step)::text
      ])
      when 4 then to_jsonb(array[
        greatest(n1,greatest(n2,greatest(n3,n4)))::text,
        least(n1,least(n2,least(n3,n4)))::text,
        (greatest(n1,greatest(n2,greatest(n3,n4)))-1)::text,
        (greatest(n1,greatest(n2,greatest(n3,n4)))+1)::text
      ])
      else to_jsonb(array['Circle','Triangle','Square','Rectangle'])
    end options,
    case kind
      when 1 then (a+b)::text
      when 2 then (tens*10+ones)::text
      when 3 then p5::text
      when 4 then greatest(n1,greatest(n2,greatest(n3,n4)))::text
      else (case ((gs + a + b) % 4) when 0 then 'Circle' when 1 then 'Triangle' when 2 then 'Square' else 'Rectangle' end)
    end answer,
    case kind
      when 1 then a::text || ' + ' || b::text || ' = ' || (a+b)::text || '.'
      when 2 then tens::text || ' tens and ' || ones::text || ' ones make ' || (tens*10+ones)::text || '.'
      when 3 then 'The pattern increases by ' || step::text || '.'
      when 4 then 'The greatest number is the largest value shown.'
      else 'Look carefully at the number of sides and corners.'
    end explanation,
    case when gs % 5 in (0,1,2) then 'easy' when gs % 5 in (3,4) then 'medium' else 'easy' end difficulty,
    case kind when 1 then 'Addition' when 2 then 'Place value' when 3 then 'Patterns' when 4 then 'Number comparison' else 'Geometry' end skill,
    'visual_question'::text question_type,
    case kind
      when 1 then jsonb_build_object('visual',jsonb_build_object('kind','counters_addition','groups',jsonb_build_array(a,b)))
      when 2 then jsonb_build_object('visual',jsonb_build_object('kind','tens_ones','tens',tens,'ones',ones))
      when 3 then jsonb_build_object('visual',jsonb_build_object('kind','pattern','values',jsonb_build_array(start_num,p2,p3,p4)))
      when 4 then jsonb_build_object('visual',jsonb_build_object('kind','number_cards','numbers',jsonb_build_array(n1,n2,n3,n4)))
      else jsonb_build_object('visual',jsonb_build_object('kind','shape','shape',case ((gs + a + b) % 4) when 0 then 'circle' when 1 then 'triangle' when 2 then 'square' else 'rectangle' end))
    end interaction_config,
    case kind
      when 1 then 'Count both groups and add them.'
      when 2 then 'Count the tens first, then the ones.'
      when 3 then 'Find the amount added each time.'
      when 4 then 'Compare all four numbers.'
      else 'Count the sides and look at the corners.'
    end hint,
    case when gs % 5 in (3,4) then 15 else 10 end points,
    null::text grade_level
  from normalized
)
select * from generated
order by random();
$$;

revoke all on function public.get_visual_questions(integer) from public,anon;
grant execute on function public.get_visual_questions(integer) to authenticated;
