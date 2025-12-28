FROM oven/bun:alpine AS builder

ARG DATABASE_URL
ARG REDIS_URL
ARG WORKER_CONCURRENCY

WORKDIR /app

COPY bun.lock ./
COPY package.json ./
COPY apps/worker/package.json ./apps/worker/
COPY tooling/typescript/package.json ./tooling/typescript/
COPY packages/database/package.json ./packages/database/
COPY packages/environment/package.json ./packages/environment/
COPY packages/cache/package.json ./packages/cache/
COPY packages/queue/package.json ./packages/queue/
COPY packages/workflows/package.json ./packages/workflows/
COPY packages/transactional/package.json ./packages/transactional/
COPY packages/notifications/package.json ./packages/notifications/
COPY packages/encryption/package.json ./packages/encryption/
COPY packages/utils/package.json ./packages/utils/
COPY packages/logging/package.json ./packages/logging/
COPY packages/money/package.json ./packages/money/
COPY libraries/condition-evaluator/package.json ./libraries/condition-evaluator/
COPY libraries/rules-engine/package.json ./libraries/rules-engine/
COPY libraries/money/package.json ./libraries/money/

RUN bun install

COPY . .

WORKDIR /app/libraries/money
RUN bun run build
WORKDIR /app
WORKDIR /app/libraries/condition-evaluator
RUN bun run build
WORKDIR /app

ENV NODE_ENV=production

RUN bun build \
    --minify-whitespace \
    --minify-syntax \
    --target bun \
    --outfile ./dist/index.js \
    ./apps/worker/src/index.ts

FROM oven/bun:alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json

CMD ["bun", "./dist/index.js"]
