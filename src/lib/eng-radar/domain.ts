// src/lib/eng-radar/domain.ts

import type { PersonaId } from "./personas";

// Core GitHub identity
export type GitHubUserId = string;  // username
export type GitHubRepoId = string;  // "owner/name"

// How we store users we care about
export type TrackedUser = {
  id: GitHubUserId;
  persona: PersonaId;

  username: string;
  displayName?: string | null;
  company?: string | null;
  bio?: string | null;
  blog?: string | null;
  location?: string | null;

  followers: number;
  publicRepos: number;

  primaryLanguages: string[]; // derived from repos
  topics: string[];

  score: number;             // composite score across persona signals
  lastActivityAt?: string;   // ISO datetime of last relevant event
  lastSyncedAt: string;      // ISO when we last pulled from GitHub

  createdAt: string;
  updatedAt: string;
};

// A raw snapshot of a repo from GitHub
export type RepoSnapshot = {
  id: GitHubRepoId;
  owner: string;
  name: string;
  htmlUrl: string;
  description?: string | null;
  isFork: boolean;
  isArchived: boolean;
  stars: number;
  forks: number;
  watchers: number;
  openIssues: number;

  languages: string[];
  topics: string[];

  defaultBranch: string;
  sizeKb: number;

  lastPushedAt: string; // GitHub pushed_at
  createdAt: string;
  updatedAt: string;
};

// Higher-level understanding of a repo, created by our pipeline/LLM
export type RepoInsight = {
  id: string;               // internal UUID
  repoId: GitHubRepoId;
  persona: PersonaId;

  summary: string;          // “What is this repo about?”
  stack: string[];          // frameworks / libs / infra bits (e.g. "FastAPI", "Postgres", "Terraform")
  coreSkill: string;        // e.g. "infra-as-code", "api-design", "observability"
  complexityScore: number;  // 1–10
  learningValueScore: number; // 1–10
  maturityScore: number;    // derived from stars/age/activity

  // Optional deeper notes for later UI
  patterns?: string[];      // “CQRS”, “event-driven”, etc.
  antiPatterns?: string[];

  lastAnalyzedAt: string;   // when we last produced this insight
  createdAt: string;
  updatedAt: string;
};

// A concrete project you could build inspired by a repo
export type LearningProject = {
  id: string;               // internal UUID
  persona: PersonaId;
  sourceRepoId: GitHubRepoId;

  title: string;
  description: string;

  difficulty: "beginner" | "intermediate" | "advanced";
  estimatedHours: number;

  // High-level roadmap (LLM-generated but stored in a structured way)
  steps: {
    order: number;
    title: string;
    detail: string;
  }[];

  // How to pitch this on CV / LinkedIn
  cvBullets: string[];
  linkedinPostHook: string;

  createdAt: string;
  updatedAt: string;
};

// A “snapshot” of the radar at a moment in time, useful later if you want analytics
export type RadarSnapshot = {
  id: string;
  persona: PersonaId;
  takenAt: string; // ISO

  totalTrackedUsers: number;
  totalTrackedRepos: number;

  topLanguages: { language: string; count: number }[];
  topTopics: { topic: string; count: number }[];
};
