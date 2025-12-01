FROM node:22-alpine AS base

WORKDIR /usr/src/app

# Install dependencies (including devDeps for tsx runtime)
COPY package.json ./
RUN npm install

# Copy source and tsconfig for path/ts features
COPY tsconfig.json ./tsconfig.json
COPY src ./src

EXPOSE 3000

# Use tsx to run the TypeScript entrypoint directly
CMD ["node", "--loader=tsx", "src/server.ts"]


