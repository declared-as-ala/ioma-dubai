# Uses Turborepo's `prune` command to build a minimal, correct build context
# for a single app out of the monorepo — the standard pattern for
# pnpm + Turborepo, and far less fragile than hand-picking which
# node_modules directories to copy across stages (workspace packages have
# their own node_modules with symlinks into the root pnpm store; copying
# them selectively silently breaks resolution — see DECISIONS.md incident
# notes for how this went wrong the first time).
FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@10.31.0 --activate
RUN npm install -g turbo@^2
WORKDIR /repo

FROM base AS pruner
COPY . .
RUN turbo prune @ioma/api --docker

FROM base AS installer
COPY --from=pruner /repo/out/json/ .
RUN pnpm install --frozen-lockfile
COPY --from=pruner /repo/out/full/ .
RUN turbo run build --filter=@ioma/api...

FROM node:22-alpine AS runner
RUN corepack enable
WORKDIR /repo
ENV NODE_ENV=production
COPY --from=installer /repo .

EXPOSE 4000
HEALTHCHECK --interval=15s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://localhost:4000/api/health || exit 1

CMD ["node", "apps/api/dist/main.js"]
