# ==============================================================================
# Stage 1: Build & Compile
# ==============================================================================
FROM node:22-alpine AS builder

WORKDIR /app

# Install system dependencies needed for Prisma engines and native modules on Alpine
RUN apk add --no-cache openssl libc6-compat

# Copy package manifests & install dependencies
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

# Copy application source & configurations
COPY tsconfig*.json nest-cli.json prisma.config.ts eslint.config.mjs ./
COPY prisma ./prisma
COPY src ./src

# Generate Prisma Client and compile NestJS to dist/
RUN yarn prisma:generate
RUN yarn build

# Remove development dependencies to keep the production footprint minimal & fast
RUN yarn install --production --ignore-scripts --prefer-offline

# ==============================================================================
# Stage 2: Production Runtime
# ==============================================================================
FROM node:22-alpine AS runner

WORKDIR /app

# Install OpenSSL for Prisma runtime queries & dumb-init for graceful shutdown signals
RUN apk add --no-cache openssl libc6-compat dumb-init

# Set production environment variables
ENV NODE_ENV=production
ENV PORT=8080

# Run container as non-root user for security
USER node

# Copy production artifacts from builder stage
COPY --chown=node:node --from=builder /app/package.json ./package.json
COPY --chown=node:node --from=builder /app/node_modules ./node_modules
COPY --chown=node:node --from=builder /app/dist ./dist
COPY --chown=node:node --from=builder /app/prisma ./prisma
COPY --chown=node:node --from=builder /app/src/generated ./src/generated

# Expose the default application port (Render overrides with its own PORT env)
EXPOSE 8080

# Handle PID 1 signals (Render zero-downtime deploys & graceful shutdowns)
ENTRYPOINT ["/usr/bin/dumb-init", "--"]

CMD ["node", "dist/main"]
