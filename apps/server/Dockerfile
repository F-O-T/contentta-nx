FROM oven/bun:1.2.23 AS builder

ARG DATABASE_URL
ARG BETTER_AUTH_GOOGLE_CLIENT_ID
ARG BETTER_AUTH_GOOGLE_CLIENT_SECRET
ARG POLAR_ACCESS_TOKEN
ARG POLAR_FREE_PLAN_ID
ARG POLAR_PAID_PLAN_ID
ARG RESEND_API_KEY
ARG BETTER_AUTH_SECRET
ARG BETTER_AUTH_TRUSTED_ORIGINS
ARG REDIS_URL
ARG OPENROUTER_API_KEY
ARG OPENAI_API_KEY
ARG AP_QUEUE_UI_PASSWORD
ARG AP_QUEUE_UI_USERNAME
ARG MINIO_ENDPOINT
ARG MINIO_ACCESS_KEY
ARG MINIO_SECRET_KEY
ARG MINIO_BUCKET
ARG TAVILY_API_KEY
ARG PG_VECTOR_URL

WORKDIR /app

# Copy all package manifests and the lockfile first.
COPY bun.lock ./
COPY package.json ./
COPY apps/server/package.json ./apps/server/
COPY tooling/typescript/package.json ./tooling/typescript/
COPY packages/api/package.json ./packages/api/
COPY packages/authentication/package.json ./packages/authentication/
COPY packages/server-events/package.json ./packages/server-events/
COPY packages/localization/package.json ./packages/localization/
COPY packages/agents/package.json ./packages/agents/
COPY packages/brand/package.json ./packages/brand/
COPY packages/utils/package.json ./packages/utils/
COPY packages/rag/package.json ./packages/rag/
COPY packages/database/package.json ./packages/database/
COPY packages/environment/package.json ./packages/environment/
COPY packages/contenta-sdk/package.json ./packages/contenta-sdk/
COPY packages/files/package.json ./packages/files/
COPY packages/payment/package.json ./packages/payment/
COPY packages/posthog/package.json ./packages/posthog/
COPY packages/transactional/package.json ./packages/transactional/
COPY packages/workers/package.json ./packages/workers/

# Install all dependencies (monorepo-aware)
RUN bun install

# Copy source code
COPY . .

ENV NODE_ENV=production
RUN bun build \
    --minify-whitespace \
    --minify-syntax \
    --target bun \
    --outfile ./dist/index.js \
    ./apps/server/src/index.ts

# ---

# Stage 2: Create a clean, production-only node_modules folder and install ONNX Runtime
FROM oven/bun:1.2.23 AS deps
WORKDIR /app

# Copy all package manifests and lockfile again
COPY bun.lock ./
COPY package.json ./
COPY apps/server/package.json ./apps/server/
COPY tooling/typescript/package.json ./tooling/typescript/
COPY packages/api/package.json ./packages/api/
COPY packages/contenta-sdk/package.json ./packages/contenta-sdk/

COPY packages/authentication/package.json ./packages/authentication/
COPY packages/server-events/package.json ./packages/server-events/
COPY packages/localization/package.json ./packages/localization/
COPY packages/agents/package.json ./packages/agents/
COPY packages/brand/package.json ./packages/brand/
COPY packages/utils/package.json ./packages/utils/
COPY packages/rag/package.json ./packages/rag/
COPY packages/database/package.json ./packages/database/
COPY packages/environment/package.json ./packages/environment/
COPY packages/files/package.json ./packages/files/
COPY packages/payment/package.json ./packages/payment/
COPY packages/posthog/package.json ./packages/posthog/
COPY packages/transactional/package.json ./packages/transactional/
COPY packages/workers/package.json ./packages/workers/

# Install only production dependencies.
RUN bun install 

# ---

# Stage 3: Create the final, small production image
FROM oven/bun:1.2.23 AS runner
WORKDIR /app

ENV NODE_ENV=production
ARG DATABASE_URL
ARG BETTER_AUTH_GOOGLE_CLIENT_ID
ARG BETTER_AUTH_GOOGLE_CLIENT_SECRET
ARG POLAR_ACCESS_TOKEN
ARG POLAR_FREE_PLAN_ID
ARG POLAR_PAID_PLAN_ID
ARG RESEND_API_KEY
ARG BETTER_AUTH_SECRET
ARG BETTER_AUTH_TRUSTED_ORIGINS
ARG REDIS_URL
ARG OPENROUTER_API_KEY
ARG OPENAI_API_KEY
ARG AP_QUEUE_UI_PASSWORD
ARG AP_QUEUE_UI_USERNAME
ARG MINIO_ENDPOINT
ARG MINIO_ACCESS_KEY
ARG MINIO_SECRET_KEY
ARG MINIO_BUCKET
ARG TAVILY_API_KEY
ARG PG_VECTOR_URL

# Copy the pruned, production-only node_modules from the 'deps' stage.
COPY --from=deps /app/node_modules ./node_modules

# Copy the built application from the 'builder' stage
COPY --from=builder /app/dist ./dist

# Also copy the final package.json to the root of the app directory.
COPY --from=deps /app/package.json ./package.json

ARG PORT
EXPOSE ${PORT}
CMD ["bun", "./dist/index.js"]

