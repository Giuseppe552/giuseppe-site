// src/lib/plan-parser.ts
import * as chrono from "chrono-node";

export type DraftEvent = {
  summary: string;
  start: Date;
  end: Date;
  allDay?: boolean; // true when the text specified a date but no time-of-day
};

/**
 * Very small parser:
 * - Split on "." or line breaks
 * - For each clause, try to extract a time range with chrono
 * - If only a start time is present, default duration 60m
 * - If no time found, skip
 * Examples it handles:
 *  "Gym 7–8."
 *  "Deep work 9-12 (protected)."
 *  "Lunch 12:15 for 30m"
 *  "Call Alex tomorrow 9am for 20m"
 */
export function parsePlanToEvents(input: string, now = new Date()): DraftEvent[] {
  const lines = input
    .split(/[\.\n]+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const events: DraftEvent[] = [];

  for (const line of lines) {
    // Try full range first (e.g., 9–12)
    const results = chrono.parse(line, now);
    if (results.length === 0) continue;

    // Use first parse
    const r: any = results[0];
    const start: Date | undefined = r.start?.date();
    let end: Date | undefined = r.end?.date();

    if (!start) continue;

    const hasTime = !!r.start?.isCertain?.("hour");

    // If no explicit end, infer a duration
    if (!end && hasTime) {
      const durMin = inferDurationMinutes(line) ?? 60; // default 60m if time present
      end = new Date(start.getTime() + durMin * 60 * 1000);
    }

    // All-day when no time-of-day mentioned; use single-day all-day block
    const allDay = !hasTime;
    if (allDay) {
      // If the text implies an end date, keep it; otherwise single day
      if (!end) {
        end = new Date(start.getTime());
      }
    }

    // Title is line minus parsed date text snippets (fallback to the line)
    const summary = (line || "Untitled").replace(r.text, "").trim() || line;

    events.push({ summary: tidy(summary), start, end: end!, allDay });
  }

  return events;
}

function tidy(s: string) {
  return s.replace(/\s{2,}/g, " ").replace(/\s+[\(\[]?protected[\)\]]?/i, "").trim();
}

function inferDurationMinutes(line: string): number | null {
  // numbers + unit: 90m, 1.5h, 2 hours, for 45 min, about 2h, around 2 hours
  const m1 = /(?:for\s+|about\s+|around\s+)?(\d+(?:\.\d+)?)\s*(h|hr|hrs|hour|hours|m|min|mins|minute|minutes)\b/i.exec(
    line
  );
  if (m1) {
    const n = parseFloat(m1[1]);
    const unit = m1[2].toLowerCase();
    if (unit.startsWith("h")) return Math.round(n * 60);
    return Math.round(n);
  }

  // words: one hour, two hours, half hour
  const words: Record<string, number> = {
    half: 30,
    one: 60,
    two: 120,
    three: 180,
    four: 240,
  };
  const m2 = /(half|one|two|three|four)\s+hour(s)?/i.exec(line);
  if (m2) return words[m2[1].toLowerCase()] ?? 60;

  return null;
}
