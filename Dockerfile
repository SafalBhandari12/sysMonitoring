# Stage 1: Build
FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY prisma ./prisma/
COPY src ./src/

RUN npx prisma generate
RUN npm run build

# Stage 2: Production
FROM node:22-alpine AS production

WORKDIR /app

COPY package*.json ./
COPY prisma.config.ts ./
RUN npm ci --omit=dev && npm install prisma --no-save

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src/generated ./src/generated
COPY prisma ./prisma/

EXPOSE 3000

CMD ["node", "dist/index.js"]