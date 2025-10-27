# apps/landing-page/Dockerfile
FROM oven/bun:1.2.23 AS builder




WORKDIR /app

# Copy all package manifests and the lockfile first.
# This takes advantage of Docker's layer caching, speeding up subsequent builds.
COPY bun.lock ./
COPY package.json ./
COPY apps/landing-page/package.json ./apps/landing-page/
COPY packages/ui/package.json ./packages/ui/
COPY packages/brand/package.json ./packages/brand/
COPY packages/posthog/package.json ./packages/posthog/
COPY packages/utils/package.json ./packages/utils/
COPY packages/environment/package.json ./packages/environment/
COPY packages/localization/package.json ./packages/localization/
COPY tooling/typescript/package.json ./tooling/typescript/

# Install all dependencies (including devDependencies needed for the build step)
RUN bun install

# Copy the rest of the source code for all workspaces.
# A .dockerignore file in your monorepo root is crucial for this step.
COPY . .

# Build the landing page application.
# The build output will be in /app/apps/landing-page/dist
ENV NODE_ENV=production
RUN bun run --filter=landing-page build

# ---

# Stage 2: Serve with nginx
FROM nginx:alpine AS runner

# Copy the built static files from the builder stage
COPY --from=builder /app/apps/landing-page/dist /usr/share/nginx/html

# Copy custom nginx configuration and entrypoint script
COPY apps/landing-page/nginx.conf /etc/nginx/nginx.conf
COPY apps/landing-page/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Set and expose the port. Default to 4321 if not provided.
ARG PORT
ENV PORT=${PORT}
EXPOSE ${PORT}

# Start nginx with entrypoint script
CMD ["/entrypoint.sh"]
