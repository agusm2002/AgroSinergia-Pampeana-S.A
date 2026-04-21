FROM node:20-alpine AS deps

WORKDIR /app

COPY package*.json ./
RUN npm ci --no-audit --no-fund --progress=false

FROM deps AS builder

WORKDIR /app

COPY . .
RUN npm run build

FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME=0.0.0.0

CMD ["node", "server.js"]