# apps/dashboard/Dockerfile
# Stage 1: Install all dependencies and build the application
FROM oven/bun:1.2.23 AS builder

WORKDIR /app

# Copy all package manifests and the lockfile first.
# This takes advantage of Docker's layer caching, speeding up subsequent builds.
COPY bun.lock ./
COPY package.json ./
COPY apps/dashboard/package.json ./apps/dashboard/
COPY packages/localization/package.json ./packages/localization/

COPY packages/contenta-sdk/package.json ./packages/contenta-sdk/
COPY packages/ui/package.json ./packages/ui/
COPY packages/brand/package.json ./packages/brand/
COPY packages/server-events/package.json ./packages/server-events/
COPY tooling/typescript/package.json ./tooling/typescript/
COPY packages/posthog/package.json ./packages/posthog/
COPY packages/api/package.json ./packages/api/
COPY packages/authentication/package.json ./packages/authentication/
COPY packages/agents/package.json ./packages/mastra/
COPY packages/environment/package.json ./packages/environment/
COPY packages/rag/package.json ./packages/rag/
COPY packages/database/package.json ./packages/database/
COPY packages/files/package.json ./packages/files/
COPY packages/payment/package.json ./packages/payment/
COPY packages/transactional/package.json ./packages/transactional/
COPY packages/workers/package.json ./packages/workers/
COPY packages/utils/package.json ./packages/utils/

# Install all dependencies (including devDependencies needed for the build step)
RUN bun install 

# Copy the rest of the source code for all workspaces.
# A .dockerignore file in your monorepo root is crucial for this step.
COPY . .

# Build the dashboard application.
# The build output will be in /app/apps/dashboard/dist
ENV NODE_ENV=production
ARG VITE_SERVER_URL

RUN bun run --filter=dashboard build

# ---

# Stage 2: Create a clean, production-only node_modules folder
FROM oven/bun:1.2.23 AS deps

WORKDIR /app

# Copy all package manifests and lockfile again
COPY bun.lock ./
COPY package.json ./
COPY apps/dashboard/package.json ./apps/dashboard/
COPY packages/localization/package.json ./packages/localization/

COPY packages/contenta-sdk/package.json ./packages/contenta-sdk/
COPY packages/ui/package.json ./packages/ui/
COPY packages/brand/package.json ./packages/brand/
COPY packages/server-events/package.json ./packages/server-events/
COPY tooling/typescript/package.json ./tooling/typescript/
COPY packages/posthog/package.json ./packages/posthog/
COPY packages/api/package.json ./packages/api/
COPY packages/authentication/package.json ./packages/authentication/
COPY packages/agents/package.json ./packages/mastra/
COPY packages/environment/package.json ./packages/environment/
COPY packages/rag/package.json ./packages/rag/
COPY packages/database/package.json ./packages/database/
COPY packages/files/package.json ./packages/files/
COPY packages/payment/package.json ./packages/payment/
COPY packages/transactional/package.json ./packages/transactional/
COPY packages/workers/package.json ./packages/workers/
COPY packages/utils/package.json ./packages/utils/
# Install only production dependencies. This creates a lean, clean node_modules folder.
RUN bun install 

# ---

# Stage 3: Create the final, small production image
FROM node:lts-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ARG VITE_SERVER_URL
# Copy the pruned, production-only node_modules from the 'deps' stage.
# This will solve the original 'module not found' error.
COPY --from=deps /app/node_modules ./node_modules

# Copy the built application from the 'builder' stage
COPY --from=builder /app/apps/dashboard/dist ./dist

# Copy the server.js file which serves the application
COPY --from=builder /app/apps/dashboard/server.js ./server.js

# Also copy the final package.json to the root of the app directory.
# This is good practice and helps with Node's module resolution.
COPY --from=deps /app/package.json ./package.json

# Set and expose the port. Default to 4321 if not provided.
ARG PORT=3000
ENV PORT=${PORT}
EXPOSE ${PORT}

# Start the server using the server.js file
CMD ["node", "server.js"]
