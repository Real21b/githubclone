# syntax=docker/dockerfile:1
# apps/api — NestJS modüler monolit
# Monorepo kökünden derlenir:  docker build -f apps/api/Dockerfile .

FROM node:24-alpine AS base
RUN corepack enable
WORKDIR /app

# ---- Bağımlılıklar -----------------------------------------------------------
FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/api/package.json        apps/api/
COPY packages/config/package.json packages/config/
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile --filter @app/api...

# ---- Derleme -----------------------------------------------------------------
FROM base AS builder
COPY --from=deps /app/node_modules              ./node_modules
COPY --from=deps /app/apps/api/node_modules     ./apps/api/node_modules
COPY --from=deps /app/packages/config/node_modules ./packages/config/node_modules
COPY . .
RUN pnpm --filter @app/api build

# Üretim bağımlılıklarını ayrıca hazırla (dev bağımlılıkları imaja girmesin)
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile --prod --filter @app/api... \
 && pnpm deploy --filter @app/api --prod /prod/api

# ---- Çalışma zamanı ----------------------------------------------------------
FROM base AS runner
ENV NODE_ENV=production \
    API_PORT=4000

# Root olmayan kullanıcı (Faz 13 güvenlik gereksinimi)
RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 nestjs \
 && mkdir -p /var/lib/githubclone/repos \
 && chown -R nestjs:nodejs /var/lib/githubclone

COPY --from=builder --chown=nestjs:nodejs /prod/api ./

USER nestjs
EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=3s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:4000/health/live').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "dist/main"]
