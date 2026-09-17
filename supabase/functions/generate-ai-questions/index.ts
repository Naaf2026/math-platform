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
  additionalProperties: false,
  properties: {
    questions: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          prompt: { type: 'string' },
          question_type: { type: 'string', enum: QUESTION_TYPES },
          difficulty: { type: 'string', enum: DIFFICULTIES },
          skill: { type: 'string' },
          topic: { type: 'string' },
          options: { type: 'array', items: { type: 'object', additionalProperties: false, properties: { id: { type: 'string' }, text: { type: 'string' } }, required: ['id','text'] } },
          correct_answer: { type: 'object', additionalProperties: false, properties: { value: { type: 'string' } }, required: ['value'] },
          explanation: { type: 'string' },
          hint: { type: 'string' },
          interaction_config: { type: 'object', additionalProperties: true },
          source_reference: { type: 'object', additionalProperties: true },
          ai_confidence: { type: 'number' }
        },
        required: ['prompt','question_type','difficulty','skill','topic','options','correct_answer','explanation','hint','interaction_config','source_reference','ai_confidence']
      }
    }
  },
  required: ['questions']
};

function json(data: unknown, status = 200) { return new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }); }
function describeError(error: unknown): string { if (error instanceof Error) return error.message; if (typeof error === 'string') return error; try { return JSON.stringify(error); } catch { return String(error); } }

function isDailyQuotaError(status: number, detail: string) {
  const text = detail.toLowerCase();
  return status === 429 && (text.includes('quota exceeded') || text.includes('per day') || text.includes('requestsperday') || text.includes('generate_content_free_tier_requests') || text.includes('daily quota'));
}
function isRetryableGeminiError(status: number, detail: string) {
  if (status === 429) return !isDailyQuotaError(status, detail);
  return status === 500 || status === 502 || status === 503 || status === 504;
}

async function generateWithGemini(model: string, geminiKey: string, prompt: string) {
  const maxAttempts = 3;
  let lastDetail = '';
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(geminiKey)}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: prompt }] }], generationConfig: { responseMimeType: 'application/json', responseJsonSchema: responseSchema, temperature: 0.4 } }),
    });
    const raw = await response.text();
    if (response.ok) return JSON.parse(raw);
    lastDetail = raw.slice(0, 1600);
    if (isDailyQuotaError(response.status, lastDetail)) throw new Error(`Gemini daily quota exceeded for ${model}. Original error: ${lastDetail}`);
    if (!isRetryableGeminiError(response.status, lastDetail) || attempt === maxAttempts) throw new Error(`Gemini API error ${response.status}: ${lastDetail}`);
    const retryAfter = Number(response.headers.get('retry-after'));
    const baseDelay = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : 1000 * (2 ** (attempt - 1));
    await new Promise(resolve => setTimeout(resolve, Math.min(baseDelay + Math.floor(Math.random() * 500), 10000)));
  }
  throw new Error(`Gemini API request failed: ${lastDetail}`);
}

