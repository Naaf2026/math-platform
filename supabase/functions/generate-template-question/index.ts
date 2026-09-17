import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret" };
const allowedTypes = new Set(["multiple_choice","number_input","text_input","true_false","ordering","drag_drop","number_line","manipulatives","geometry","timed_challenge","visual_question","visual_table"]);

function evalRule(node: any, vars: Record<string, any>, answers: Record<string, any> = {}): any {
  if (node == null) return null;
  if (typeof node === "number" || typeof node === "string" || typeof node === "boolean") {
    if (typeof node === "string" && Object.prototype.hasOwnProperty.call(vars, node)) return vars[node];
    if (typeof node === "string" && Object.prototype.hasOwnProperty.call(answers, node)) return answers[node];
    return node;
  }
  if (Array.isArray(node)) return node.map((x) => evalRule(x, vars, answers));
  const op = node.op;
  if (op === "value") return evalRule(node.name, vars, answers);
  const args = Array.isArray(node.args) ? node.args.map((x: any) => Number(evalRule(x, vars, answers))) : [];
  if (op === "add") return args.reduce((a, b) => a + b, 0);
  if (op === "subtract") return args.slice(1).reduce((a, b) => a - b, args[0] ?? 0);
  if (op === "multiply") return args.reduce((a, b) => a * b, 1);
  if (op === "divide") return args.slice(1).reduce((a, b) => a / b, args[0] ?? 0);
  throw new Error(`Unsupported answer operation: ${op}`);
}

function renderTemplate(text: string, vars: Record<string, any>) {
  return text.replace(/\{([a-zA-Z0-9_]+)\}/g, (_, key) => String(vars[key] ?? `{${key}}`));
}

function makeVisual(type: string, cfg: any, vars: Record<string, any>, answers: Record<string, any>) {
  const base = cfg && typeof cfg === "object" ? structuredClone(cfg) : {};
  if (type === "number_line") {
    const start = Number(vars.start ?? vars.starting_number ?? 0);
    const forward = Number(vars.forward ?? vars.steps_forward ?? 0);
    const backward = Number(vars.backward ?? vars.steps_backward ?? 0);
    return { ...base, type: "number_line", start, forward, backward, firstResult: answers.alima ?? answers.first ?? start + forward, secondResult: answers.ibrahim ?? answers.second ?? start + forward - backward };
  }
  if (type === "visual_table" || type === "visual_question") {
    if (Array.isArray(base.rows)) {
      base.rows = base.rows.map((row: any, i: number) => {
        const key = row.value_variable || row.variable || String.fromCharCode(97 + i);
        const n = Number(vars[key] ?? row.number ?? 0);
        return { ...row, id: row.id || key, hundreds: Math.floor(Math.abs(n) / 100) % 10, tens: Math.floor(Math.abs(n) / 10) % 10, ones: Math.abs(n) % 10, numberFormed: n };
      });
    } else if (Array.isArray(base.values)) {
      base.rows = base.values.map((key: string, i: number) => {
        const n = Number(vars[key] ?? 0);
        return { id: String.fromCharCode(97 + i), hundreds: Math.floor(Math.abs(n) / 100) % 10, tens: Math.floor(Math.abs(n) / 10) % 10, ones: Math.abs(n) % 10, numberFormed: n };
      });
    }
    base.type = type;
    return base;
  }
  return base;
}

