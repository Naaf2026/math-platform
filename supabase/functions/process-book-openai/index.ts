import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const extractionSchema = {
  type: 'object',
  properties: {
    chapters: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          chapter_number: { type: 'integer' },
          title: { type: 'string' },
          description: { type: 'string' },
          page_start: { type: 'integer' },
          page_end: { type: 'integer' },
          content: { type: 'string' },
          sections: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                page_start: { type: 'integer' },
                page_end: { type: 'integer' },
                content: { type: 'string' },
                section_order: { type: 'integer' },
              },
              required: ['title', 'page_start', 'page_end', 'content', 'section_order'],
              additionalProperties: false,
            },
          },
        },
        required: ['chapter_number', 'title', 'description', 'page_start', 'page_end', 'content', 'sections'],
        additionalProperties: false,
      },
    },
    learning_objectives: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          chapter_number: { type: 'integer' },
          title: { type: 'string' },
          description: { type: 'string' },
          skill_code: { type: 'string' },
          cognitive_level: { type: 'string', enum: ['remember', 'understand', 'apply', 'analyse', 'evaluate', 'create'] },
        },
        required: ['chapter_number', 'title', 'description', 'skill_code', 'cognitive_level'],
        additionalProperties: false,
      },
    },
    question_templates: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          chapter_number: { type: 'integer' },
          source_page_start: { type: 'integer' },
          source_page_end: { type: 'integer' },
          template_name: { type: 'string' },
          question_type: { type: 'string' },
          template_text: { type: 'string' },
          variables: { type: 'object', additionalProperties: true },
          answer_rules: { type: 'object', additionalProperties: true },
          illustration_config: { type: 'object', additionalProperties: true },
          interaction_config: { type: 'object', additionalProperties: true },
          example_values: { type: 'object', additionalProperties: true },
          source_excerpt: { type: 'string' },
        },
        required: ['chapter_number','source_page_start','source_page_end','template_name','question_type','template_text','variables','answer_rules','illustration_config','interaction_config','example_values','source_excerpt'],
        additionalProperties: false,
      },
    },
  },
  required: ['chapters', 'learning_objectives', 'question_templates'],
  additionalProperties: false,
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function describeError(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  try { return JSON.stringify(error); } catch { return String(error); }
}

async function openaiFetch(url: string, init: RequestInit, apiKey: string, label: string) {
  for (let attempt = 0; attempt < 3; attempt++) {
    const response = await fetch(url, {
      ...init,
      headers: { ...(init.headers ?? {}), Authorization: `Bearer ${apiKey}` },
    });
    if (response.ok) return response;
    const body = await response.text();
    if (![429, 500, 502, 503, 504].includes(response.status) || attempt === 2) {
      throw new Error(`OpenAI ${label} failed (${response.status}): ${body.slice(0, 1500)}`);
    }
    await new Promise(resolve => setTimeout(resolve, 1500 * (attempt + 1)));
  }
  throw new Error(`OpenAI ${label} failed after retries`);
}

async function uploadPdf(bytes: ArrayBuffer, fileName: string, apiKey: string) {
  const form = new FormData();
  form.append('purpose', 'user_data');
  form.append('file', new Blob([bytes], { type: 'application/pdf' }), fileName || 'textbook.pdf');
  const response = await openaiFetch('https://api.openai.com/v1/files', { method: 'POST', body: form }, apiKey, 'PDF upload');
  return await response.json();
}