async function generateWithOpenAI(model: string, openaiKey: string, prompt: string) {
  const maxAttempts = 3;
  let lastDetail = '';
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${openaiKey}` },
      body: JSON.stringify({
        model,
        input: [{ role: 'user', content: [{ type: 'input_text', text: prompt }] }],
        text: { format: { type: 'json_schema', name: 'curriculum_questions', strict: false, schema: responseSchema } }
      }),
    });
    const raw = await response.text();
    if (response.ok) {
      const result = JSON.parse(raw);
      const text = result?.output_text ?? result?.output?.flatMap((item: any) => item?.content ?? []).map((item: any) => item?.text ?? '').join('') ?? '';
      if (!text) throw new Error(`OpenAI returned no structured content: ${raw.slice(0, 1200)}`);
      return JSON.parse(text);
    }
    lastDetail = raw.slice(0, 1600);
    if (![429, 500, 502, 503, 504].includes(response.status) || attempt === maxAttempts) throw new Error(`OpenAI API error ${response.status}: ${lastDetail}`);
    const retryAfter = Number(response.headers.get('retry-after'));
    const baseDelay = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : 1000 * (2 ** (attempt - 1));
    await new Promise(resolve => setTimeout(resolve, Math.min(baseDelay + Math.floor(Math.random() * 500), 10000)));
  }
  throw new Error(`OpenAI API request failed: ${lastDetail}`);
}

function normalizeGeneratedQuestion(q: any, book: any, chapter: any, objective: any) {
  const rawOptions = Array.isArray(q.options) ? q.options : [];
  const options = rawOptions
    .map((option: any) => typeof option === 'string' ? option.trim() : String(option?.text ?? '').trim())
    .filter(Boolean);

  const rawAnswer = typeof q.correct_answer === 'object' && q.correct_answer !== null
    ? q.correct_answer.value
    : q.correct_answer;
  const answerValue = String(rawAnswer ?? '').trim();

  // OpenAI may return the option id (A/B/C...) as the correct answer.
  // The existing platform validator compares the answer against option text,
  // so convert an option id to its corresponding option text before saving.
  let answer = answerValue;
  if (Array.isArray(q.options) && answerValue) {
    const matchingOption = q.options.find((option: any) =>
      option && typeof option === 'object' && String(option.id ?? '').trim().toLowerCase() === answerValue.toLowerCase()
    );
    if (matchingOption?.text) answer = String(matchingOption.text).trim();
  }

  return {
    topic: String(q.topic ?? objective?.title ?? chapter?.title ?? book.subject),
    skill: String(q.skill ?? objective?.skill_code ?? 'curriculum'),
    difficulty: q.difficulty,
    question_type: q.question_type,
    prompt: String(q.prompt ?? '').trim(),
    options,
    correct_answer: { value: answer },
    explanation: String(q.explanation ?? '').trim(),
    hint: String(q.hint ?? '').trim(),
    interaction_config: q.interaction_config ?? {},
    source_reference: q.source_reference ?? { book: book.title, chapter: chapter?.title ?? null },
    ai_confidence: Number(q.ai_confidence ?? 0.7),
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'POST required' }, 405);
  let jobId: string | null = null;
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const provider = (Deno.env.get('AI_PROVIDER') ?? 'openai').toLowerCase();
    const openaiKey = Deno.env.get('OPENAI_API_KEY');
    const openaiModel = Deno.env.get('OPENAI_MODEL') ?? 'gpt-5.6-luna';
    const geminiKey = Deno.env.get('GEMINI_API_KEY');
    const geminiModel = Deno.env.get('GEMINI_MODEL') ?? 'gemini-3.6-flash';
    if (!supabaseUrl || !serviceRoleKey) return json({ error: 'AI service is not configured' }, 500);
    if (provider === 'openai' && !openaiKey) return json({ error: 'OpenAI AI service is not configured. Add OPENAI_API_KEY to the Supabase Edge Function secrets.' }, 500);
    if (provider === 'gemini' && !geminiKey) return json({ error: 'Gemini AI service is not configured. Add GEMINI_API_KEY to the Supabase Edge Function secrets.' }, 500);
    if (!['openai', 'gemini'].includes(provider)) return json({ error: `Unsupported AI_PROVIDER: ${provider}` }, 500);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) return json({ error: 'Authentication required' }, 401);
    const admin = createClient(supabaseUrl, serviceRoleKey);
    const { data: { user }, error: userError } = await admin.auth.getUser(authHeader.slice(7));
    if (userError || !user) return json({ error: 'Invalid authentication token', detail: describeError(userError) }, 401);

    const body = await req.json();
    const grade = Number(body.grade), age = body.age == null ? null : Number(body.age), count = Math.max(1, Math.min(100, Number(body.count ?? 10)));
    const difficulty = body.difficulty ?? 'adaptive';
    const questionTypes = Array.isArray(body.question_types) ? body.question_types.filter((x: unknown) => typeof x === 'string' && QUESTION_TYPES.includes(x)) : ['multiple_choice'];
    if (!Number.isInteger(grade) || grade < 1 || grade > 13) return json({ error: 'Invalid grade' }, 400);
    if (age !== null && (!Number.isInteger(age) || age < 3 || age > 25)) return json({ error: 'Invalid age' }, 400);
    if (!['easy','medium','hard','adaptive'].includes(difficulty)) return json({ error: 'Invalid difficulty' }, 400);
    if (!questionTypes.length) return json({ error: 'At least one valid question type is required' }, 400);

    const { data: book, error: bookError } = await admin.from('books').select('id,title,subject,grade,min_age,max_age,academic_year,publisher,processing_status').eq('id', body.book_id).eq('is_active', true).single();
    if (bookError || !book) return json({ error: 'Book not found', detail: describeError(bookError) }, 404);
    if (book.processing_status !== 'indexed') return json({ error: 'Book is not indexed yet', detail: `Current status: ${book.processing_status}` }, 400);
    if (book.grade !== grade) return json({ error: 'Selected book does not match grade' }, 400);

    let chapter: any = null;
    if (body.chapter_id) {
      const result = await admin.from('book_chapters').select('id,title,chapter_number,page_start,page_end,content').eq('id', body.chapter_id).eq('book_id', book.id).single();
      if (result.error || !result.data) return json({ error: 'Chapter not found for selected book', detail: describeError(result.error) }, 404);
      chapter = result.data;
    }
    let objective: any = null;
    if (body.learning_objective_id) {
      const result = await admin.from('learning_objectives').select('id,title,description,skill_code,cognitive_level').eq('id', body.learning_objective_id).eq('book_id', book.id).single();
      if (result.error || !result.data) return json({ error: 'Learning objective not found for selected book', detail: describeError(result.error) }, 404);
      objective = result.data;
    }
    let sections: any[] = [];
    if (chapter) {
      const result = await admin.from('book_sections').select('id,title,page_start,page_end,content').eq('chapter_id', chapter.id).order('section_order').limit(12);
      if (result.error) throw new Error(`Section lookup failed: ${describeError(result.error)}`);
      sections = result.data ?? [];
    }

    const context = [`BOOK: ${book.title}`,`SUBJECT: ${book.subject}`,`GRADE: ${grade}`,`TARGET AGE: ${age ?? `${book.min_age ?? ''}-${book.max_age ?? ''}`}`,`ACADEMIC YEAR: ${book.academic_year ?? 'not specified'}`,`CHAPTER: ${chapter?.title ?? 'not specified'}`,`LEARNING OBJECTIVE: ${objective?.title ?? 'not specified'}`,`OBJECTIVE DESCRIPTION: ${objective?.description ?? ''}`,`SKILL CODE: ${objective?.skill_code ?? ''}`,`COGNITIVE LEVEL: ${objective?.cognitive_level ?? ''}`,`CHAPTER CONTENT:\n${chapter?.content ?? ''}`,`SECTIONS:\n${sections.map(s => `[pages ${s.page_start ?? '?'}-${s.page_end ?? '?'}] ${s.title ?? ''}\n${s.content}`).join('\n\n')}`].join('\n');
    const prompt = `You are the FAHI VISSNUN Curriculum Question Builder. Generate original questions using ONLY the supplied curriculum/book context. Do not invent facts outside the supplied content. Target grade ${grade}, age ${age ?? 'appropriate for the grade'}, subject ${book.subject}. Requested difficulty: ${difficulty}. Requested question types: ${questionTypes.join(', ')}. Generate exactly ${count} questions when enough source context exists. Every question must have one defensible answer, age-appropriate language, plausible distractors, a concise explanation and useful hint. For multiple-choice questions, each option must have a unique id and text, and correct_answer.value must be either the exact option id or the exact option text. For interactive types, populate interaction_config with data required by the renderer. Include source_reference with book title, chapter and page information when available. Avoid duplicates and near-duplicates. Return only JSON matching the schema.\n\n${context}`;

    const model = provider === 'openai' ? openaiModel : geminiModel;
    const { data: job, error: jobError } = await admin.from('ai_generation_jobs').insert({ requested_by: user.id, book_id: book.id, chapter_id: chapter?.id ?? null, learning_objective_id: objective?.id ?? null, grade, age, subject: book.subject, difficulty, question_types: questionTypes, requested_count: count, status: 'processing', model }).select('id').single();
    if (jobError || !job) return json({ error: 'Could not create generation job', detail: describeError(jobError) }, 500);
    jobId = job.id;

    try {
      const result = provider === 'openai' ? await generateWithOpenAI(model, openaiKey!, prompt) : await generateWithGemini(model, geminiKey!, prompt);
      const generated = Array.isArray(result?.questions) ? result.questions : [];
      const rows = generated.slice(0, count).map((q: any) => {
        const normalized = normalizeGeneratedQuestion(q, book, chapter, objective);
        return {
          generation_job_id: job.id,
          book_id: book.id,
          chapter_id: chapter?.id ?? null,
          learning_objective_id: objective?.id ?? null,
          grade,
          age_min: book.min_age,
          age_max: book.max_age,
          subject: book.subject,
          ...normalized,
          validation_status: 'pending',
          validation_errors: []
        };
      });
      const validRows = rows.filter((q: any) => q.prompt && QUESTION_TYPES.includes(q.question_type) && DIFFICULTIES.includes(q.difficulty) && q.correct_answer?.value !== undefined && String(q.correct_answer.value).trim());
      if (!validRows.length) throw new Error(`${provider} generated no valid questions (${generated.length} returned)`);
      const insert = await admin.from('ai_generated_questions').insert(validRows);
      if (insert.error) throw new Error(`Question insert failed: ${describeError(insert.error)}`);
      await admin.from('ai_generation_jobs').update({ generated_count: validRows.length, status: 'completed', completed_at: new Date().toISOString(), error_message: null }).eq('id', job.id);
      return json({ job_id: job.id, generated_count: validRows.length, status: 'completed', provider, model });
    } catch (error) {
      const detail = describeError(error);
      await admin.from('ai_generation_jobs').update({ status: 'failed', error_message: detail.slice(0, 2000) }).eq('id', job.id);
      return json({ error: 'Question generation failed', job_id: job.id, detail, provider, model }, 200);
    }
  } catch (error) {
    return json({ error: 'Unexpected server error', detail: describeError(error), job_id: jobId }, 200);
  }
});