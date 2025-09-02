# Tahap 1: Build dependencies
FROM node:20-alpine AS builder
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
COPY . .
# Pastikan Prisma client di-generate
RUN npx prisma generate

# Tahap 2: Final image untuk produksi
FROM node:20-alpine
WORKDIR /usr/src/app
# Set environment ke production
ENV NODE_ENV=production
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/package*.json ./
COPY --from=builder /usr/src/app/prisma ./prisma
COPY --from=builder /usr/src/app/src ./src

EXPOSE 2000
CMD [ "node", "src/server.js" ]