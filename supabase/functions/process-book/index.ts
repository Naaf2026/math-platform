import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const extractionSchema = {
  type: 'object',
  properties: {
    chapters: { type: 'array', items: { type: 'object', properties: {
      chapter_number: { type: 'integer' }, title: { type: 'string' }, description: { type: 'string' }, page_start: { type: 'integer' }, page_end: { type: 'integer' }, content: { type: 'string' },
      sections: { type: 'array', items: { type: 'object', properties: { title: { type: 'string' }, page_start: { type: 'integer' }, page_end: { type: 'integer' }, content: { type: 'string' }, section_order: { type: 'integer' } }, required: ['title','page_start','page_end','content','section_order'] } }
    }, required: ['chapter_number','title','description','page_start','page_end','content','sections'] } },
    learning_objectives: { type: 'array', items: { type: 'object', properties: { chapter_number: { type: 'integer' }, title: { type: 'string' }, description: { type: 'string' }, skill_code: { type: 'string' }, cognitive_level: { type: 'string', enum: ['remember','understand','apply','analyse','evaluate','create'] } }, required: ['chapter_number','title','description','skill_code','cognitive_level'] } }
  }, required: ['chapters','learning_objectives']
};

function json(data: unknown, status = 200) { return new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }); }
function textFromParts(result: any): string { return result?.candidates?.[0]?.content?.parts?.filter((p: any) => typeof p?.text === 'string')?.map((p: any) => p.text)?.join('') ?? ''; }

async function uploadToGemini(bytes: ArrayBuffer, displayName: string, apiKey: string) {
  const start = await fetch(`https://generativelanguage.googleapis.com/upload/v1beta/files?key=${encodeURIComponent(apiKey)}`, { method: 'POST', headers: { 'X-Goog-Upload-Protocol': 'resumable', 'X-Goog-Upload-Command': 'start', 'X-Goog-Upload-Header-Content-Length': String(bytes.byteLength), 'X-Goog-Upload-Header-Content-Type': 'application/pdf', 'Content-Type': 'application/json' }, body: JSON.stringify({ file: { display_name: displayName.slice(0, 512) } }) });
  if (!start.ok) throw new Error(`Gemini upload initialization failed (${start.status})`);
  const uploadUrl = start.headers.get('x-goog-upload-url'); if (!uploadUrl) throw new Error('Gemini did not return an upload URL');
  const upload = await fetch(uploadUrl, { method: 'POST', headers: { 'Content-Length': String(bytes.byteLength), 'X-Goog-Upload-Offset': '0', 'X-Goog-Upload-Command': 'upload, finalize' }, body: bytes });
  if (!upload.ok) throw new Error(`Gemini PDF upload failed (${upload.status})`);
  const data = await upload.json(); const file = data?.file; if (!file?.uri) throw new Error('Gemini PDF upload returned no file URI');
  return { name: file.name, uri: file.uri, mimeType: file.mimeType ?? 'application/pdf' };
}

