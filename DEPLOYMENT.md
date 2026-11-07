# IOMA Paris Dubai — Production Deployment & Go-Live Runbook

This runbook documents the complete end-to-end production deployment architecture, security configuration, health monitoring, backup procedures, and disaster recovery rollback guide for **IOMA Paris Dubai**.

---

## 1. System Architecture Overview

```
[ Client Browsers ]
       │
       ▼ (Port 80 / 443 HTTPS)
[ Nginx Reverse Proxy (ioma-prod-nginx) ]
       │
       ├────► /api/* ──────► [ NestJS API (ioma-prod-api:3000) ] ───► MongoDB (27017)
       │                                                          ───► Redis (6379)
       │                                                          ───► MinIO S3 (9000)
       └────► /* ──────────► [ Next.js Web (ioma-prod-web:3000) ]
```

---

## 2. Environment Variables Manifest

Copy `.env.example` to `.env.production` on the target production server and set production credentials:

| Variable               | Description            | Production Example                 |
| :--------------------- | :--------------------- | :--------------------------------- |
| `NODE_ENV`             | Runtime mode           | `production`                       |
| `NEXT_PUBLIC_SITE_URL` | Canonical domain       | `https://ioma-paris.com`           |
| `NEXT_PUBLIC_API_URL`  | API domain endpoint    | `https://ioma-paris.com/api`       |
| `MONGODB_URI`          | MongoDB connection URI | `mongodb://mongo:27017/ioma`       |
| `REDIS_HOST`           | Redis hostname         | `redis`                            |
| `REDIS_PORT`           | Redis port             | `6379`                             |
| `JWT_SECRET`           | JWT Signing Secret     | `32-character-random-hex-string`   |
| `MINIO_ACCESS_KEY`     | MinIO admin user       | `ioma_prod_admin`                  |
| `MINIO_SECRET_KEY`     | MinIO admin password   | `strong-minio-production-password` |

---

## 3. Initial Server Setup & Deployment

### Step 1: Clone Repository & Setup Certificates

```bash
git clone https://github.com/ioma-paris/ioma-paris-dubai.git /opt/ioma
cd /opt/ioma

# Generate Let's Encrypt SSL/TLS Certificates using Certbot
certbot certonly --standalone -d ioma-paris.com -d www.ioma-paris.com
```

### Step 2: Launch Production Containers

```bash
docker compose -f infrastructure/docker/compose.prod.yml up -d --build
```

---

## 4. Health Checks & Verification

After deployment, verify that all services are online and responding cleanly:

```bash
# 1. API Health Check
curl -I https://ioma-paris.com/api/health
# Expected: HTTP/1.1 200 OK

# 2. Web App Root Page
curl -I https://ioma-paris.com/en
# Expected: HTTP/1.1 200 OK

# 3. Robots Policy
curl -s https://ioma-paris.com/robots.txt
# Expected: Disallow: /*/admin, Sitemap link

# 4. XML Sitemap
curl -s https://ioma-paris.com/sitemap.xml
# Expected: Valid XML sitemap with hreflang tags
```

---

## 5. Automated Backups & Disaster Recovery

### Creating a Production Backup

```bash
chmod +x infrastructure/scripts/backup.sh
./infrastructure/scripts/backup.sh
```

_Backups are saved to `/backups/ioma_backup_YYYYMMDD_HHMMSS.tar.gz`._

### Restoring from Backup

```bash
chmod +x infrastructure/scripts/restore.sh
./infrastructure/scripts/restore.sh /backups/ioma_backup_20260813_150000.tar.gz
```

---

## 6. Instant Rollback Guide

If a critical flaw is detected in a new deployment:

```bash
# 1. Revert Git Repository to Last Known Good Tag
git checkout v1.0.0-stable

# 2. Re-deploy Previous Built Images Immediately
docker compose -f infrastructure/docker/compose.prod.yml up -d --build web api

# 3. Restore Pre-Deployment Database Dump (if schema migration occurred)
./infrastructure/scripts/restore.sh /backups/pre_deployment_backup.tar.gz
```

## Account redesign: guest order index migration

Deploy the updated API schema and run the idempotent `infrastructure/scripts/migrate-account-order-index.js` against the target `ioma` database. For the local Docker environment:

```powershell
Get-Content -LiteralPath infrastructure/scripts/migrate-account-order-index.js -Raw | docker exec -i ioma-dev-mongo-1 mongosh ioma --quiet
```

The script first creates `unique_guest_order_token`, a unique partial index covering string guest tokens, then removes the legacy unique/sparse `guestToken_1` index. The old index incorrectly permits only one signed-in order with `guestToken: null`. No order records are deleted or rewritten. Do not restart an old API image after migration: its schema can recreate the legacy index. Use the appropriate container/database and credentials for other environments.

## Managed product media rollout

Deploy the API with MediaAsset support, run the backed-up product-media migration with --apply, then deploy the web build. Preserve the Extended JSON backup and original assets. Confirm `.next/routes-manifest.json` forwards /api to the reachable internal API origin and fetch a real /api/media/products/{id}/card through the web origin. Docker build requires INTERNAL_API_URL=http://api:4000; Turbo must pass it through. Local Docker verification is not a production deployment.
