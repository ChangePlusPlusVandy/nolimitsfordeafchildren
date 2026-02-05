FROM node:22-alpine

WORKDIR /usr/src/app

# Required for DigitalOcean managed database SSL connections
# DO uses self-signed certificates that Node.js won't trust by default
ENV NODE_TLS_REJECT_UNAUTHORIZED=0

# Install dependencies
COPY package.json ./
RUN npm install

# Copy source and configs for runtime + migrations
COPY tsconfig.json ./
COPY drizzle.config.ts ./
COPY src ./src

# Expose API port
EXPOSE 3000

# Health check for container orchestration
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Run with tsx for TypeScript execution
CMD ["node", "--import=tsx", "src/server.ts"]
