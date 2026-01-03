# Giuseppe Giona — Portfolio & Lab Sandbox

**Systems engineer building reliable, observable software.** I design for safety, simplicity, and scale—from on-call playbooks to production dashboards.

**Live site:** [giuseppegiona.com](https://giuseppegiona.com)

---

## 🎯 Highlights

### Live Demos
- **Calendar-AI** — Natural language → structured plan → Google Calendar events. Demonstrates LLM integration, OAuth flow, timezone handling, and graceful parsing fallbacks.
- **ATS Ranker** — Resume scoring with embedding vectors. Shows RAG patterns and practical ML in web apps.
- **Mini-NOC** — Incident simulation with auto-remediation. Illustrates observability, state management, and runbook-driven ops.

### Tech Stack
- **Frontend:** Next.js 16, React 19.2, TypeScript 5, Tailwind CSS v4
- **Auth:** NextAuth v4 with JWT refresh, Google OAuth (offline access)
- **Backend:** Node.js serverless routes; Supabase + in-memory fallback
- **Integrations:** Google Calendar API, OpenAI (planning + embeddings), Whisper (speech-to-text)
- **Deployment:** Vercel (serverless + edge)

---

## 🛠 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation
```bash
git clone https://github.com/giuseppe552/giuseppe.git
cd giuseppe
npm install
```

### Environment Variables
Create a `.env.local` file (see `.env.example` for reference):
```env
# Google OAuth (Calendar scopes, offline access)
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret

# NextAuth
NEXTAUTH_SECRET=your-nextauth-secret
NEXTAUTH_URL=http://localhost:3000

# OpenAI (for planning + ATS)
OPENAI_API_KEY=your-api-key

# Supabase (optional; in-memory fallback available)
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Demo quota owner
OWNER_EMAIL=your-email@example.com
```

### Development
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the site.

### Build
```bash
npm run build
npm run start
```

---

## 📁 Project Structure

```
src/
  app/
    layout.tsx              # Global metadata, fonts, providers
    page.tsx                # Landing page with featured projects
    /labs                   # Live demo pages (Calendar-AI, ATS, NOC)
    /projects               # Case study deep-dives
    /work                   # Projects index with filtering/search
    /about                  # Background + contact form
    /api                    # Serverless API routes
  components/               # Reusable React components
  lib/
    auth.ts                 # NextAuth helper (getServerSession wrapper)
    google.ts               # Google Calendar API client
    noc.ts                  # Incident management with Supabase + in-memory fallback
    plan-llm.ts             # Plan parsing via LLM (OpenAI)
    plan-parser.ts          # Lightweight fallback parser
    quota.ts                # Demo quota gating
    scheduling.ts           # Calendar event helpers
  types/
    noc.ts                  # TypeScript types for incidents
```

---

## 🔐 Security

### Headers Implemented
- **Content-Security-Policy:** Strict, no inline scripts
- **Strict-Transport-Security:** 1-year HSTS for HTTPS enforcement
- **Permissions-Policy:** Blocks unnecessary APIs (geolocation, microphone, etc.)
- **X-Frame-Options:** SAMEORIGIN (prevent clickjacking)
- **X-Content-Type-Options:** nosniff (prevent MIME-type sniffing)

### Auth & Tokens
- NextAuth v4 JWT strategy with automatic refresh
- Google OAuth with offline access for Calendar integration
- Role-based access control (demo owner via `OWNER_EMAIL`)
- Quota enforcement per email (owner bypasses limits)

### Secrets Management
- All sensitive values in `.env.local` (git-ignored)
- See `.env.example` for required keys
- CI/CD scanning via GitHub Actions (`npm audit`)

---

## 📊 Development Workflow

### Scripts
```bash
npm run dev              # Start dev server (hot reload)
npm run build            # Build for production (TypeScript + Next.js checks)
npm run start            # Run production build locally
npm run lint             # ESLint (checks code quality)
npm run format           # Prettier (auto-format code)
npm run typecheck        # TypeScript compiler (strict mode)
```

### Code Quality
- **TypeScript:** Strict mode enforced
- **Linting:** ESLint with Next.js config
- **Formatting:** Prettier (4 spaces, trailing commas, single quotes)
- **CI/CD:** GitHub Actions workflow runs lint, typecheck, and build on every push

---

## 🚀 Deployment

### Vercel (Recommended)
```bash
npm install -g vercel
vercel
```

1. Connect GitHub repo
2. Add environment variables (see `.env.example`)
3. Deploy

### Manual Deploy
```bash
npm run build
npm start
```

---

## 📝 Labs & Case Studies

### [Calendar-AI](/labs/calendar-ai)
**Problem:** Manually typing events into Google Calendar is tedious and error-prone.

**Solution:** Natural language composition → LLM-powered plan parsing → structured events with timezone inference → Google Calendar insertion.

**Key Features:**
- Speech-to-text transcription (Whisper)
- Event preview before insertion
- Timezone handling (offset inference from natural language)
- Graceful fallback parser (no API call if LLM disabled)
- Day-view calendar with event listing

**Tech:** OAuth 2.0 offline access, Google Calendar API, OpenAI, chrono-node (date parsing)

---

### [ATS Ranker](/labs/ats)
**Problem:** Resume screening at scale is time-consuming; good signals are hard to spot.

**Solution:** Embedding-based vector search over resume text; rank candidates by semantic relevance to job description.

**Key Features:**
- Resume upload + parsing
- Embedding generation (OpenAI)
- Relevance scoring with context
- Batch processing with quota limits

**Tech:** OpenAI embeddings, vector similarity, file uploads

---

### [Mini-NOC](/labs/noc)
**Problem:** On-call runbooks exist in tribal knowledge; incident response lacks structure.

**Solution:** Simulated incident environment with observable state, structured logs, and runbook-driven remediation.

**Key Features:**
- Incident triggering (auto-generates synthetic error logs)
- Real-time status/metrics display
- Runbook modal with remediation steps
- Auto-remediate function (demonstrates idempotency)
- Persistent state (Supabase primary, in-memory fallback)

**Tech:** Supabase (for persistence), Vercel serverless (state via globalThis), structured logging

---

## 🔗 Links

- **GitHub:** [giuseppe552](https://github.com/giuseppe552)
- **LinkedIn:** [@giuseppe552](https://www.linkedin.com/in/giuseppe552)
- **Email:** contact.giuseppe00@gmail.com

---

## 📄 License

MIT
