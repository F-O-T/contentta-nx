FROM oven/bun:alpine AS builder

ARG DATABASE_URL
ARG BETTER_AUTH_GOOGLE_CLIENT_ID
ARG BETTER_AUTH_GOOGLE_CLIENT_SECRET
ARG RESEND_API_KEY
ARG BETTER_AUTH_SECRET
ARG BETTER_AUTH_TRUSTED_ORIGINS
ARG MINIO_ENDPOINT
ARG MINIO_ACCESS_KEY
ARG MINIO_SECRET_KEY
ARG MINIO_BUCKET
ARG POSTHOG_HOST
ARG POSTHOG_KEY
ARG STRIPE_BASIC_PRICE_ID
ARG STRIPE_PRO_PRICE_ID
ARG STRIPE_BASIC_ANNUAL_PRICE_ID
ARG STRIPE_PRO_ANNUAL_PRICE_ID
ARG STRIPE_SECRET_KEY
ARG STRIPE_WEBHOOK_SECRET

WORKDIR /app

COPY bun.lock ./
COPY package.json ./
COPY apps/server/package.json ./apps/server/
COPY tooling/typescript/package.json ./tooling/typescript/
COPY packages/encryption/package.json ./packages/encryption/

COPY packages/api/package.json ./packages/api/
COPY libraries/ofx/package.json ./libraries/ofx/
COPY packages/authentication/package.json ./packages/authentication/
COPY packages/localization/package.json ./packages/localization/
COPY packages/utils/package.json ./packages/utils/
COPY packages/database/package.json ./packages/database/
COPY packages/environment/package.json ./packages/environment/
COPY packages/files/package.json ./packages/files/
COPY packages/posthog/package.json ./packages/posthog/
COPY packages/ofx/package.json ./packages/ofx/
COPY packages/notifications/package.json ./packages/notifications/
COPY packages/pdf/package.json ./packages/pdf/
COPY packages/transactional/package.json ./packages/transactional/
COPY packages/brasil-api/package.json ./packages/brasil-api/
COPY packages/cache/package.json ./packages/cache/
COPY packages/workflows/package.json ./packages/workflows/
COPY packages/queue/package.json ./packages/queue/
COPY packages/stripe/package.json ./packages/stripe/
COPY packages/arcjet/package.json ./packages/arcjet/
COPY packages/logging/package.json ./packages/logging/
COPY packages/csv/package.json ./packages/csv/
COPY packages/money/package.json ./packages/money/
COPY libraries/money/package.json ./libraries/money/
COPY libraries/condition-evaluator/package.json ./libraries/condition-evaluator/
COPY libraries/csv/package.json ./libraries/csv/
COPY libraries/rules-engine/package.json ./libraries/rules-engine/


RUN bun install

COPY . .

ENV NODE_ENV=production

WORKDIR /app/libraries/ofx
RUN bun run build
WORKDIR /app

WORKDIR /app/libraries/condition-evaluator
RUN bun run build
WORKDIR /app

WORKDIR /app/libraries/csv
RUN bun run build
WORKDIR /app

WORKDIR /app/libraries/money
RUN bun run build
WORKDIR /app

WORKDIR /app/libraries/rules-engine
RUN bun run build
WORKDIR /app

RUN bun build \
    --minify-whitespace \
    --minify-syntax \
    --target bun \
    --external react-dom \
    --outfile ./dist/index.js \
    ./apps/server/src/index.ts

FROM oven/bun:alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json

ARG PORT
EXPOSE ${PORT}
CMD ["bun", "./dist/index.js"]
