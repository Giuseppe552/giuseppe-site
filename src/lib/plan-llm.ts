// src/lib/plan-llm.ts
import { openai, LLM_MODEL } from "./llm";

export type DraftEvent = {
  summary: string;          // e.g., "Deep work"
  startISO: string;         // ISO 8601 with timezone
  endISO: string;           // ISO 8601 with timezone
  protected?: boolean;      // cannot be overridden
  location?: string;
  notes?: string;
};

export type PlanResult =
  | { ok: true; events: DraftEvent[]; warnings?: string[] }
  | { ok: false; error: string };

const tzFallback = process.env.TIMEZONE || "Europe/London";

/**
 * Convert a free-text plan into structured events with dates/times.
 * - Anchors to “today” unless the text specifies a date (e.g., "tomorrow", "18th Nov", "next Tue").
 * - Enforces JSON-only response.
 * - Keeps outputs auditable & deterministic.
 */
export async function planToDrafts(
  text: string,
  opts?: { timezone?: string; todayISO?: string }
): Promise<PlanResult> {
  if (!openai.apiKey) return { ok: false, error: "OPENAI_API_KEY is not set" };

  const timezone = opts?.timezone || tzFallback;
  const todayISO = opts?.todayISO || new Date().toISOString().slice(0, 10);

  // JSON schema we want back
  const schema = {
    type: "object",
    properties: {
      events: {
        type: "array",
        items: {
          type: "object",
          properties: {
            summary: { type: "string" },
            startISO: { type: "string" },
            endISO: { type: "string" },
            protected: { type: "boolean" },
            location: { type: "string" },
            notes: { type: "string" },
          },
          required: ["summary", "startISO", "endISO"],
          additionalProperties: false,
        },
      },
      warnings: { type: "array", items: { type: "string" } },
    },
    required: ["events"],
    additionalProperties: false,
  };

  const system = [
    "You convert natural language plans into concrete calendar events.",
    "Use the provided timezone and today's date for relative phrases.",
    "Resolve durations and sequences rationally (no overlaps unless user says).",
    'Mark events as {"protected": true} if user says protected/no meetings override.',
    "Output ONLY valid JSON, matching the JSON schema you are given.",
  ].join(" ");

  const user = [
    `Timezone: ${timezone}`,
    `Today: ${todayISO}`,
    "Plan:",
    text,
  ].join("\n");

  try {
    // Use “JSON mode” via response_format and tool-less schema guidance.
    const resp = await openai.chat.completions.create({
      model: LLM_MODEL,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        {
          role: "user",
          content:
            user +
            "\n\nReturn JSON with fields { events:[{summary,startISO,endISO,protected?,location?,notes?}], warnings? }.",
        },
        {
          role: "system",
          content:
            "Be strict: include timezone offsets in ISO (e.g., 2025-11-18T09:00:00+00:00).",
        },
      ],
      temperature: 0.1,
    });

    const raw = resp.choices[0]?.message?.content || "{}";
    const json = JSON.parse(raw);

    // Quick shape guard
    if (!json?.events || !Array.isArray(json.events)) {
      return { ok: false, error: "Model returned unexpected shape" };
    }

    // Minimal validation + normalization
    const events: DraftEvent[] = json.events
      .filter((e: any) => e?.summary && e?.startISO && e?.endISO)
      .map((e: any) => ({
        summary: String(e.summary),
        startISO: String(e.startISO),
        endISO: String(e.endISO),
        protected: Boolean(e.protected),
        location: e.location ? String(e.location) : undefined,
        notes: e.notes ? String(e.notes) : undefined,
      }));

    if (!events.length) {
      return { ok: false, error: "No events recognized" };
    }

    return { ok: true, events, warnings: json.warnings || [] };
  } catch (err: any) {
    return { ok: false, error: err?.message || "LLM parsing failed" };
  }
}
