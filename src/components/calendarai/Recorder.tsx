// src/components/calendarai/Recorder.tsx
"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  onText: (t: string) => void;
};

// Minimal cross-browser speech recognition type (Chromium / WebKit). We avoid importing lib DOM types
// that may not include the experimental interfaces in some TS versions.
type WSR =
  | ({
      lang: string;
      continuous: boolean;
      interimResults: boolean;
      start: () => void;
      stop: () => void;
      onresult?: (e: any) => void;
      onerror?: (e: any) => void;
      onend?: () => void;
    })
  | null;

export default function Recorder({ onText }: Props) {
  const [recording, setRecording] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const webSpeechAvailable =
    typeof window !== "undefined" &&
    (("webkitSpeechRecognition" in window) || ("SpeechRecognition" in window));

  // Clean up mic tracks on unmount
  useEffect(() => {
    return () => {
      try {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
          mediaRecorderRef.current.stop();
        }
      } catch {}
      try {
        streamRef.current?.getTracks().forEach((t) => t.stop());
      } catch {}
    };
  }, []);

  async function startRecording() {
    setErr(null);

    // 1) Prefer Web Speech API (Chromium) – no roundtrip, best UX
    if (webSpeechAvailable) {
      try {
        // @ts-ignore
        const Recognition = window.webkitSpeechRecognition || window.SpeechRecognition;
  const recObj: WSR = new Recognition();
  if (!recObj) throw new Error("SpeechRecognition unavailable");
  recObj.lang = "en-US";
  recObj.continuous = false;
  recObj.interimResults = false;

        setRecording(true);
        // onresult receives a SpeechRecognitionEvent (with .results and .resultIndex)
        recObj.onresult = (e: any) => {
          const result = e?.results?.[e?.resultIndex] ?? e?.results?.[0];
          const t = result?.[0]?.transcript ?? "";
          if (t) onText(t);
          setRecording(false);
          try { recObj?.stop?.(); } catch {}
        };
        recObj.onerror = (e: any) => {
          setRecording(false);
          setErr("Speech recognition error");
          try { recObj?.stop?.(); } catch {}
        };
        recObj.onend = () => setRecording(false);
        recObj.start();
        return;
      } catch {
        // fall through to MediaRecorder fallback
      }
    }

    // 2) Fallback: record mic → /api/transcribe (Whisper/etc.)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Try multiple mime types (Safari/Firefox differences)
      const mimeCandidates = [
        "audio/webm;codecs=opus",
        "audio/webm",
        "audio/mp4",
        "audio/ogg;codecs=opus",
        ""
      ];
      let chosen = "";
      for (const m of mimeCandidates) {
        if (!m) break;
        if (MediaRecorder.isTypeSupported(m)) { chosen = m; break; }
      }

      const mr = new MediaRecorder(stream, chosen ? { mimeType: chosen } : undefined);
      chunksRef.current = [];

      mr.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };

      mr.onstop = async () => {
        try {
          setBusy(true);
          const blob = new Blob(chunksRef.current, { type: chosen || "audio/webm" });
          const form = new FormData();
          form.append("file", blob, chosen?.includes("mp4") ? "voice.m4a" : "voice.webm");

          const res = await fetch("/api/transcribe", { method: "POST", body: form });
          if (!res.ok) {
            const j = await safeJson(res);
            throw new Error(j?.error || `Transcribe failed (${res.status})`);
          }
          const data = await res.json();
          if (data?.text) onText(data.text);
        } catch (e: any) {
          setErr(e?.message || "Transcription failed");
        } finally {
          setBusy(false);
          // stop mic tracks
          try { stream.getTracks().forEach((t) => t.stop()); } catch {}
          streamRef.current = null;
        }
      };

      mediaRecorderRef.current = mr;
      mr.start();
      setRecording(true);
    } catch {
      setErr("Microphone permission denied or unsupported.");
      setRecording(false);
    }
  }

  function stopRecording() {
    // Web Speech is stopped by its own handlers; this just toggles UI
    if (webSpeechAvailable) {
      setRecording(false);
      return;
    }
    const mr = mediaRecorderRef.current;
    if (mr && mr.state !== "inactive") {
      try { mr.stop(); } catch {}
    }
    setRecording(false);
  }

  return (
    <div className="flex items-center gap-3">
      <button
        disabled={busy}
        onClick={recording ? stopRecording : startRecording}
        className={`rounded-full px-4 py-2 text-sm transition ${
          recording
            ? "bg-rose-500 text-black"
            : "border border-white/15 bg-white/4 hover:bg-white/8"
        }`}
        title={webSpeechAvailable ? "Dictate (on-device)" : "Record & transcribe"}
      >
        {recording ? "Stop" : "Speak"}
      </button>
      {busy && <span className="text-xs text-zinc-400">Transcribing…</span>}
      {err && <span className="text-xs text-rose-400">{err}</span>}
    </div>
  );
}

async function safeJson(res: Response) {
  try { return await res.json(); } catch { return null; }
}
