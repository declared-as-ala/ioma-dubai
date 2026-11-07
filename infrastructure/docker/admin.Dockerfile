# Admin back office (separate app, own login). Same build shape as web.Dockerfile.
# See api.Dockerfile for why this uses `turbo prune` rather than manual
# layer copying.
FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@10.31.0 --activate
RUN npm install -g turbo@^2
WORKDIR /repo

FROM base AS pruner
COPY . .
RUN turbo prune @ioma/admin --docker

FROM base AS installer
COPY --from=pruner /repo/out/json/ .
RUN pnpm install --frozen-lockfile
COPY --from=pruner /repo/out/full/ .
# NEXT_PUBLIC_* vars are inlined into the client bundle at `next build`
# time, not read at container runtime — passing this via `environment:` in
# docker-compose.yml (which only affects the running process) has no
# effect. Must be a build ARG. Empty by default (matches the documented
# same-origin-behind-reverse-proxy production shape in .env.example); the
# dev compose stack passes the host-reachable API URL explicitly since it
# has no reverse proxy in front of these two containers.
ARG NEXT_PUBLIC_API_URL=""
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ARG INTERNAL_API_URL="http://api:4000"
ENV INTERNAL_API_URL=$INTERNAL_API_URL
RUN turbo run build --filter=@ioma/admin...

FROM node:22-alpine AS runner
RUN corepack enable
WORKDIR /repo
ENV NODE_ENV=production
ENV INTERNAL_API_URL=http://api:4000
COPY --from=installer /repo .

EXPOSE 3100
HEALTHCHECK --interval=15s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://localhost:3100 || exit 1

WORKDIR /repo/apps/admin
CMD ["node_modules/.bin/next", "start", "-p", "3100"]
