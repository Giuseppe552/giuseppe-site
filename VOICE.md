# voice.md — portfolio voice

## Rule 1
If I can’t prove it, I don’t say it.

Proof means: link, screenshot, log snippet, commit, pipeline run, alert screenshot, runbook, postmortem, or a metric with a baseline.

## What this site is
Stuff I built, broke, fixed, and wrote down.

No big claims.
Just what I did, what happened, and what I’d do next.

## Tone
Calm. Direct. Not salesy.
Short sentences. No long intros.
Friendly, normal human voice. No cringe.

## Normal honesty
- I mess things up sometimes.
- I test guesses.
- Some parts are still rough.
- If I don’t know yet, I say what I’ll check next.

## Things I won’t do
- Hype words: “passionate”, “rockstar”, “world-class”, “revolutionary”.
- “Production-ready” unless I define the boundary and what’s missing.
- Claim experience I can’t back up with artifacts.

## Default page format (use everywhere)
1) What it is (1 line)
2) What it does (1 line)
3) Proof (links/bullets)
4) What breaks / risks (1–3 bullets)
5) What I changed (1–3 bullets)
6) Result (numbers if real; otherwise plain statement)
7) Next hardening steps (1–3 bullets)

If it doesn’t fit this, it’s fluff or it belongs in docs.

---

## Ops / Linux / NOC vocabulary (use only when it’s actually in the repo)
Rule: if I use a term/tool below, there should be a config, command, screenshot, or note that proves it.

### Linux / systems
- systemd, services, units
- journalctl, logs, logrotate
- cron, timers
- users/groups, sudoers
- permissions, ACLs, ownership
- packages (apt), upgrades, unattended upgrades
- SSH, keys, agent
- tmux
- disk: df/du, inode, mount, fstab
- processes: ps/top/htop, kill, nice
- networking: ip, ss, lsof, route
- firewall: nftables / iptables, ufw
- troubleshooting tools: curl, wget, dig, nslookup, traceroute, mtr, tcpdump
- TLS basics: openssl s_client, cert chains
- hardening basics: fail2ban, least privilege

### Networking / web
- DNS, TTL, propagation
- TLS, cert renewal, HSTS (if used)
- reverse proxy, load balancer (when real)
- HTTP status codes, timeouts, retries
- rate limiting (when real)

### Monitoring / observability
- logs / metrics / traces (only if present)
- dashboards, alerts, alert fatigue
- SLI/SLO (only if I define them)
Common tools (name only if used):
- Prometheus, Grafana, Alertmanager
- Loki, Promtail
- ELK/Elastic (Elasticsearch/Kibana/Logstash), OpenSearch
- Splunk, Graylog
- Datadog, New Relic
- CloudWatch, Azure Monitor, GCP Cloud Monitoring
- Sentry (app errors)

### Incident workflow
- triage, escalation, handover notes
- runbook / SOP
- postmortem (blameless)
- rollback plan, change window

Paging/on-call tools (name only if used):
- PagerDuty, Opsgenie

### Ticketing / ITSM (name only if used)
- ServiceNow
- Jira
- Confluence
- Zendesk
- Slack / Teams (for comms)

### CI/CD + delivery
- Git, branches, PRs, code review notes
- CI pipeline, build artifact, deploy step, environment separation
Tools (name only if used):
- GitHub Actions, GitLab CI, Jenkins

### Containers + runtime
- Docker, Docker Compose
- image, tag, registry
- healthchecks, restart policies
Optional (only if real):
- Kubernetes, Helm, Ingress, Argo CD

### Infrastructure as Code / config mgmt
- Terraform (state, plan/apply, modules)
- Ansible
- secrets handling (what I actually do)
Tools (name only if used):
- Vault, SOPS, KMS, Parameter Store, Secrets Manager

---

## Project pages (tight structure)
Start with proof. Not a story.

### Top block (always)
- Repo link
- Live link (if exists)
- CI/CD link/screenshot (or “manual deploy steps” doc)
- Monitoring/alert screenshot (or “not added yet”)
- Status: stable / flaky / paused + why

### Then short sections
- What it does
- Architecture (one diagram)
- Deployments (how changes ship + rollback)
- Monitoring (what’s measured + what alerts mean)
- Failure modes (what breaks + first checks)
- Security basics (how secrets are handled; what’s missing)
- Results (numbers if real)
- Limits (what it doesn’t handle)
- Next steps (hardening list)

If something is missing, say it plainly:
“No monitoring yet. Next step: X.”

---

## Toolbox block (paste into each project page)
Use this to list what’s actually in play. No padding.

**Toolbox**
- OS: Linux (systemd, journalctl)
- Networking checks: curl, dig, ss, tcpdump (if used)
- Observability: (e.g., Prometheus + Grafana) or “none yet”
- CI/CD: (e.g., GitHub Actions) or “manual”
- Runtime: (e.g., Docker Compose) or “bare metal”
- IaC: (e.g., Terraform) or “none”
- Tickets/notes: (e.g., Jira/ServiceNow) or “n/a”

---

## Runbooks (how they should read)
No essays. Just actions.

**When to use**
One sentence.

**Signals**
- Alert name / symptom
- What “bad” looks like

**Checks (fastest first)**
1)
2)
3)

**Fix**
- Do X
- If X fails, rollback to Y

**Escalate**
Escalate if:
- condition
Include what to paste into a ticket (links, timestamps, logs).

---

## Postmortems (how they should read)
Blameless. Specific. Short.

- Impact (what broke, who it affected, how long)
- Timeline (UTC)
- Root cause (plain)
- Contributing factors (bullets)
- Fix + prevention (bullets)
- Action items (P0/P1)

If it was a simulated drill, label it.

---

## Metrics rule
No fake precision.
If it’s approximate, say it’s approximate.
If I don’t have numbers, I don’t pretend I do.

Example:
“Deploy time dropped from ~10 min to ~4–5 min after caching.”

---

## “Portfolio-grade” checklist (minimum)
A project counts only if it has most of:
- Architecture diagram
- CI/CD pipeline (or repeatable deploy steps)
- At least one runbook
- At least one failure mode + recovery steps
- Some monitoring/logging evidence (even basic)
- Clear limits + next steps

If it doesn’t have these, call it what it is:
demo / experiment / WIP.
