// src/app/api/transcribe/route.ts
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "edge";

/** Guardrails */
const MAX_BYTES = 25 * 1024 * 1024; // 25MB OpenAI limit
const ALLOWED_MIME = new Set([
  "audio/webm",
  "audio/ogg",
  "audio/mpeg",
  "audio/mp4",
  "audio/wav",
  "audio/x-m4a",
  "video/mp4", // some Safari recorders produce mp4 containers
]);

function bad(status: number, message: string) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;

    if (!file) return bad(400, "No audio file provided.");

    // Basic validation
    const type = file.type || "";
    if (type && !ALLOWED_MIME.has(type)) {
      return bad(
        415,
        `Unsupported content-type: "${type}". Try webm/ogg/mp4/m4a/wav.`
      );
    }
    if (typeof file.size === "number" && file.size > MAX_BYTES) {
      return bad(413, "File too large (max 25MB).");
    }

    // Optional user hints
    // You can pass ?lang=en to bias language detection
    const url = new URL(req.url);
    const lang = url.searchParams.get("lang") || undefined;

    // Some recorders miss the filename; give OpenAI something sane
    const filename =
      (file as any).name ||
      (type.includes("mp4") || type.includes("m4a") ? "voice.m4a" : "voice.webm");

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    // Whisper v1 (server-side). For cheaper latency you can swap for gpt-4o-mini-transcribe if you prefer.
    const transcript = await openai.audio.transcriptions.create({
      file: new File([file], filename, { type: file.type }), // ensure name is set
      model: "whisper-1",
      language: lang, // leave undefined for auto-detect
      // temperature: 0, // uncomment if you want maximum determinism
    });

    const text = (transcript as any)?.text ?? "";
    return NextResponse.json({ text });
  } catch (err: any) {
    // Normalize OpenAI or network errors into useful messages
    const msg =
      err?.error?.message ||
      err?.message ||
      "Transcription failed. Please try again.";
    return bad(500, msg);
  }
}

// Optional: reject other verbs explicitly
export function GET() {
  return bad(405, "Method not allowed");
}
