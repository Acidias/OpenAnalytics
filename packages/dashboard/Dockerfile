# Stage 1: Dependencies
FROM node:22-alpine AS deps
WORKDIR /build
COPY package.json ./
RUN npm install

# Stage 2: Build
FROM node:22-alpine AS builder
WORKDIR /build
COPY --from=deps /build/node_modules node_modules/
COPY . .

# Build-time env vars (overridable via docker-compose)
ARG NEXT_PUBLIC_API_URL=http://localhost:3001
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# Ensure public/ exists even if the project has no static assets yet
RUN mkdir -p public
RUN npm run build

# Stage 3: Production
FROM node:22-alpine
WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /build/.next/standalone ./
COPY --from=builder /build/.next/static .next/static
COPY --from=builder /build/public public/

EXPOSE 3000

CMD ["node", "server.js"]
