FROM node:22-slim

ENV HOST=0.0.0.0
ENV PORT=3000
ENV NODE_ENV=production
ENV OTEL_EXPORTER_OTLP_ENDPOINT=http://host.docker.internal:4318

WORKDIR /app

RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

COPY dist/apps/server ./
COPY libs/server/db/src/prisma/schema.prisma ./prisma/schema.prisma

RUN npm install --omit=dev --legacy-peer-deps
RUN npx prisma generate --schema ./prisma/schema.prisma

EXPOSE 3000
CMD ["node", "main.js"]