async function generateValues(template: any, grade?: number) {
  const names = Object.keys(template.variables || {});
  const key = Deno.env.get("OPENAI_API_KEY");
  if (!key) throw new Error("OPENAI_API_KEY is not configured");
  const model = Deno.env.get("OPENAI_TEMPLATE_MODEL") || "gpt-5-mini";
  const prompt = `Generate safe NEW numeric/content values for this reusable grade ${grade ?? "unknown"} mathematics template. Keep the exact exercise structure. Do not rewrite the template. Avoid values that make the question ambiguous. Return only JSON values for these variables: ${JSON.stringify(names)}. Variable definitions: ${JSON.stringify(template.variables)}. Example values to avoid: ${JSON.stringify(template.example_values || {})}.`;
  const schema = { type: "object", additionalProperties: { type: ["number", "string"] } };
  const res = await fetch("https://api.openai.com/v1/responses", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` }, body: JSON.stringify({ model, input: prompt, text: { format: { type: "json_schema", name: "template_values", strict: false, schema } } }) });
  if (!res.ok) throw new Error(`OpenAI error ${res.status}: ${await res.text()}`);
  const data = await res.json();
  const text = data.output_text || data.output?.flatMap((x: any) => x.content || []).map((x: any) => x.text || "").join("");
  const values = JSON.parse(text || "{}");
  for (const n of names) if (!(n in values)) throw new Error(`Missing generated value: ${n}`);
  return values;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const db = createClient(url, service);
    const body = await req.json();
    const templateId = body.template_id;
    if (!templateId) throw new Error("template_id is required");

    const secret = Deno.env.get("DAILY_QUESTION_CRON_SECRET");
    const cronOk = !!secret && req.headers.get("x-cron-secret") === secret;
    let userId: string | null = null;
    if (!cronOk) {
      const token = req.headers.get("Authorization")?.replace(/^Bearer\s+/i, "");
      if (!token) throw new Error("Authentication required");
      const { data } = await db.auth.getUser(token);
      if (!data.user) throw new Error("Invalid session");
      userId = data.user.id;
      const { data: role } = await db.from("user_roles").select("role").eq("user_id", userId).maybeSingle();
      if (!role || !["admin", "teacher"].includes(role.role)) throw new Error("Admin or teacher access required");
    }

    const { data: template, error: templateError } = await db.from("question_templates").select("*").eq("id", templateId).eq("active", true).single();
    if (templateError || !template) throw new Error("Template not found");
    if (!allowedTypes.has(template.question_type)) throw new Error("Unsupported template question type");

    const values = body.values && typeof body.values === "object" ? body.values : await generateValues(template, body.grade);
    const answers: Record<string, any> = {};
    for (const [key, rule] of Object.entries(template.answer_rules || {})) answers[key] = evalRule(rule, values, answers);

    const prompt = renderTemplate(template.template_text, values);
    const visual = makeVisual(template.question_type, template.illustration_config, values, answers);
    const interaction = { ...(template.interaction_config || {}) };
    if (template.question_type === "number_line" || template.question_type === "visual_table" || template.question_type === "visual_question") interaction.visual = visual;

    const primaryAnswer = Object.keys(answers).length === 1 ? answers[Object.keys(answers)[0]] : answers;
    const id = `tpl-${crypto.randomUUID().replaceAll("-", "")}`;
    const topic = body.topic || template.template_name;
    const topicId = String(body.topic_id || topic).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "textbook";

    await db.from("learning_topics").upsert({ id: topicId, title: topic, description: "Textbook-derived practice", level: (Number(body.grade) || 5) <= 4 ? "Foundation" : "Development", lessons: 1, sort_order: 900 }, { onConflict: "id", ignoreDuplicates: true });
    const { error: qError } = await db.from("learning_questions").insert({ id, topic_id: topicId, prompt, options: template.question_type === "multiple_choice" ? (body.options || []) : null, answer: typeof primaryAnswer === "object" ? JSON.stringify(primaryAnswer) : String(primaryAnswer), explanation: body.explanation || "Solve it using the method shown in the textbook exercise.", sort_order: Date.now(), difficulty: body.difficulty || "medium", skill: body.skill || "textbook-practice", question_type: template.question_type, interaction_config: interaction, hint: body.hint || null, animation: "question-enter", media_url: null, grade: Number(body.grade) || null, source_book_id: template.book_id, source_chapter_id: template.chapter_id, source_page_start: template.source_page_start, source_page_end: template.source_page_end, template_id: template.id });
    if (qError) throw qError;

    const { error: instanceError } = await db.from("question_template_instances").insert({ template_id: template.id, learning_question_id: id, values });
    if (instanceError) throw instanceError;

    return new Response(JSON.stringify({ ok: true, question_id: id, prompt, answer: primaryAnswer, values, interaction_config: interaction }), { status: 200, headers: { ...cors, "Content-Type": "application/json" } });
  } catch (error) {
    return new Response(JSON.stringify({ ok: false, error: error instanceof Error ? error.message : String(error) }), { status: 400, headers: { ...cors, "Content-Type": "application/json" } });
  }
});
