FROM node:24-slim

ENV NODE_ENV=production

WORKDIR /app

COPY dist/apps/runner ./

RUN corepack enable && pnpm install --prod --no-frozen-lockfile

CMD ["node", "bin.js"]