async function extractWithOpenAI(fileId: string, book: any, apiKey: string, model: string) {
  const prompt = `You are the textbook indexing engine for a Maldives mathematics learning platform.

Read the attached Grade ${book.grade} ${book.subject} textbook itself. Treat the PDF as the authoritative source. Inspect both text and visual material such as worked examples, diagrams, tables, number lines, manipulatives, shapes, matching activities, fill-in activities, and other student tasks.

Build a reusable source map for future Daily Challenge generation.

IMPORTANT:
- Use only information actually present in the textbook.
- Preserve chapter/lesson/section hierarchy and printed page numbers when visible.
- Preserve mathematical meaning, notation, examples, and age-appropriate pedagogy.
- Identify recurring question/activity patterns, not just topics.
- For each question template, describe the underlying pattern so new values can be generated without copying the original question.
- Capture illustration and interaction requirements as structured JSON. Do not use emoji as a substitute for textbook visuals.
- For number-line activities, describe start/end/step/movement data rather than combining multiple mathematical symbols into one visual cell.
- For place-value activities, describe hundreds/tens/ones counts and the required student inputs.
- For geometry, describe shapes, counts, measurements, labels, and relationships needed by a renderer.
- Keep source excerpts short and faithful.
- Do not invent learning objectives or activities that are not supported by the PDF.
- Return only JSON matching the supplied schema.

Book title: ${book.title}
Grade: ${book.grade}
Subject: ${book.subject}
Academic year: ${book.academic_year ?? 'not specified'}`;

  const body = {
    model,
    input: [{
      role: 'user',
      content: [
        { type: 'input_file', file_id: fileId },
        { type: 'input_text', text: prompt },
      ],
    }],
    temperature: 0.1,
    text: {
      format: {
        type: 'json_schema',
        name: 'textbook_index',
        strict: true,
        schema: extractionSchema,
      },
    },
  };

  const response = await openaiFetch(
    'https://api.openai.com/v1/responses',
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) },
    apiKey,
    'textbook indexing',
  );
  const result = await response.json();
  const text = typeof result?.output_text === 'string'
    ? result.output_text
    : (result?.output ?? [])
      .flatMap((item: any) => item?.content ?? [])
      .filter((part: any) => typeof part?.text === 'string')
      .map((part: any) => part.text)
      .join('');
  if (!text) throw new Error(`OpenAI returned no indexing result: ${JSON.stringify(result).slice(0, 1500)}`);
  return JSON.parse(text);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'POST required' }, 405);

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const openaiKey = Deno.env.get('OPENAI_API_KEY');
  const model = Deno.env.get('OPENAI_BOOK_INDEX_MODEL') ?? Deno.env.get('OPENAI_MODEL') ?? 'gpt-5.6-luna';

  if (!supabaseUrl || !serviceRoleKey || !openaiKey) return json({ error: 'OpenAI indexing is not configured. Add OPENAI_API_KEY to Supabase Edge Function secrets.' }, 500);

  const auth = req.headers.get('Authorization');
  if (!auth?.startsWith('Bearer ')) return json({ error: 'Authentication required' }, 401);

  const admin = createClient(supabaseUrl, serviceRoleKey);
  let stage = 'authentication';

  try {
    const { data: { user }, error: authError } = await admin.auth.getUser(auth.slice(7));
    if (authError || !user) return json({ error: 'Invalid authentication token' }, 401);

    stage = 'admin authorization';
    const { data: roleRow, error: roleError } = await admin.from('user_roles').select('role').eq('user_id', user.id).maybeSingle();
    if (roleError || roleRow?.role !== 'admin') return json({ error: 'Administrator access required' }, 403);

    const body = await req.json();
    const bookId = String(body.book_id ?? '');
    if (!bookId) return json({ error: 'book_id is required' }, 400);

    stage = 'book lookup';
    const { data: book, error: bookError } = await admin
      .from('books')
      .select('id,title,subject,grade,min_age,max_age,academic_year,file_path,file_name,processing_status,is_active')
      .eq('id', bookId)
      .eq('is_active', true)
      .single();

    if (bookError || !book) return json({ error: 'Book not found', detail: describeError(bookError) }, 404);
    if (!book.file_path) return json({ error: 'Book has no stored PDF file' }, 400);

    await admin.from('books').update({ processing_status: 'processing', processing_error: null }).eq('id', book.id);

    try {
      stage = 'PDF download';
      const { data: pdf, error: downloadError } = await admin.storage.from('curriculum-books').download(book.file_path);
      if (downloadError || !pdf) throw new Error(downloadError?.message ?? 'Unable to download stored PDF');

      const bytes = await pdf.arrayBuffer();
      if (!bytes.byteLength) throw new Error('Stored PDF is empty');
      if (bytes.byteLength > 50 * 1024 * 1024) throw new Error('PDF exceeds the 50 MB processing limit');

      stage = 'OpenAI PDF upload';
      const uploaded = await uploadPdf(bytes, book.file_name ?? book.title, openaiKey);
      if (!uploaded?.id) throw new Error(`OpenAI upload returned no file id: ${JSON.stringify(uploaded).slice(0, 1000)}`);

      stage = 'OpenAI textbook extraction';
      const parsed = await extractWithOpenAI(uploaded.id, book, openaiKey, model);
      const chapters = Array.isArray(parsed.chapters) ? parsed.chapters : [];
      const objectives = Array.isArray(parsed.learning_objectives) ? parsed.learning_objectives : [];
      const templates = Array.isArray(parsed.question_templates) ? parsed.question_templates : [];

      if (!chapters.length) throw new Error('OpenAI detected no chapters in the PDF');

      stage = 'old indexed-data cleanup';
      const oldObjectives = await admin.from('learning_objectives').delete().eq('book_id', book.id);
      if (oldObjectives.error) throw oldObjectives.error;
      const oldChapters = await admin.from('book_chapters').delete().eq('book_id', book.id);
      if (oldChapters.error) throw oldChapters.error;
      const oldTemplates = await admin.from('question_templates').delete().eq('book_id', book.id);
      if (oldTemplates.error) throw oldTemplates.error;

      stage = 'chapter insert';
      const chapterRows = chapters.slice(0, 100).map((c: any) => ({
        book_id: book.id,
        chapter_number: Number(c.chapter_number),
        title: String(c.title ?? '').trim(),
        description: String(c.description ?? '').trim(),
        page_start: Number(c.page_start),
        page_end: Number(c.page_end),
        content: String(c.content ?? '').slice(0, 30000),
      })).filter((c: any) => c.title && Number.isFinite(c.chapter_number));

      const { data: insertedChapters, error: chapterInsertError } = await admin.from('book_chapters').insert(chapterRows).select('id,chapter_number');
      if (chapterInsertError) throw chapterInsertError;

      stage = 'section insert';
      const chapterMap = new Map<number, string>((insertedChapters ?? []).map((c: any) => [Number(c.chapter_number), c.id]));
      const sectionRows: any[] = [];

      for (const chapter of chapters) {
        const chapterId = chapterMap.get(Number(chapter.chapter_number));
        if (!chapterId || !Array.isArray(chapter.sections)) continue;
        for (const section of chapter.sections.slice(0, 100)) {
          if (!section?.title) continue;
          sectionRows.push({
            chapter_id: chapterId,
            title: String(section.title).trim(),
            page_start: Number(section.page_start),
            page_end: Number(section.page_end),
            content: String(section.content ?? '').slice(0, 20000),
            section_order: Number.isFinite(Number(section.section_order)) ? Number(section.section_order) : sectionRows.length,
          });
        }
      }
      if (sectionRows.length) {
        const { error } = await admin.from('book_sections').insert(sectionRows);
        if (error) throw error;
      }

      stage = 'learning objective insert';
      const objectiveRows = objectives.map((o: any) => {
        const chapterId = chapterMap.get(Number(o.chapter_number));
        if (!chapterId || !o.title) return null;
        return {
          book_id: book.id,
          chapter_id: chapterId,
          subject: book.subject,
          grade: book.grade,
          title: String(o.title).trim(),
          description: String(o.description ?? '').trim(),
          skill_code: String(o.skill_code ?? '').trim() || null,
          cognitive_level: o.cognitive_level,
        };
      }).filter(Boolean);
      if (objectiveRows.length) {
        const { error } = await admin.from('learning_objectives').insert(objectiveRows);
        if (error) throw error;
      }

      stage = 'question template insert';
      const templateRows = templates.map((t: any) => {
        const chapterId = chapterMap.get(Number(t.chapter_number));
        if (!chapterId || !t.template_name || !t.template_text) return null;
        return {
          book_id: book.id,
          chapter_id: chapterId,
          source_page_start: Number.isFinite(Number(t.source_page_start)) ? Number(t.source_page_start) : null,
          source_page_end: Number.isFinite(Number(t.source_page_end)) ? Number(t.source_page_end) : null,
          template_name: String(t.template_name).trim(),
          question_type: String(t.question_type).trim(),
          template_text: String(t.template_text).trim(),
          variables: t.variables ?? {},
          answer_rules: t.answer_rules ?? {},
          illustration_config: t.illustration_config ?? {},
          interaction_config: t.interaction_config ?? {},
          example_values: t.example_values ?? {},
          source_excerpt: String(t.source_excerpt ?? '').slice(0, 3000),
          active: true,
        };
      }).filter(Boolean);

      if (templateRows.length) {
        const { error } = await admin.from('question_templates').insert(templateRows);
        if (error) throw error;
      }

      stage = 'final book status update';
      const finalUpdate = await admin.from('books').update({
        processing_status: 'indexed',
        processing_error: null,
        indexed_at: new Date().toISOString(),
        indexed_chapter_count: chapterRows.length,
        indexed_section_count: sectionRows.length,
        indexed_objective_count: objectiveRows.length,
      }).eq('id', book.id);
      if (finalUpdate.error) throw finalUpdate.error;

      return json({
        status: 'indexed',
        provider: 'openai',
        model,
        book_id: book.id,
        chapters: chapterRows.length,
        sections: sectionRows.length,
        learning_objectives: objectiveRows.length,
        question_templates: templateRows.length,
      });
    } catch (error) {
      const message = describeError(error);
      console.error('[process-book-openai] FAILED', { bookId: book.id, stage, error: message });
      await admin.from('books').update({ processing_status: 'failed', processing_error: `OpenAI ${stage}: ${message}`.slice(0, 2000) }).eq('id', book.id);
      return json({ error: 'OpenAI book indexing failed', stage, detail: message }, 200);
    }
  } catch (error) {
    const message = describeError(error);
    console.error('[process-book-openai] UNEXPECTED', { stage, error: message });
    return json({ error: 'Unexpected server error', stage, detail: message }, 500);
  }
});