async function waitForGeminiFile(name: string, apiKey: string) {
  for (let i = 0; i < 12; i++) {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/${name}?key=${encodeURIComponent(apiKey)}`);
    if (response.ok) { const file = await response.json(); if (!file?.state || file.state === 'ACTIVE') return file; if (file.state === 'FAILED') throw new Error('Gemini failed to process the PDF'); }
    await new Promise(resolve => setTimeout(resolve, 1500));
  }
  throw new Error('Timed out waiting for Gemini to process the PDF');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'POST required' }, 405);

  const supabaseUrl = Deno.env.get('SUPABASE_URL'); const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'); const geminiKey = Deno.env.get('GEMINI_API_KEY'); const model = Deno.env.get('GEMINI_MODEL') ?? 'gemini-2.5-flash';
  if (!supabaseUrl || !serviceRoleKey || !geminiKey) return json({ error: 'AI service is not configured' }, 500);
  const auth = req.headers.get('Authorization'); if (!auth?.startsWith('Bearer ')) return json({ error: 'Authentication required' }, 401);

  const admin = createClient(supabaseUrl, serviceRoleKey);
  const { data: { user }, error: authError } = await admin.auth.getUser(auth.slice(7));
  if (authError || !user) return json({ error: 'Invalid authentication token' }, 401);
  const { data: roleRow, error: roleError } = await admin.from('user_roles').select('role').eq('user_id', user.id).maybeSingle();
  if (roleError || roleRow?.role !== 'admin') return json({ error: 'Administrator access required' }, 403);

  try {
    const body = await req.json(); const bookId = String(body.book_id ?? ''); if (!bookId) return json({ error: 'book_id is required' }, 400);
    const { data: book, error: bookError } = await admin.from('books').select('id,title,subject,grade,min_age,max_age,academic_year,file_path,file_name,processing_status,is_active').eq('id', bookId).eq('is_active', true).single();
    if (bookError || !book) return json({ error: 'Book not found' }, 404); if (!book.file_path) return json({ error: 'Book has no stored PDF file' }, 400);
    await admin.from('books').update({ processing_status: 'processing', processing_error: null }).eq('id', book.id);

    try {
      const { data: pdf, error: downloadError } = await admin.storage.from('curriculum-books').download(book.file_path); if (downloadError || !pdf) throw new Error(downloadError?.message ?? 'Unable to download stored PDF');
      const bytes = await pdf.arrayBuffer(); if (bytes.byteLength === 0) throw new Error('Stored PDF is empty'); if (bytes.byteLength > 50 * 1024 * 1024) throw new Error('PDF exceeds the 50 MB processing limit');
      const geminiFile = await uploadToGemini(bytes, book.file_name ?? book.title, geminiKey); await waitForGeminiFile(geminiFile.name, geminiKey);

      const prompt = `You are the FAHI VISSNUN curriculum indexing engine. Analyze the attached curriculum textbook PDF for Grade ${book.grade}, subject ${book.subject}. Build a structured source map for future AI question generation.\n\nRules:\n1. Use only information actually present in the PDF. Never invent chapter names, page numbers, topics, formulas or learning objectives.\n2. Preserve the book's chapter and section hierarchy.\n3. Use printed page numbers when visible; otherwise use the best available PDF page number.\n4. Chapter content should be a concise but information-rich curriculum-grounded summary, not a verbatim reproduction.\n5. Each section content should summarize the concepts, examples, rules, vocabulary, methods and skills taught in that section.\n6. Learning objectives must be directly supported by the chapter content and should be actionable for students.\n7. Keep objectives attached to the correct chapter_number.\n8. For a mathematics book, preserve mathematical meaning, notation and worked-method steps accurately.\n9. Do not include answer keys or exercises as objectives unless they reveal a taught skill.\n10. Return only JSON matching the supplied schema.\n\nBook title: ${book.title}\nGrade: ${book.grade}\nSubject: ${book.subject}\nAcademic year: ${book.academic_year ?? 'not specified'}\n`;
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(geminiKey)}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: prompt }, { file_data: { mime_type: geminiFile.mimeType, file_uri: geminiFile.uri } }] }], generationConfig: { responseMimeType: 'application/json', responseJsonSchema: extractionSchema, temperature: 0.1 } }) });
      if (!response.ok) { const detail = await response.text(); throw new Error(`Gemini indexing failed (${response.status}): ${detail.slice(0, 500)}`); }
      const result = await response.json(); const text = textFromParts(result); if (!text) throw new Error('Gemini returned no indexing result'); const parsed = JSON.parse(text); const chapters = Array.isArray(parsed.chapters) ? parsed.chapters : []; const objectives = Array.isArray(parsed.learning_objectives) ? parsed.learning_objectives : []; if (!chapters.length) throw new Error('No chapters were detected in the PDF');

      await admin.from('learning_objectives').delete().eq('book_id', book.id); await admin.from('book_chapters').delete().eq('book_id', book.id);
      const chapterRows = chapters.slice(0, 100).map((c: any) => ({ book_id: book.id, chapter_number: Number(c.chapter_number), title: String(c.title ?? '').trim(), description: String(c.description ?? '').trim(), page_start: Number(c.page_start), page_end: Number(c.page_end), content: String(c.content ?? '').slice(0, 30000) })).filter((c: any) => c.title && Number.isFinite(c.chapter_number));
      const { data: insertedChapters, error: chapterInsertError } = await admin.from('book_chapters').insert(chapterRows).select('id,chapter_number'); if (chapterInsertError) throw chapterInsertError;
      const chapterMap = new Map<number, string>((insertedChapters ?? []).map((c: any) => [Number(c.chapter_number), c.id])); const sectionRows: any[] = [];
      for (const chapter of chapters) { const chapterId = chapterMap.get(Number(chapter.chapter_number)); if (!chapterId || !Array.isArray(chapter.sections)) continue; for (const section of chapter.sections.slice(0, 100)) { if (!section?.title) continue; sectionRows.push({ chapter_id: chapterId, title: String(section.title).trim(), page_start: Number(section.page_start), page_end: Number(section.page_end), content: String(section.content ?? '').slice(0, 20000), section_order: Number.isFinite(Number(section.section_order)) ? Number(section.section_order) : sectionRows.length }); } }
      if (sectionRows.length) { const { error } = await admin.from('book_sections').insert(sectionRows); if (error) throw error; }
      const objectiveRows = objectives.map((o: any) => { const chapterId = chapterMap.get(Number(o.chapter_number)); if (!chapterId || !o.title) return null; return { book_id: book.id, chapter_id: chapterId, subject: book.subject, grade: book.grade, title: String(o.title).trim(), description: String(o.description ?? '').trim(), skill_code: String(o.skill_code ?? '').trim() || null, cognitive_level: o.cognitive_level }; }).filter(Boolean);
      if (objectiveRows.length) { const { error } = await admin.from('learning_objectives').insert(objectiveRows); if (error) throw error; }
      await admin.from('books').update({ processing_status: 'indexed', processing_error: null, indexed_at: new Date().toISOString(), indexed_chapter_count: chapterRows.length, indexed_section_count: sectionRows.length, indexed_objective_count: objectiveRows.length }).eq('id', book.id);
      return json({ status: 'indexed', book_id: book.id, chapters: chapterRows.length, sections: sectionRows.length, learning_objectives: objectiveRows.length, model });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error); await admin.from('books').update({ processing_status: 'failed', processing_error: message.slice(0, 2000) }).eq('id', book.id); return json({ error: 'Book indexing failed', detail: message }, 502);
    }
  } catch (error) { console.error(error); return json({ error: 'Unexpected server error' }, 500); }
});
