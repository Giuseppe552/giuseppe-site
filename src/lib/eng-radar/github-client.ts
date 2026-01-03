// src/lib/eng-radar/github-client.ts

import { PERSONAS, type PersonaId, type PersonaConfig } from "./personas";
import type { TrackedUser, RepoSnapshot } from "./domain";
import { scoreUserForPersona } from "./scoring";

const GITHUB_API_BASE = "https://api.github.com";

function getGitHubToken(): string {
  const token =
    process.env.GITHUB_TOKEN ||
    process.env.GH_TOKEN ||
    process.env.GH_PAT_ENGINEERING_RADAR;
  if (!token) {
    throw new Error(
      "GitHub token not set. Define GITHUB_TOKEN or GH_PAT_ENGINEERING_RADAR in your environment.",
    );
  }
  return token;
}

async function githubRequest<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const token = getGitHubToken();
  const res = await fetch(`${GITHUB_API_BASE}${path}`, {
    ...init,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "User-Agent": "engineering-radar/1.0",
      ...(init.headers || {}),
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `GitHub API error ${res.status} ${res.statusText} for ${path}: ${text}`,
    );
  }

  return (await res.json()) as T;
}

// --- GitHub shapes ---

type GitHubSearchUsersResponse = {
  total_count: number;
  incomplete_results: boolean;
  items: {
    login: string;
    id: number;
    avatar_url: string;
    html_url: string;
    type: string;
    score: number;
  }[];
};

type GitHubUser = {
  login: string;
  name: string | null;
  company: string | null;
  blog: string | null;
  location: string | null;
  email: string | null;
  bio: string | null;
  twitter_username: string | null;
  public_repos: number;
  followers: number;
  following: number;
  created_at: string;
  updated_at: string;
};

type GitHubRepo = {
  name: string;
  full_name: string;
  html_url: string;
  description?: string | null;
  fork: boolean;
  archived: boolean;
  stargazers_count: number;
  forks_count: number;
  watchers_count: number;
  open_issues_count: number;
  language: string | null;
  topics?: string[];
  default_branch: string;
  size: number;
  pushed_at: string;
  created_at: string;
  updated_at: string;
};

type BasicPersonaSearchOptions = {
  perPage?: number;
  page?: number;
};

// Build a reasonable search query string for the persona
function buildUserSearchQuery(persona: PersonaConfig): string {
  const keywordClause = persona.bioKeywords
    .map((kw) => `"${kw}" in:bio`)
    .join(" OR ");

  const followersClause = `followers:>=${persona.minFollowers}`;
  const reposClause = `repos:>=${persona.minPublicRepos}`;
  const typeClause = "type:user";

  const q = `(${keywordClause}) ${followersClause} ${reposClause} ${typeClause}`;
  return q;
}

// Public: get high-signal users for a persona, mapped to TrackedUser[]
export async function fetchCandidateUsersForPersona(
  personaId: PersonaId,
  opts: BasicPersonaSearchOptions = {},
): Promise<TrackedUser[]> {
  const persona = PERSONAS[personaId];
  if (!persona) {
    throw new Error(`Unknown persona: ${personaId}`);
  }

  const perPage = opts.perPage ?? 20;
  const page = opts.page ?? 1;
  const q = buildUserSearchQuery(persona);

  const searchParams = new URLSearchParams({
    q,
    per_page: String(perPage),
    page: String(page),
    sort: "followers",
    order: "desc",
  });

  const searchRes = await githubRequest<GitHubSearchUsersResponse>(
    `/search/users?${searchParams.toString()}`,
  );

  // Fetch full user profiles
  const users: GitHubUser[] = await Promise.all(
    searchRes.items.map((item) =>
      githubRequest<GitHubUser>(`/users/${encodeURIComponent(item.login)}`),
    ),
  );

  // Fetch recent repos for each user so we can infer primary languages
  const reposByUser: GitHubRepo[][] = await Promise.all(
    users.map((u) =>
      githubRequest<GitHubRepo[]>(
        `/users/${encodeURIComponent(
          u.login,
        )}/repos?per_page=50&sort=pushed&type=owner`,
      ).catch(() => []), // be robust against rate-limit / edge errors
    ),
  );

  const nowIso = new Date().toISOString();

  const trackedUsers: TrackedUser[] = users.map((u, idx) => {
    const repos = reposByUser[idx] ?? [];

    // derive primary languages from non-fork, non-archived repos
    const languageSet = new Set<string>();
    for (const r of repos) {
      if (r.fork || r.archived) continue;
      if (r.language) languageSet.add(r.language);
    }
    const primaryLanguages = Array.from(languageSet);

    const score = scoreUserForPersona(
      {
        followers: u.followers,
        publicRepos: u.public_repos,
        bio: u.bio,
        company: u.company,
        topics: [],
        languages: primaryLanguages,
      },
      persona,
    );

    const username = u.login;

    const tracked: TrackedUser = {
      id: username,
      persona: personaId,

      username,
      displayName: u.name,
      company: u.company,
      bio: u.bio,
      blog: u.blog,
      location: u.location,

      followers: u.followers,
      publicRepos: u.public_repos,

      primaryLanguages,
      topics: [],

      score,
      lastActivityAt: undefined,
      lastSyncedAt: nowIso,

      createdAt: nowIso,
      updatedAt: nowIso,
    };

    return tracked;
  });

  trackedUsers.sort((a, b) => b.score - a.score);

  return trackedUsers;
}

// Public: fetch repos for a specific user, mapped to RepoSnapshot[]
export async function fetchReposForUser(
  username: string,
  limit = 20,
): Promise<RepoSnapshot[]> {
  const repos = await githubRequest<GitHubRepo[]>(
    `/users/${encodeURIComponent(
      username,
    )}/repos?per_page=${Math.min(limit, 100)}&sort=pushed&type=owner`,
  );

  const snapshots: RepoSnapshot[] = repos
    .filter((r) => !r.fork) // we care about what they *own*
    .map((r) => {
      const [owner, name] = r.full_name.split("/");
      const topics = r.topics ?? [];

      const snapshot: RepoSnapshot = {
        id: r.full_name,
        owner,
        name,
        htmlUrl: r.html_url,
        description: r.description ?? null,
        isFork: r.fork,
        isArchived: r.archived,
        stars: r.stargazers_count,
        forks: r.forks_count,
        watchers: r.watchers_count,
        openIssues: r.open_issues_count,
        languages: r.language ? [r.language] : [],
        topics,
        defaultBranch: r.default_branch,
        sizeKb: r.size,
        lastPushedAt: r.pushed_at,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      };

      return snapshot;
    })
    // sort by stars desc then pushed_at desc
    .sort((a, b) => {
      if (b.stars !== a.stars) return b.stars - a.stars;
      return (
        new Date(b.lastPushedAt).getTime() -
        new Date(a.lastPushedAt).getTime()
      );
    });

  return snapshots.slice(0, limit);
}
