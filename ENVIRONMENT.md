# ENVIRONMENT.md — IOMA Paris Dubai

All variables validated at API boot (Zod/Joi schema in `apps/api/src/config`) — missing required variables fail startup rather than degrading silently. `.env.example` at repo root mirrors this table with placeholder values; real `.env`/`.env.production` files are gitignored and never committed.

## Core

| Variable              | Required | Dev default             | Notes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| --------------------- | -------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `NODE_ENV`            | yes      | `development`           | `production` tightens security defaults (e.g. refuses mock payment provider)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `PORT`                | yes      | `4000`                  | API port                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `WEB_PORT`            | yes      | `3000`                  | Next.js port. Only consumed by `docker-compose.yml`, which maps it to the container's `PORT` env var (Next.js's own CLI reads `PORT` natively — no `--port` flag is passed, so the script stays portable across shells). Running `pnpm dev`/`pnpm start` directly on the host ignores `WEB_PORT` and uses Next's default (3000) unless you export `PORT` yourself.                                                                                                                                                                                                              |
| `APP_URL`             | yes      | `http://localhost:3000` | Used for email links, CORS allow-list, OG URLs                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `API_URL`             | yes      | `http://localhost:4000` | Server-side base URL (Nest → itself, scripts)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `NEXT_PUBLIC_API_URL` | yes      | `http://localhost:4000` | Browser-exposed API base URL — Next.js only ships `NEXT_PUBLIC_*` vars to the client bundle, and this one is baked in at **build time**, not read at container runtime. Production: leave empty — the reverse proxy serves web+api same-origin under `/api`, so relative paths work with no CORS/env coupling. In `docker-compose.yml` this is passed as a `build.args` entry on the `web` service (not `environment:`, which only affects the already-built container's runtime and has no effect on a value that's already inlined into the JS bundle) — see `web.Dockerfile` |

## Database & Cache

Defaults below target the _documented default dev workflow_ (`DEPLOYMENT.md`): infra containerized via `docker compose up -d mongo redis minio`, apps run locally via `pnpm dev` — so these must resolve from the host, not from inside the Docker network. `docker-compose.yml`'s `api`/`web` services override all three to the internal Docker hostnames in their own `environment:` block when the whole stack runs containerized.

| Variable    | Required | Dev default                      | Notes                                                                  |
| ----------- | -------- | -------------------------------- | ---------------------------------------------------------------------- |
| `MONGO_URI` | yes      | `mongodb://localhost:27017/ioma` | `mongodb://mongo:27017/ioma` only resolves _inside_ the Docker network |
| `REDIS_URL` | yes      | `redis://localhost:6379`         | Sessions, rate limiting, BullMQ                                        |

`apps/api`'s `ConfigModule` explicitly points `envFilePath` at the repo-root `.env` (not the default CWD-relative lookup, which pointed at `apps/api/.env` — a file that doesn't exist — and failed silently). Running the API directly (`node dist/main.js` or `pnpm --filter @ioma/api dev`) now loads `.env` automatically; no env vars need to be passed manually on the command line.

## Object Storage (MinIO / S3-compatible)

`MINIO_SIGNED_URL_ENDPOINT` (optional): browser-reachable origin used to sign private document URLs, independently of the internal storage host. Development Compose defaults to `http://localhost:9010`; production should use the configured HTTPS MinIO/reverse-proxy origin. Credentials remain server-side and buckets remain private. The signer uses MinIO's default `us-east-1` region. If omitted, signing uses the internal MinIO client as before.

| Variable                       | Required | Dev default                   | Notes                                                                                                                                                                              |
| ------------------------------ | -------- | ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `MINIO_ENDPOINT`               | yes      | `localhost`                   | See note above — Docker Compose overrides to `minio` when containerized                                                                                                            |
| `MINIO_PORT`                   | yes      | `9010`                        | Remapped from the default 9000 in this dev environment — an unrelated local container already held that port. Internal Docker-network traffic (`api` → `minio:9000`) is unaffected |
| `MINIO_ACCESS_KEY`             | yes      | dev value in `.env.example`   | Rotate for production                                                                                                                                                              |
| `MINIO_SECRET_KEY`             | yes      | dev value in `.env.example`   | Rotate for production, never reuse dev value                                                                                                                                       |
| `MINIO_USE_SSL`                | yes      | `false` (dev) / `true` (prod) |                                                                                                                                                                                    |
| `MINIO_BUCKET_PUBLIC`          | yes      | `ioma-public`                 |                                                                                                                                                                                    |
| `MINIO_BUCKET_PRIVATE`         | yes      | `ioma-private`                |                                                                                                                                                                                    |
| `MINIO_SIGNED_URL_TTL_SECONDS` | yes      | `300`                         |                                                                                                                                                                                    |

## Auth

| Variable             | Required | Dev default | Notes                                    |
| -------------------- | -------- | ----------- | ---------------------------------------- |
| `JWT_ACCESS_SECRET`  | yes      | dev value   | Rotate for production, ≥ 32 random bytes |
| `JWT_REFRESH_SECRET` | yes      | dev value   | Distinct from access secret              |
| `JWT_ACCESS_TTL`     | yes      | `15m`       |                                          |
| `JWT_REFRESH_TTL`    | yes      | `30d`       |                                          |

