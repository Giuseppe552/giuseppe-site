import type { PersonaConfig } from "./personas";

export type UserSignals = {
  followers: number;
  publicRepos: number;
  bio?: string | null;
  company?: string | null;
  topics?: string[] | null;
  languages?: string[] | null;
};

const LOG10 = (n: number) => Math.log10(Math.max(n, 1));

export function scoreUserForPersona(
  signals: UserSignals,
  persona: PersonaConfig,
): number {
  const {
    followers,
    publicRepos,
    bio,
    company,
    topics,
    languages,
  } = signals;

  // 1) base from reach + activity
  const followerScore = LOG10(followers + 1) * 20; // 0–100-ish
  const repoScore = LOG10(publicRepos + 1) * 15;

  // 2) persona keyword match (bio/company)
  const bioLower = (bio ?? "").toLowerCase();
  const companyLower = (company ?? "").toLowerCase();
  const keywordMatches = persona.bioKeywords.reduce((acc, kw) => {
    const k = kw.toLowerCase();
    if (bioLower.includes(k) || companyLower.includes(k)) return acc + 1;
    return acc;
  }, 0);
  const keywordScore = keywordMatches * 10;

  // 3) topics / languages alignment
  const topicsArr = topics ?? [];
  const languagesArr = languages ?? [];
  const topicsLower = topicsArr.map((t) => t.toLowerCase());
  const languagesLower = languagesArr.map((l) => l.toLowerCase());

  let topicScore = 0;
  if (persona.mustHaveTopics) {
    const matches = persona.mustHaveTopics.filter((t) =>
      topicsLower.includes(t.toLowerCase()),
    ).length;
    topicScore += matches * 8;
  }
  if (persona.mustHaveLanguages) {
    const matches = persona.mustHaveLanguages.filter((l) =>
      languagesLower.includes(l.toLowerCase()),
    ).length;
    topicScore += matches * 6;
  }

  // 4) soft cap + shaping
  const raw = followerScore + repoScore + keywordScore + topicScore;
  return Math.round(Math.min(raw, 100));
}
