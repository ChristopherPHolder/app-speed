FROM node:24-slim

ENV HOST=0.0.0.0
ENV PORT=3000
ENV NODE_ENV=production
ENV OTEL_EXPORTER_OTLP_ENDPOINT=http://host.docker.internal:4318

WORKDIR /app

COPY dist/apps/server ./

RUN corepack enable && pnpm install --prod --no-frozen-lockfile

EXPOSE 3000
CMD ["node", "main.js"]
