"use client";

import { useEffect, useState } from "react";
import { PERSONAS, type PersonaId } from "@/lib/eng-radar/personas";
import type { TrackedUser, RepoSnapshot } from "@/lib/eng-radar/domain";

type DiscoverResponse = {
  persona: PersonaId;
  count: number;
  users: TrackedUser[];
};

type UserReposResponse = {
  username: string;
  count: number;
  repos: RepoSnapshot[];
};

const personaList = Object.values(PERSONAS);

export default function EngRadarPage() {
  const [selectedPersona, setSelectedPersona] =
    useState<PersonaId>("backend_swe");
  const [data, setData] = useState<DiscoverResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedUser, setSelectedUser] = useState<TrackedUser | null>(null);
  const [repos, setRepos] = useState<RepoSnapshot[] | null>(null);
  const [reposLoading, setReposLoading] = useState(false);
  const [reposError, setReposError] = useState<string | null>(null);

  // Load candidate users when persona changes
  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      setLoading(true);
      setError(null);
      setSelectedUser(null);
      setRepos(null);
      setReposError(null);

      try {
        const res = await fetch(
          `/api/eng-radar/discover?persona=${selectedPersona}`,
        );
        if (!res.ok) {
          const body = (await res.json().catch(() => null)) as
            | { error?: string; details?: string }
            | null;
          throw new Error(
            body?.error || body?.details || `Request failed: ${res.status}`,
          );
        }
        const json = (await res.json()) as DiscoverResponse;
        if (!cancelled) {
          setData(json);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err?.message ?? "Failed to load data");
          setData(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchData();
    return () => {
      cancelled = true;
    };
  }, [selectedPersona]);

  const personaConfig = PERSONAS[selectedPersona];

  async function handleViewRepos(user: TrackedUser) {
    setSelectedUser(user);
    setRepos(null);
    setReposError(null);
    setReposLoading(true);

    try {
      const res = await fetch(
        `/api/eng-radar/user/${encodeURIComponent(
          user.username,
        )}/repos?limit=10`,
      );
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as
          | { error?: string; details?: string }
          | null;
        throw new Error(
          body?.error || body?.details || `Request failed: ${res.status}`,
        );
      }
      const json = (await res.json()) as UserReposResponse;
      setRepos(json.repos);
    } catch (err: any) {
      setReposError(err?.message ?? "Failed to load repositories");
      setRepos(null);
    } finally {
      setReposLoading(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
      {/* Header */}
      <header className="space-y-3">
        <p className="text-xs font-mono uppercase tracking-[0.25em] text-cyan-400/80">
          Labs / Engineering Radar
        </p>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Engineering Radar
        </h1>
        <p className="max-w-2xl text-sm text-neutral-400">
          This tool discovers high-signal GitHub engineers for different roles,
          ranks them, and surfaces their primary languages and activity. It’s
          the backend for my own learning roadmap.
        </p>
      </header>

      {/* Persona selector */}
      <section className="space-y-2">
        <h2 className="text-sm font-medium text-neutral-200">
          Target persona
        </h2>
        <div className="flex flex-wrap gap-2">
          {personaList.map((p) => {
            const active = p.id === selectedPersona;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setSelectedPersona(p.id)}
                className={[
                  "inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium transition",
                  active
                    ? "border-cyan-400/80 bg-cyan-400/10 text-cyan-100"
                    : "border-neutral-700 bg-neutral-900/40 text-neutral-300 hover:border-neutral-500 hover:bg-neutral-800/70",
                ].join(" ")}
              >
                {p.label}
              </button>
            );
          })}
        </div>
        <p className="max-w-xl text-xs text-neutral-500">
          {personaConfig.description}
        </p>
      </section>

      {/* Status bar */}
      <section className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-neutral-800 bg-neutral-950/70 px-4 py-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_0_4px_rgba(52,211,153,0.25)]" />
          <span className="font-medium text-neutral-100">
            GitHub discovery pipeline
          </span>
          <span className="text-neutral-500">live</span>
        </div>
        <div className="flex flex-wrap items-center gap-4 text-[11px] text-neutral-400">
          <span>
            Results:{" "}
            <span className="font-semibold text-neutral-100">
              {data?.count ?? 0}
            </span>
          </span>
          <span>
            Persona:{" "}
            <span className="font-semibold text-neutral-100">
              {personaConfig.label}
            </span>
          </span>
          {loading && <span className="text-cyan-300">Refreshing…</span>}
          {error && (
            <span className="text-red-400">
              Error: <span className="font-normal">{error}</span>
            </span>
          )}
        </div>
      </section>

      {/* Table */}
      <section className="rounded-xl border border-neutral-800 bg-neutral-950/70">
        <div className="border-b border-neutral-800 px-4 py-3 text-xs text-neutral-400">
          Top GitHub engineers by persona &amp; score. Primary languages are
          derived from their most active non-fork repos. Click “View repos” to
          inspect what they&apos;re actually building.
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-xs">
            <thead className="border-b border-neutral-800 bg-neutral-900/60 text-[11px] uppercase tracking-wide text-neutral-400">
              <tr>
                <th className="px-4 py-2">User</th>
                <th className="px-4 py-2">Followers</th>
                <th className="px-4 py-2">Public repos</th>
                <th className="px-4 py-2">Primary languages</th>
                <th className="px-4 py-2">Score</th>
                <th className="px-4 py-2 text-right">Details</th>
              </tr>
            </thead>
            <tbody>
              {data?.users?.length ? (
                data.users.map((u) => (
                  <tr
                    key={u.id}
                    className="border-t border-neutral-900/70 hover:bg-neutral-900/40"
                  >
                    <td className="px-4 py-2 align-top">
                      <div className="flex flex-col">
                        <a
                          href={`https://github.com/${u.username}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-medium text-cyan-300 hover:text-cyan-200"
                        >
                          @{u.username}
                        </a>
                        {u.displayName && (
                          <span className="text-[11px] text-neutral-400">
                            {u.displayName}
                          </span>
                        )}
                        {u.company && (
                          <span className="text-[11px] text-neutral-500">
                            {u.company}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-2 align-top text-neutral-200">
                      {u.followers}
                    </td>
                    <td className="px-4 py-2 align-top text-neutral-200">
                      {u.publicRepos}
                    </td>
                    <td className="px-4 py-2 align-top">
                      <div className="flex flex-wrap gap-1">
                        {u.primaryLanguages.length ? (
                          u.primaryLanguages.map((lang) => (
                            <span
                              key={lang}
                              className="rounded-full bg-neutral-800/80 px-2 py-0.5 text-[11px] text-neutral-200"
                            >
                              {lang}
                            </span>
                          ))
                        ) : (
                          <span className="text-[11px] text-neutral-500">
                            —
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-2 align-top">
                      <span className="inline-flex items-center rounded-full bg-cyan-500/10 px-2 py-0.5 text-[11px] font-semibold text-cyan-300">
                        {u.score}
                      </span>
                    </td>
                    <td className="px-4 py-2 align-top text-right">
                      <button
                        type="button"
                        onClick={() => handleViewRepos(u)}
                        className="inline-flex items-center rounded-full border border-neutral-700 px-2 py-0.5 text-[11px] text-neutral-200 hover:border-cyan-500 hover:bg-cyan-500/10"
                      >
                        View repos
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-xs text-neutral-500"
                  >
                    {loading
                      ? "Discovering engineers for this persona…"
                      : "No candidates found for this persona yet."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Repo details panel */}
      {selectedUser && (
        <section className="space-y-3 rounded-xl border border-neutral-800 bg-neutral-950/80 px-4 py-4">
          <div className="flex items-center justify-between gap-2">
            <div className="space-y-1">
              <h2 className="text-sm font-semibold text-neutral-100">
                Top repositories for @{selectedUser.username}
              </h2>
              <p className="text-[11px] text-neutral-500">
                Sorted by stars and recent activity. This is what they&apos;re
                actually shipping.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setSelectedUser(null);
                setRepos(null);
                setReposError(null);
              }}
              className="text-[11px] text-neutral-400 hover:text-neutral-200"
            >
              Close
            </button>
          </div>

          {reposLoading && (
            <p className="text-xs text-cyan-300">Loading repositories…</p>
          )}
          {reposError && (
            <p className="text-xs text-red-400">Error: {reposError}</p>
          )}

          {!reposLoading && !reposError && (
            <div className="space-y-2">
              {repos && repos.length > 0 ? (
                repos.map((repo) => (
                  <div
                    key={repo.id}
                    className="flex flex-col gap-1 rounded-lg border border-neutral-800 bg-neutral-900/60 p-3 text-xs"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <a
                        href={repo.htmlUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-medium text-cyan-300 hover:text-cyan-200"
                      >
                        {repo.owner}/{repo.name}
                      </a>
                      <div className="flex items-center gap-2 text-[11px] text-neutral-400">
                        <span>★ {repo.stars}</span>
                        <span>Forks {repo.forks}</span>
                        <span>
                          Updated{" "}
                          {new Date(
                            repo.lastPushedAt,
                          ).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    {repo.description && (
                      <p className="text-[11px] text-neutral-400">
                        {repo.description}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-1">
                      {repo.languages.map((lang) => (
                        <span
                          key={lang}
                          className="rounded-full bg-neutral-800/90 px-2 py-0.5 text-[11px] text-neutral-200"
                        >
                          {lang}
                        </span>
                      ))}
                      {repo.topics.map((topic) => (
                        <span
                          key={topic}
                          className="rounded-full bg-neutral-900 px-2 py-0.5 text-[10px] uppercase tracking-wide text-neutral-400"
                        >
                          {topic}
                        </span>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-[11px] text-neutral-500">
                  No owner repos found for this user.
                </p>
              )}
            </div>
          )}
        </section>
      )}

      {/* Footer / explanation for hiring managers */}
      <section className="text-[11px] text-neutral-500">
        <p>
          Under the hood this page calls a typed backend client that hits the
          GitHub Search API, enriches each user with their recent repos, derives
          primary languages, and computes a persona-specific score. The repo
          panel pulls owner repositories for a selected engineer so I can study
          what they&apos;re actually building. Next steps are LLM repo
          summarisation and learning project generation.
        </p>
      </section>
    </div>
  );
}
