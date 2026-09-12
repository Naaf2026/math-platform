-- Parent Performance Intelligence
-- Applied to the Supabase project before being recorded here.
-- These functions expose only learner performance for an actively linked parent/guardian.

CREATE OR REPLACE FUNCTION public.get_parent_skill_performance(p_student_id uuid)
RETURNS TABLE(skill text, topic text, attempts bigint, correct bigint, accuracy numeric, xp_earned bigint, last_attempt_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp
AS $$
  SELECT COALESCE(NULLIF(lq.skill,''),'General'),
         COALESCE(NULLIF(lq.topic_id,''),'General'),
         count(qa.id), count(*) FILTER (WHERE qa.is_correct),
         round(100.0 * count(*) FILTER (WHERE qa.is_correct) / NULLIF(count(qa.id),0), 1),
         coalesce(sum(qa.xp_awarded),0), max(qa.created_at)
  FROM public.question_attempts qa
  JOIN public.learning_questions lq ON lq.id = qa.question_id
  WHERE qa.user_id = p_student_id
    AND EXISTS (
      SELECT 1 FROM public.student_relationships sr
      WHERE sr.student_id=p_student_id
        AND sr.related_user_id=auth.uid()
        AND sr.relationship IN ('parent','guardian')
        AND sr.status='active'
    )
  GROUP BY COALESCE(NULLIF(lq.skill,''),'General'), COALESCE(NULLIF(lq.topic_id,''),'General')
  ORDER BY count(qa.id) DESC,
           (100.0 * count(*) FILTER (WHERE qa.is_correct) / NULLIF(count(qa.id),0)) ASC;
$$;

REVOKE ALL ON FUNCTION public.get_parent_skill_performance(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_parent_skill_performance(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_parent_weak_skills(p_student_id uuid)
RETURNS TABLE(skill text, topic text, attempts bigint, accuracy numeric, priority integer)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp
AS $$
  SELECT skill, topic, attempts, accuracy,
    CASE WHEN accuracy < 50 THEN 1 WHEN accuracy < 70 THEN 2 ELSE 3 END
  FROM public.get_parent_skill_performance(p_student_id)
  WHERE attempts >= 2 AND accuracy < 80
  ORDER BY CASE WHEN accuracy < 50 THEN 1 WHEN accuracy < 70 THEN 2 ELSE 3 END,
           accuracy, attempts DESC
  LIMIT 8;
$$;

REVOKE ALL ON FUNCTION public.get_parent_weak_skills(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_parent_weak_skills(uuid) TO authenticated;
