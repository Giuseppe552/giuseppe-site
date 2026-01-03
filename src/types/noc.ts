export type Service = {
  id: string;
  slug: "api" | "db" | "worker" | "web" | string;
  name: string;
  kind: "api" | "db" | "worker" | "frontend" | "other";
  created_at: string;
};

export type Incident = {
  id: string;
  service_slug: string | null;
  severity: "sev1" | "sev2" | "sev3";
  status: "open" | "mitigated" | "resolved";
  started_at: string;
  ended_at: string | null;
  summary: string;
  detail: Record<string, any>;
  triggered_by: string | null;
  created_at: string;
};

export type Action = {
  id: string;
  incident_id: string;
  action: string;
  outcome: "ok" | "skipped" | "failed";
  meta: Record<string, any>;
  created_at: string;
};
