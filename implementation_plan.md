# AI-Powered Product Intelligence & Affiliate Marketplace Platform

## 0) Current Project Snapshot (March 25, 2026)

The repository already contains:

- Next.js App Router UI for landing/search/compare/dashboard/admin.
- API route stubs: `/api/search`, `/api/recommend`, `/api/compare`, `/api/click`.
- A rich Prisma schema for users, products, sources, tracking, alerts, and wallet.
- Recharts dependency and a chart component.

Major gaps to close:

- API routes still return mock data (no Prisma, no Redis, no LLM calls yet).
- Auth package exists (`next-auth`) but no auth configuration/routes/guards.
- Prisma packages are not in dependencies yet (`prisma`, `@prisma/client`).
- No Upstash Redis integration yet.
- No env template, migrations, or seed data.

---

## 1) Core Architecture

The platform uses modular services on top of Next.js:

- Frontend: Next.js App Router + Tailwind + ShadCN-style UI patterns + Recharts.
- Backend: Next.js route handlers (serverless style) for search, compare, recommend, click tracking.
- Database: PostgreSQL via Prisma ORM.
- Cache and rate limiting: Upstash Redis.
- Authentication: NextAuth.js (session or JWT, role-aware).
- AI layer: OpenAI or Groq models with strict JSON output schemas.

### 1.1 Logical Service Boundaries

- `Search Service`: parse intent + fetch ranked products.
- `Recommendation Service`: personalized product feeds from history + preferences.
- `Pricing Service`: source price ingestion + freshness checks.
- `Revenue Service`: affiliate routing + click attribution + commission optimization.
- `Content Service`: review summarization + SEO snippets.

---

## 2) AI Agent Framework

### 2.1 Search Agent

Input: natural language query  
Output (strict JSON): intent, categories, tags, budget, constraints, confidence.

Example:

```json
{
  "intent": "buy",
  "category": "shoes",
  "tags": ["waterproof", "running"],
  "price": { "max": 120, "currency": "USD" },
  "confidence": 0.91
}
```

### 2.2 Recommendation Agent

- Hybrid approach: collaborative filtering + content-based matching.
- Uses `BrowsingHistory`, `Favorite`, click behavior, and category affinity.
- Returns products with `reason` and `matchScore`.

### 2.3 Pricing Agent

- Poll or webhook ingest from affiliate/catalog sources.
- Writes to `ProductSource` with `lastUpdated` timestamps.
- Marks stale prices and triggers refresh jobs.

### 2.4 Revenue Agent

- Picks outbound affiliate link by weighted score:
  - expected conversion probability
  - expected commission
  - source reliability
  - stock status and price freshness
- Logs attribution to `Click`.

### 2.5 Content Agent

- Summarizes reviews/specs for product cards and compare view.
- Generates metadata for SEO pages.

---

## 3) Data Model Plan (Prisma)

Current schema already includes most core models:

- `User`, `Role`
- `Product`, `Source`, `ProductSource`
- `Favorite`, `PriceAlert`, `BrowsingHistory`
- `Wallet`, `Click`

Required add-ons for production auth:

- NextAuth tables if Prisma adapter is used (`Account`, `Session`, `VerificationToken`).

Recommended indexes:

- `Product(category)`
- `Product(tags)` (GIN index via migration SQL for Postgres array)
- `ProductSource(productId, lastUpdated)`
- `Click(clickedAt, sourceAgent)`
- `BrowsingHistory(userId, viewedAt)`

---

## 4) API Contract Targets

### 4.1 `POST /api/search`

- Request: `{ query: string, userId?: string }`
- Pipeline: parse intent -> cache check -> DB query -> ranking -> response
- Response: `{ results, agentProcessing, cacheHit, latencyMs }`

### 4.2 `GET /api/recommend?userId=...`

- Response includes ranked products with `reason`, `matchScore`, and price source.
- Fallback for cold-start users: trending + category-based recommendations.

### 4.3 `POST /api/compare`

- Request: `{ productIds: string[] }`
- Response: comparison matrix + AI verdict + best value product.

### 4.4 `POST /api/click`

- Should be POST (not GET) for tracking events.
- Request: `{ productId, userId?, sourceAgent, sourceId? }`
- Side effects: create click log + return redirect URL.

---

## 5) Implementation Phases with Exit Criteria

### Phase 1: MVP Foundation

Deliverables:

- NextAuth configured with role-aware session checks.
- Prisma client wired to all existing route handlers.
- Real product search/compare/recommend endpoints (no mocks).
- User dashboard backed by real DB reads.

Exit criteria:

- User can sign in, search, compare, and click out with tracked records.
- Core pages consume live API data.

### Phase 2: Analytics and Affiliate Engine

Deliverables:

- Hardened click tracking endpoint + validation + abuse controls.
- Admin analytics backed by DB aggregations + Recharts.
- Upstash cache for search and product detail payloads.

Exit criteria:

- P95 API latency reduced for cached paths.
- Admin dashboard shows real traffic/revenue trends.

### Phase 3: Advanced Agents

Deliverables:

- Price ingestion jobs (cron/webhook).
- Personalized recommendation ranking.
- Revenue-agent routing policy.
- Chatbot connected to backend tools.

Exit criteria:

- Recommendations are user-specific and measurable.
- Route-to-affiliate decisions are dynamic and logged.

### Phase 4: Scale and Automation

Deliverables:

- Price-drop alerts (email/push queue).
- Voice/visual search prototypes.
- Predictive trend analytics.

Exit criteria:

- Alert workflow stable and monitored.
- Forecast views available in admin UI.

---

## 6) Immediate Next Sprint (7-10 Days)

1. Add runtime foundations
- Install `prisma` and `@prisma/client`.
- Add `.env.example` for DB/auth/AI/redis keys.
- Initialize Prisma client singleton in `lib/`.

2. Ship secure auth skeleton
- Add NextAuth route and config.
- Add role guard middleware for `/admin`.

3. Replace mocks in API routes
- `/api/search`: parse + query + rank + cache.
- `/api/recommend`: history-based ranking.
- `/api/compare`: DB-backed matrix and LLM verdict.
- `/api/click`: switch to POST and persist click event.

4. Connect UI to live endpoints
- Search page consumes `/api/search`.
- Compare page consumes `/api/compare`.
- Dashboard/admin pages read live metrics.

5. Add minimum quality gates
- Request validation (Zod).
- Error shape standardization.
- Basic route tests (happy path + validation failures).

---

## 7) Required Environment Variables

```env
DATABASE_URL=
NEXTAUTH_URL=
NEXTAUTH_SECRET=
OPENAI_API_KEY=
GROQ_API_KEY=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

---

## 8) Risks and Mitigations

- Hallucinated or malformed LLM output: enforce JSON schema validation and retry once.
- Stale prices: TTL + freshness window + fallback source ordering.
- Click fraud: IP hash rate thresholds + anomaly jobs.
- Cold-start recommendations: category/popularity defaults.

---

## 9) Definition of Done

- No mock data in production routes.
- Auth + roles enforced.
- Click attribution persisted and queryable.
- Cached search and product endpoints live.
- Admin dashboard reflects real metrics.
- Deployment docs and env template committed.
