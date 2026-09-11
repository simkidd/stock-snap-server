# ==============================================================================
# Stage 1: Build & Compile
# ==============================================================================
FROM node:22-alpine AS builder

WORKDIR /app

# Install system dependencies needed for Prisma engines on Alpine
RUN apk add --no-cache openssl libc6-compat

# Copy package manifests & install all dependencies
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

# Copy Prisma schema and application source
COPY prisma ./prisma
COPY tsconfig*.json nest-cli.json ./
COPY src ./src

# Generate Prisma Client and compile NestJS to dist/
RUN yarn prisma generate
RUN yarn build

# Remove development dependencies to keep production footprint minimal
RUN yarn install --production --ignore-scripts --prefer-offline

# ==============================================================================
# Stage 2: Production Runtime
# ==============================================================================
FROM node:22-alpine AS runner

WORKDIR /app

# Install OpenSSL for Prisma runtime queries
RUN apk add --no-cache openssl dumb-init

ENV NODE_ENV=production
ENV PORT=8080

# Create non-root user for security
USER node

# Copy production artifacts from builder stage
COPY --chown=node:node --from=builder /app/package.json ./package.json
COPY --chown=node:node --from=builder /app/node_modules ./node_modules
COPY --chown=node:node --from=builder /app/dist ./dist
COPY --chown=node:node --from=builder /app/prisma ./prisma
COPY --chown=node:node --from=builder /app/src/generated ./src/generated

EXPOSE 8080

# Use dumb-init to properly handle PID 1 signals (graceful shutdown)
ENTRYPOINT ["/usr/bin/dumb-init", "--"]

CMD ["node", "dist/main"]
