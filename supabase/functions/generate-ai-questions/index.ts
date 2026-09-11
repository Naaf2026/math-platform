import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const QUESTION_TYPES = ['multiple_choice','number_input','text_input','true_false','ordering','drag_drop','number_line','manipulatives','geometry','timed_challenge'];
const DIFFICULTIES = ['easy','medium','hard'];

const responseSchema = {
  type: 'object',
  properties: {
    questions: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          prompt: { type: 'string' },
          question_type: { type: 'string', enum: QUESTION_TYPES },
          difficulty: { type: 'string', enum: DIFFICULTIES },
          skill: { type: 'string' },
          topic: { type: 'string' },
          options: { type: 'array', items: { type: 'object', properties: { id: { type: 'string' }, text: { type: 'string' } }, required: ['id','text'] } },
          correct_answer: { type: 'object', properties: { value: { type: 'string' } }, required: ['value'] },
          explanation: { type: 'string' },
          hint: { type: 'string' },
          interaction_config: { type: 'object' },
          source_reference: { type: 'object' },
          ai_confidence: { type: 'number' }
        },
        required: ['prompt','question_type','difficulty','skill','topic','options','correct_answer','explanation','hint','interaction_config','source_reference','ai_confidence']
      }
    }
  },
  required: ['questions']
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'POST required' }, 405);

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const geminiKey = Deno.env.get('GEMINI_API_KEY');
    const model = Deno.env.get('GEMINI_MODEL') ?? 'gemini-2.5-flash';
    if (!supabaseUrl || !serviceRoleKey || !geminiKey) return json({ error: 'AI service is not configured' }, 500);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) return json({ error: 'Authentication required' }, 401);
    const admin = createClient(supabaseUrl, serviceRoleKey);
    const { data: { user }, error: userError } = await admin.auth.getUser(authHeader.slice(7));
    if (userError || !user) return json({ error: 'Invalid authentication token' }, 401);

    const body = await req.json();
    const grade = Number(body.grade);
    const age = body.age == null ? null : Number(body.age);
    const count = Math.max(1, Math.min(100, Number(body.count ?? 10)));
    const difficulty = body.difficulty ?? 'adaptive';
    const questionTypes = Array.isArray(body.question_types) ? body.question_types.filter((x: unknown) => typeof x === 'string' && QUESTION_TYPES.includes(x)) : ['multiple_choice'];

    if (!Number.isInteger(grade) || grade < 1 || grade > 13) return json({ error: 'Invalid grade' }, 400);
    if (age !== null && (!Number.isInteger(age) || age < 3 || age > 25)) return json({ error: 'Invalid age' }, 400);
    if (!['easy','medium','hard','adaptive'].includes(difficulty)) return json({ error: 'Invalid difficulty' }, 400);
    if (!questionTypes.length) return json({ error: 'At least one valid question type is required' }, 400);

    const { data: book, error: bookError } = await admin.from('books').select('id,title,subject,grade,min_age,max_age,academic_year,publisher,processing_status').eq('id', body.book_id).eq('is_active', true).single();
    if (bookError || !book) return json({ error: 'Book not found' }, 404);
    if (book.grade !== grade) return json({ error: 'Selected book does not match grade' }, 400);

    let chapter: any = null;
    if (body.chapter_id) {
      const result = await admin.from('book_chapters').select('id,title,chapter_number,page_start,page_end,content').eq('id', body.chapter_id).eq('book_id', book.id).single();
      if (result.error || !result.data) return json({ error: 'Chapter not found for selected book' }, 404);
      chapter = result.data;
    }

    let objective: any = null;
    if (body.learning_objective_id) {
      const result = await admin.from('learning_objectives').select('id,title,description,skill_code,cognitive_level').eq('id', body.learning_objective_id).eq('book_id', book.id).single();
      if (result.error || !result.data) return json({ error: 'Learning objective not found for selected book' }, 404);
      objective = result.data;
    }

    let sections: any[] = [];
    if (chapter) {
      const result = await admin.from('book_sections').select('id,title,page_start,page_end,content').eq('chapter_id', chapter.id).order('section_order').limit(12);
      if (!result.error) sections = result.data ?? [];
    }

    const context = [
      `BOOK: ${book.title}`,
      `SUBJECT: ${book.subject}`,
      `GRADE: ${grade}`,
      `TARGET AGE: ${age ?? `${book.min_age ?? ''}-${book.max_age ?? ''}`}`,
      `ACADEMIC YEAR: ${book.academic_year ?? 'not specified'}`,
      `CHAPTER: ${chapter?.title ?? 'not specified'}`,
      `LEARNING OBJECTIVE: ${objective?.title ?? 'not specified'}`,
      `OBJECTIVE DESCRIPTION: ${objective?.description ?? ''}`,
      `SKILL CODE: ${objective?.skill_code ?? ''}`,
      `COGNITIVE LEVEL: ${objective?.cognitive_level ?? ''}`,
      `CHAPTER CONTENT:\n${chapter?.content ?? ''}`,
      `SECTIONS:\n${sections.map(s => `[pages ${s.page_start ?? '?'}-${s.page_end ?? '?'}] ${s.title ?? ''}\n${s.content}`).join('\n\n')}`
    ].join('\n');

    const prompt = `You are the FAHI VISSNUN Curriculum Question Builder. Generate original questions using ONLY the supplied curriculum/book context. Do not invent facts outside the supplied content. Target grade ${grade}, age ${age ?? 'appropriate for the grade'}, subject ${book.subject}. Requested difficulty: ${difficulty}. Requested question types: ${questionTypes.join(', ')}. Generate exactly ${count} questions when enough source context exists. Every question must have one defensible answer, age-appropriate language, plausible distractors, a concise explanation and useful hint. For interactive types, populate interaction_config with data required by the renderer. Include source_reference with book title, chapter and page information when available. Avoid duplicates and near-duplicates. Return only JSON matching the schema.\n\n${context}`;

    const { data: job, error: jobError } = await admin.from('ai_generation_jobs').insert({
      requested_by: user.id, book_id: book.id, chapter_id: chapter?.id ?? null, learning_objective_id: objective?.id ?? null,
      grade, age, subject: book.subject, difficulty, question_types, requested_count: count, status: 'processing', model
    }).select('id').single();
    if (jobError || !job) return json({ error: 'Could not create generation job' }, 500);

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(geminiKey)}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: 'application/json', responseJsonSchema: responseSchema, temperature: 0.4 }
        })
      });
      if (!response.ok) throw new Error(`Gemini API error ${response.status}`);
      const result = await response.json();
      const text = result?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new Error('Gemini returned no structured content');
      const parsed = JSON.parse(text);
      const generated = Array.isArray(parsed.questions) ? parsed.questions : [];

      const rows = generated.slice(0, count).map((q: any) => ({
        generation_job_id: job.id, book_id: book.id, chapter_id: chapter?.id ?? null, learning_objective_id: objective?.id ?? null,
        grade, age_min: book.min_age, age_max: book.max_age, subject: book.subject,
        topic: String(q.topic ?? objective?.title ?? chapter?.title ?? book.subject), skill: String(q.skill ?? objective?.skill_code ?? 'curriculum'),
        difficulty: q.difficulty, question_type: q.question_type, prompt: q.prompt, options: q.options ?? [],
        correct_answer: q.correct_answer ?? { value: '' }, explanation: q.explanation ?? '', hint: q.hint ?? '',
        interaction_config: q.interaction_config ?? {}, source_reference: q.source_reference ?? { book: book.title, chapter: chapter?.title ?? null },
        ai_confidence: Number(q.ai_confidence ?? 0.7), validation_status: 'pending', validation_errors: []
      }));

      const validRows = rows.filter((q: any) => q.prompt && QUESTION_TYPES.includes(q.question_type) && DIFFICULTIES.includes(q.difficulty) && q.correct_answer?.value !== undefined);
      if (validRows.length) {
        const insert = await admin.from('ai_generated_questions').insert(validRows);
        if (insert.error) throw insert.error;
      }
      await admin.from('ai_generation_jobs').update({ generated_count: validRows.length, status: 'completed', completed_at: new Date().toISOString() }).eq('id', job.id);
      return json({ job_id: job.id, generated_count: validRows.length, status: 'completed' });
    } catch (error) {
      await admin.from('ai_generation_jobs').update({ status: 'failed', error_message: String(error instanceof Error ? error.message : error) }).eq('id', job.id);
      return json({ error: 'Question generation failed', job_id: job.id }, 502);
    }
  } catch (error) {
    console.error(error);
    return json({ error: 'Unexpected server error' }, 500);
  }
});
