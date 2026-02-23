# Stage 1: Build
FROM node:22-alpine AS builder
WORKDIR /build

# Copy workspace root + relevant package.json files for workspace resolution
COPY package.json ./
COPY packages/shared/package.json packages/shared/package.json
COPY packages/api/package.json packages/api/package.json

# Install all dependencies (workspace-aware)
RUN npm install --workspace=@openanalytics/api --workspace=@openanalytics/shared

# Copy shared source (excluding tests) and build it to JS
COPY packages/shared/tsconfig.json packages/shared/tsconfig.json
COPY packages/shared/src/index.ts packages/shared/src/index.ts
COPY packages/shared/src/constants.ts packages/shared/src/constants.ts
COPY packages/shared/src/types/ packages/shared/src/types/
COPY packages/shared/src/schemas/ packages/shared/src/schemas/
RUN npm run -w @openanalytics/shared build

# Point shared's main to compiled output so API's tsc output can require() it at runtime
RUN node -e " \
  const fs = require('fs'); \
  const pkg = JSON.parse(fs.readFileSync('packages/shared/package.json','utf8')); \
  pkg.main = './dist/index.js'; \
  pkg.exports = { '.': './dist/index.js' }; \
  fs.writeFileSync('packages/shared/package.json', JSON.stringify(pkg, null, 2));"

# Copy API source and build
COPY packages/api/tsconfig.json packages/api/tsconfig.json
COPY packages/api/src/ packages/api/src/
RUN npm run -w @openanalytics/api build

# Stage 2: Production
FROM node:22-alpine
WORKDIR /app

# Copy workspace root + package files for prod install
COPY --from=builder /build/package.json ./
COPY --from=builder /build/packages/shared/package.json packages/shared/package.json
COPY packages/api/package.json packages/api/package.json

# Install production dependencies
RUN npm install --workspace=@openanalytics/api --workspace=@openanalytics/shared --omit=dev

# Copy compiled shared package
COPY --from=builder /build/packages/shared/dist/ packages/shared/dist/

# Copy compiled API output
COPY --from=builder /build/packages/api/dist/ packages/api/dist/
COPY packages/api/src/db/migrations/ packages/api/db/migrations/

# Placeholder for tracker script (volume-mounted in docker-compose)
RUN mkdir -p packages/api/public

EXPOSE 3001

WORKDIR /app/packages/api
CMD ["node", "dist/server.js"]
