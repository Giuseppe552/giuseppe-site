// src/lib/scheduling.ts

export type ISO = string;

export type DraftEvent = {
  summary: string;
  startISO: ISO;
  endISO: ISO;
  protected?: boolean;
  location?: string;
  notes?: string;
};

export type BusyEvent = {
  start: ISO; // dateTime or date
  end: ISO;   // dateTime or date
};

export function toDate(iso: ISO): Date {
  return new Date(iso);
}

export function ms(d: number) { return d * 60 * 1000; } // minutes → ms
export function dur(startISO: ISO, endISO: ISO) { return toDate(endISO).getTime() - toDate(startISO).getTime(); }

export function overlaps(aStart: ISO, aEnd: ISO, bStart: ISO, bEnd: ISO): boolean {
  const aS = toDate(aStart).getTime();
  const aE = toDate(aEnd).getTime();
  const bS = toDate(bStart).getTime();
  const bE = toDate(bEnd).getTime();
  return aS < bE && bS < aE;
}

// Given a day window + busy events, find the next free slot >= fromStart with given duration.
export function findNextFreeSlotToday(
  fromStartISO: ISO,
  durationMs: number,
  dayStartISO: ISO,
  dayEndISO: ISO,
  busy: BusyEvent[]
): { startISO: ISO; endISO: ISO } | null {
  // Normalise busy to [start,end] ms, sorted
  const blocks = busy
    .map(b => ({
      s: toDate(b.start).getTime(),
      e: toDate(b.end).getTime(),
    }))
    .sort((a, b) => a.s - b.s);

  let cursor = Math.max(toDate(fromStartISO).getTime(), toDate(dayStartISO).getTime());
  const dayEnd = toDate(dayEndISO).getTime();

  // Sweep through busy blocks — keep lifting cursor past overlaps
  for (const b of blocks) {
    // If current gap [cursor, b.s) can fit duration, use it
    if (cursor + durationMs <= b.s) {
      if (cursor + durationMs <= dayEnd) {
        return { startISO: new Date(cursor).toISOString(), endISO: new Date(cursor + durationMs).toISOString() };
      } else {
        return null;
      }
    }
    // Otherwise, if cursor overlaps this busy block, jump to its end
    if (cursor < b.e && b.s <= cursor) {
      cursor = b.e;
    }
  }

  // After last busy block: check tail gap
  if (cursor + durationMs <= dayEnd) {
    return { startISO: new Date(cursor).toISOString(), endISO: new Date(cursor + durationMs).toISOString() };
  }
  return null;
}

export function sameTimeTomorrow(startISO: ISO, endISO: ISO): { startISO: ISO; endISO: ISO } {
  const s = toDate(startISO);
  const e = toDate(endISO);
  const s2 = new Date(s.getFullYear(), s.getMonth(), s.getDate() + 1, s.getHours(), s.getMinutes(), 0, 0);
  const e2 = new Date(e.getFullYear(), e.getMonth(), e.getDate() + 1, e.getHours(), e.getMinutes(), 0, 0);
  return { startISO: s2.toISOString(), endISO: e2.toISOString() };
}

export function splitIntoTwoEqual(
  startISO: ISO,
  endISO: ISO
): Array<{ startISO: ISO; endISO: ISO }> {
  const start = toDate(startISO).getTime();
  const end = toDate(endISO).getTime();
  const total = end - start;
  const half = Math.floor(total / 2);
  const firstEnd = start + half;
  const secondStart = firstEnd; // back-to-back
  return [
    { startISO: new Date(start).toISOString(), endISO: new Date(firstEnd).toISOString() },
    { startISO: new Date(secondStart).toISOString(), endISO: new Date(end).toISOString() },
  ];
}
