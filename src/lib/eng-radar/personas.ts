// src/lib/eng-radar/personas.ts

export type PersonaId = "backend_swe" | "devops_sre" | "security";

export type PersonaConfig = {
  id: PersonaId;
  label: string;
  description: string;
  bioKeywords: string[];
  mustHaveLanguages?: string[];
  mustHaveTopics?: string[];
  minFollowers: number;
  minPublicRepos: number;
};

export const PERSONAS: Record<PersonaId, PersonaConfig> = {
  backend_swe: {
    id: "backend_swe",
    label: "Backend / Software Engineer",
    description:
      "Engineers focused on backend / API / data-heavy systems using Python, TypeScript, Go, etc.",
    bioKeywords: [
      "software engineer",
      "backend",
      "backend engineer",
      "full stack",
      "full-stack",
      "software developer",
      "developer",
    ],
    mustHaveLanguages: ["TypeScript", "JavaScript", "Python", "Go"],
    minFollowers: 10,      // relaxed to get more candidates
    minPublicRepos: 8,
  },
  devops_sre: {
    id: "devops_sre",
    label: "DevOps / SRE / Platform",
    description:
      "Engineers who own infrastructure, CI/CD, and reliability of running systems.",
    bioKeywords: [
      "devops",
      "sre",
      "site reliability",
      "platform engineer",
      "platform engineering",
      "infrastructure engineer",
    ],
    mustHaveTopics: ["kubernetes", "terraform", "prometheus", "observability"],
    minFollowers: 5,
    minPublicRepos: 5,
  },
  security: {
    id: "security",
    label: "Security / AppSec / Research",
    description:
      "Engineers working on application security, tooling, and research.",
    bioKeywords: [
      "security engineer",
      "appsec",
      "application security",
      "security researcher",
      "red team",
      "blue team",
    ],
    mustHaveTopics: ["security", "pentest", "threat", "cryptography"],
    minFollowers: 3,
    minPublicRepos: 4,
  },
} as const;
