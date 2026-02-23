# Stage 1: Build
FROM node:22-alpine AS builder
WORKDIR /build

COPY package.json tsconfig.json ./
RUN npm install

COPY src/ src/
RUN npx tsc

# Stage 2: Production
FROM node:22-alpine
WORKDIR /app

COPY package.json ./
RUN npm install --omit=dev

COPY --from=builder /build/dist/ dist/
COPY src/db/migrations/ db/migrations/

# Placeholder for tracker script (volume-mounted in docker-compose)
RUN mkdir -p public

EXPOSE 3001

CMD ["node", "dist/server.js"]
