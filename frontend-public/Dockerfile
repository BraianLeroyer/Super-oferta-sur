FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=4321

COPY package*.json ./
RUN npm install

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/astro.config.mjs ./

EXPOSE 4321

CMD ["npx", "astro", "preview", "--host", "0.0.0.0", "--port", "4321"]
