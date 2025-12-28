# apps/dashboard/Dockerfile
FROM oven/bun:alpine AS base

WORKDIR /app

ENV NODE_ENV=production


# Copy package files
COPY bun.lock ./
COPY package.json ./
COPY apps/dashboard/package.json ./apps/dashboard/
COPY packages/localization/package.json ./packages/localization/
COPY packages/ui/package.json ./packages/ui/
COPY packages/ofx/package.json ./packages/ofx/
COPY tooling/typescript/package.json ./tooling/typescript/
COPY packages/posthog/package.json ./packages/posthog/
COPY packages/encryption/package.json ./packages/encryption/
COPY packages/api/package.json ./packages/api/
COPY packages/authentication/package.json ./packages/authentication/
COPY packages/environment/package.json ./packages/environment/
COPY packages/database/package.json ./packages/database/
COPY packages/files/package.json ./packages/files/
COPY packages/transactional/package.json ./packages/transactional/
COPY packages/utils/package.json ./packages/utils/
COPY packages/brasil-api/package.json ./packages/brasil-api/
COPY packages/cache/package.json ./packages/cache/
COPY packages/pdf/package.json ./packages/pdf/
COPY packages/notifications/package.json ./packages/notifications/
COPY packages/workflows/package.json ./packages/workflows/
COPY packages/queue/package.json ./packages/queue/
COPY libraries/ofx/package.json ./libraries/ofx/
COPY libraries/condition-evaluator/package.json ./libraries/condition-evaluator/
COPY packages/stripe/package.json ./packages/stripe/
COPY packages/arcjet/package.json ./packages/arcjet/
COPY packages/csv/package.json ./packages/csv/
COPY packages/money/package.json ./packages/money/
COPY libraries/money/package.json ./libraries/money/
COPY libraries/csv/package.json ./libraries/csv/
COPY libraries/rules-engine/package.json ./libraries/rules-engine/


# Install dependencies
RUN bun install 


# Copy source code
COPY . .

# Build the condition-evaluator library
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

# Build the dashboard application
ENV NODE_ENV=production
ARG VITE_SERVER_URL
ARG VITE_POSTHOG_HOST
ARG VITE_POSTHOG_KEY
RUN bun run --filter=dashboard build

# Production stage
FROM nginx:alpine AS runner

# Copy the built static files from the builder stage
COPY --from=base /app/apps/dashboard/dist /usr/share/nginx/html

# Copy custom nginx configuration and entrypoint script
COPY apps/dashboard/nginx.conf /etc/nginx/nginx.conf
COPY apps/dashboard/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Set and expose the port. Default to 3000 if not provided.
ARG PORT
ENV PORT=${PORT:-3000}
EXPOSE ${PORT}

# Healthcheck using the dynamic port
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD curl --fail --silent http://0.0.0.0:${PORT}/healthcheck || exit 1

# Start nginx with entrypoint script
CMD ["/entrypoint.sh"]
