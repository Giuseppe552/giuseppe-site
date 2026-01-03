// src/lib/llm.ts
import OpenAI from "openai";

const apiKey = process.env.OPENAI_API_KEY!;
if (!apiKey) {
  // Don't crash in dev; your route should handle missing key gracefully
  console.warn("[llm] OPENAI_API_KEY not set");
}

export const openai = new OpenAI({ apiKey });

export const LLM_MODEL =
  process.env.LLM_MODEL ||
  // Good default: cheap and accurate for extraction
  "gpt-4o-mini";