## Payments — ⚠️ CLIENT-PROVIDED, NOT YET SUPPLIED

| Variable                 | Required (prod)            | Notes                                                                                                                   |
| ------------------------ | -------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `PAYMENT_PROVIDER`       | yes                        | `mock` in dev; real value (`stripe`/`checkout_com`/`paytabs`/`network_intl`) once chosen — see `CLIENT_REQUIREMENTS.md` |
| `PAYMENT_API_KEY`        | yes (when provider ≠ mock) | **Missing** — blocked on provider selection + credentialing                                                             |
| `PAYMENT_WEBHOOK_SECRET` | yes (when provider ≠ mock) | **Missing**                                                                                                             |

## AI Skin Analysis — ⚠️ CLIENT-PROVIDED, NOT YET SUPPLIED

| Variable                     | Required (prod)            | Notes                                          |
| ---------------------------- | -------------------------- | ---------------------------------------------- |
| `AI_PROVIDER`                | yes                        | `mock` until a vendor is selected              |
| `AI_PROVIDER_API_KEY`        | yes (when provider ≠ mock) | **Missing** — blocked on vendor selection      |
| `AI_ANALYSIS_RETENTION_DAYS` | yes                        | Default `90`, admin-configurable via `Setting` |

## Maps — OPTIONAL, DEFAULT NEEDS NO KEY

| Variable       | Required                       | Notes                                                                      |
| -------------- | ------------------------------ | -------------------------------------------------------------------------- |
| `MAP_PROVIDER` | yes                            | `osm` default (no key needed); `google` or `mapbox` optional upgrade       |
| `MAPS_API_KEY` | only if `MAP_PROVIDER` ≠ `osm` | **Missing if Google/Mapbox chosen** — not required for default OSM/Leaflet |

## Email — ⚠️ CLIENT-PROVIDED FOR PRODUCTION

| Variable                                              | Required (prod) | Dev default                        | Notes                                                |
| ----------------------------------------------------- | --------------- | ---------------------------------- | ---------------------------------------------------- |
| `EMAIL_PROVIDER`                                      | yes             | `smtp-dev` (MailHog/local catcher) | Production: SES/Sendgrid/Postmark or SMTP creds      |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` | yes (prod)      | dev catcher values                 | **Production values missing**                        |
| `EMAIL_FROM`                                          | yes             | `no-reply@ioma-dev.local`          | Real sending domain needed for production (SPF/DKIM) |

## Observability — OPTIONAL

| Variable     | Required | Notes                                                                         |
| ------------ | -------- | ----------------------------------------------------------------------------- |
| `SENTRY_DSN` | no       | Adapter is inert without it; **recommended before go-live**, not yet supplied |
| `LOG_LEVEL`  | yes      | `debug` (dev) / `info` (prod)                                                 |

## Search — OPTIONAL

| Variable                                   | Required                              | Notes                                   |
| ------------------------------------------ | ------------------------------------- | --------------------------------------- |
| `SEARCH_PROVIDER`                          | yes                                   | `mongo` default; `meilisearch` optional |
| `MEILISEARCH_HOST` / `MEILISEARCH_API_KEY` | only if `SEARCH_PROVIDER=meilisearch` | Not needed for v1 default               |

## SMS / WhatsApp — FUTURE, NOT IN v1 SCOPE

| Variable       | Required | Notes                                                                                                 |
| -------------- | -------- | ----------------------------------------------------------------------------------------------------- |
| `SMS_PROVIDER` | no       | `noop` logger only; Twilio/WhatsApp Business API integration is out of v1 scope per `PROJECT_PLAN.md` |

## i18n

| Variable            | Required | Dev default | Notes |
| ------------------- | -------- | ----------- | ----- |
| `DEFAULT_LOCALE`    | yes      | `en`        |       |
| `SUPPORTED_LOCALES` | yes      | `en,fr,ar`  |       |

---

## Summary — Credentials Genuinely Missing Right Now

1. Payment gateway API key + webhook secret (provider TBD by client)
2. AI skin-analysis provider API key (vendor TBD by client)
3. Production SMTP/transactional email credentials + verified sending domain
4. Maps API key (only if the client wants Google/Mapbox instead of the no-key OSM default)
5. Sentry DSN (recommended, not blocking)

None of the above block development — every one has a working mock/default per `DECISIONS.md`'s provider-abstraction pattern. They block only production go-live for their specific feature, tracked again in `DEPLOYMENT.md`.

## Internal catalogue media proxy

`INTERNAL_API_URL` is the server-only API origin used by Next.js rewrites. Use `http://api:4000` inside Docker, and `http://localhost:4000` for host development. The web Dockerfile sets it during build and runtime. Turbo build env includes INTERNAL_API_URL, API_URL, NEXT_PUBLIC_API_URL and DOCKER_BUILD so the compiled rewrite targets the API service. Rebuild web after changing this origin.
