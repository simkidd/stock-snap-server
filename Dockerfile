# ==============================================================================
# Stage 1: Builder (Dependencies & Build)
# ==============================================================================
FROM node:22-alpine AS builder

WORKDIR /app

# Install system dependencies required for Prisma engine compilation on Alpine
RUN apk add --no-cache openssl libc6-compat

# Copy package manifests & install all dependencies
COPY package.json yarn.lock ./
RUN yarn install

# Copy Prisma schema and configuration
COPY prisma ./prisma
COPY prisma.config.ts ./

# Generate Prisma Client
RUN yarn prisma generate

# Copy project source and TypeScript configurations
COPY tsconfig*.json nest-cli.json ./
COPY src ./src

# Compile application to dist/ (dist/main.js)
RUN yarn build

# Prune dev-dependencies to keep image lightweight for Render
RUN yarn install --production --ignore-scripts --prefer-offline

# ==============================================================================
# Stage 2: Production Runner
# ==============================================================================
FROM node:22-alpine AS runner

WORKDIR /app

# Install OpenSSL for Prisma and dumb-init for graceful shutdown on Render
RUN apk add --no-cache openssl dumb-init

ENV NODE_ENV=production
ENV PORT=8080

# Run container as non-root user for security
USER node

# Copy built application and production dependencies from builder stage
COPY --chown=node:node --from=builder /app/package.json ./package.json
COPY --chown=node:node --from=builder /app/node_modules ./node_modules
COPY --chown=node:node --from=builder /app/dist ./dist
COPY --chown=node:node --from=builder /app/prisma ./prisma
COPY --chown=node:node --from=builder /app/src/generated ./src/generated

EXPOSE 8080

# Handle PID 1 signals (Render zero-downtime deploys & graceful shutdowns)
ENTRYPOINT ["/usr/bin/dumb-init", "--"]

CMD ["node", "dist/main"]
