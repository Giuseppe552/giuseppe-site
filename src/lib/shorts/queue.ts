type ShortInput = {
  email: string;
  role: "owner" | "tester" | "anon";
  input: {
    topic: string; brand: string; durationSec: number; aspect: "9:16"|"1:1"|"16:9";
    voice: string; style: string; cta?: string; language: string;
  };
};

const mem = new Map<string, any>(); // replace with Redis/Prisma later

export async function enqueueShortJob(payload: ShortInput) {
  const jobId = Math.random().toString(36).slice(2);
  mem.set(jobId, { status: "queued", payload });
  // Fire-and-forget local worker (dev). In prod run a real worker.
  processShort(jobId).catch(err => {
    mem.set(jobId, { status:"error", error: String(err) });
  });
  return { jobId };
}

export async function getJobStatus(jobId: string) {
  return mem.get(jobId);
}

async function processShort(jobId: string) {
  const job = mem.get(jobId);
  mem.set(jobId, { ...job, status: "running" });

  // 1) Script
  const script = await writeScript(job.payload.input);

  // 2) TTS
  const { audioPath, words } = await synthesize(script, job.payload.input.voice);

  // 3) Visuals (fetch stock or generate image slides)
  const bgClips = await fetchStock(job.payload.input.topic, job.payload.input.aspect);

  // 4) Captions (build SRT/ASS from `words` timings)
  const srtPath = await makeSrtFromWords(words, job.payload.input.language);

  // 5) Compose with ffmpeg
  const outPath = await composeVideo({
    bgClips,
    audioPath,
    srtPath,
    aspect: job.payload.input.aspect,
    durationSec: job.payload.input.durationSec,
    watermark: job.payload.role !== "owner",
  });

  // 6) Upload to storage (return public URL)
  const fileUrl = await uploadToBucket(outPath, `ai-shorts/${jobId}.mp4`);

  mem.set(jobId, { status: "completed", fileUrl });
}

// --- stub helpers you’ll implement ---
async function writeScript(input: any): Promise<string> {
  // Call your LLM here. Keep it < 900 chars. Cache by (topic+style+language).
  return `HOOK: ${input.topic}\n• Point 1\n• Point 2\nCTA: ${input.cta || "Follow for more"}`;
}
async function synthesize(text: string, voice: string) {
  // Call your TTS provider; return { audioPath, words: [{start,end,text},...] }
  return { audioPath: "/tmp/voiceover.mp3", words: [] as any[] };
}
async function fetchStock(topic: string, aspect: string) {
  // Call Pexels/Unsplash video APIs; return 1–3 local file paths.
  return ["/tmp/bg1.mp4"];
}
async function makeSrtFromWords(words: any[], lang: string) {
  return "/tmp/subs.srt";
}
async function composeVideo(args: {
  bgClips: string[]; audioPath: string; srtPath: string;
  aspect: "9:16"|"1:1"|"16:9"; durationSec: number; watermark: boolean;
}) {
  // Use ffmpeg cli: concat bgClips → scale/crop to aspect → overlay subtitles → mix audio → export
  // Return local path to the rendered file
  return "/tmp/out.mp4";
}
async function uploadToBucket(localPath: string, key: string) {
  // S3/R2 upload, return https URL
  return `https://cdn.example.com/${key}`;
}
