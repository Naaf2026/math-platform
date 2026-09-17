import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

type Template = {
  template_name: string;
  question_type: string;
  template_text: string;
  variables: Record<string, unknown>;
  answer_rules: Record<string, unknown>;
  illustration_config: Record<string, unknown>;
  interaction_config: Record<string, unknown>;
  example_values: Record<string, unknown>;
  source_excerpt?: string;
};

const allowed = new Set([
  "multiple_choice", "number_input", "text_input", "true_false", "ordering",
  "drag_drop", "number_line", "manipulatives", "geometry", "timed_challenge",
  "visual_question", "visual_table",
]);

function cleanTemplates(value: unknown): Template[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((raw: any) => {
    if (!raw || typeof raw !== "object") return [];
    const question_type = String(raw.question_type || "");
    const template_text = String(raw.template_text || "").trim();
    const template_name = String(raw.template_name || "Textbook template").trim();
    if (!allowed.has(question_type) || !template_text) return [];
    if (!raw.variables || typeof raw.variables !== "object") return [];
    if (!raw.answer_rules || typeof raw.answer_rules !== "object") return [];
    return [{
      template_name,
      question_type,
      template_text,
      variables: raw.variables,
      answer_rules: raw.answer_rules,
      illustration_config: raw.illustration_config && typeof raw.illustration_config === "object" ? raw.illustration_config : {},
      interaction_config: raw.interaction_config && typeof raw.interaction_config === "object" ? raw.interaction_config : {},
      example_values: raw.example_values && typeof raw.example_values === "object" ? raw.example_values : {},
      source_excerpt: typeof raw.source_excerpt === "string" ? raw.source_excerpt.slice(0, 1200) : undefined,
    }];
  });
}

async function askAI(sectionText: string, grade?: number, provider = "openai") {
  const system = `You extract reusable mathematics exercise templates from textbook material. Do NOT invent a new exercise format. Preserve the exercise's instructional structure, sequence, wording pattern, labels, and illustration concept, while turning changeable numbers/content into placeholders such as {start}, {forward}, {backward}. Return structured templates only. Never copy an entire textbook page or its artwork. For every template, identify variables, deterministic answer rules, and deterministic illustration requirements. For arithmetic, express answer_rules as a small JSON operation tree using operations add, subtract, multiply, divide, and value references; never use executable code.`;
  const user = `Grade: ${grade ?? "unknown"}\n\nTEXTBOOK SECTION:\n${sectionText}\n\nReturn 1-8 of the clearest reusable exercise templates from this section. For number-line questions, capture starts/movements and the exact answer relationship. For base-10/place-value/table questions, capture row labels and the hundreds/tens/ones structure. For other visual questions, describe the illustration in structured JSON so the app can render it deterministically.`;

  if (provider === "gemini") {
    const key = Deno.env.get("GEMINI_API_KEY");
    if (!key) throw new Error("GEMINI_API_KEY is not configured");
    const model = Deno.env.get("GEMINI_MODEL") || "gemini-2.5-flash";
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: `${system}\n\n${user}` }] }], generationConfig: { responseMimeType: "application/json" } }),
    });
    if (!res.ok) throw new Error(`Gemini error ${res.status}: ${await res.text()}`);
    const data = await res.json();
    return JSON.parse(data.candidates?.[0]?.content?.parts?.[0]?.text || "{}");
  }

  const key = Deno.env.get("OPENAI_API_KEY");
  if (!key) throw new Error("OPENAI_API_KEY is not configured");
  const model = Deno.env.get("OPENAI_TEMPLATE_MODEL") || "gpt-5-mini";
  const schema = {
    type: "object", additionalProperties: false,
    properties: { templates: { type: "array", items: { type: "object", additionalProperties: true } } },
    required: ["templates"],
  };
  const res = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({ model, input: [{ role: "system", content: system }, { role: "user", content: user }], text: { format: { type: "json_schema", name: "question_templates", strict: false, schema } } }),
  });
  if (!res.ok) throw new Error(`OpenAI error ${res.status}: ${await res.text()}`);
  const data = await res.json();
  const text = data.output_text || data.output?.flatMap((x: any) => x.content || []).map((x: any) => x.text || "").join("")?.trim();
  return JSON.parse(text || "{}");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceKey);
    const body = await req.json();
    const { section_text, book_id, chapter_id, source_page_start, source_page_end, grade } = body;
    if (typeof section_text !== "string" || section_text.trim().length < 40) throw new Error("section_text is required");

    const secret = Deno.env.get("DAILY_QUESTION_CRON_SECRET");
    const cronOk = !!secret && req.headers.get("x-cron-secret") === secret;
    if (!cronOk) {
      const token = req.headers.get("Authorization")?.replace(/^Bearer\s+/i, "");
      if (!token) throw new Error("Authentication required");
      const { data: userData } = await admin.auth.getUser(token);
      if (!userData.user) throw new Error("Invalid session");
      const { data: role } = await admin.from("user_roles").select("role").eq("user_id", userData.user.id).maybeSingle();
      if (!role || !["admin", "teacher"].includes(role.role)) throw new Error("Admin or teacher access required");
    }

    const result = await askAI(section_text.slice(0, 30000), grade, Deno.env.get("AI_PROVIDER") || "openai");
    const templates = cleanTemplates(result?.templates);
    if (!templates.length) throw new Error("No valid templates were extracted");

    const rows = templates.map((t) => ({
      book_id: book_id || null,
      chapter_id: chapter_id || null,
      source_page_start: Number.isFinite(source_page_start) ? source_page_start : null,
      source_page_end: Number.isFinite(source_page_end) ? source_page_end : null,
      template_name: t.template_name,
      question_type: t.question_type,
      template_text: t.template_text,
      variables: t.variables,
      answer_rules: t.answer_rules,
      illustration_config: t.illustration_config,
      interaction_config: t.interaction_config,
      example_values: t.example_values,
      source_excerpt: t.source_excerpt || null,
    }));
    const { data, error } = await admin.from("question_templates").insert(rows).select("id,template_name,question_type,book_id,chapter_id,source_page_start,source_page_end");
    if (error) throw error;
    return new Response(JSON.stringify({ ok: true, count: data?.length || 0, templates: data }), { status: 200, headers: { ...cors, "Content-Type": "application/json" } });
  } catch (error) {
    return new Response(JSON.stringify({ ok: false, error: error instanceof Error ? error.message : String(error) }), { status: 400, headers: { ...cors, "Content-Type": "application/json" } });
  }
});
