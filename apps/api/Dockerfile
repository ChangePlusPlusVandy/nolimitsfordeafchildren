FROM node:22-alpine

WORKDIR /usr/src/app

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
