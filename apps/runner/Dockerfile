FROM node:24-slim

ENV NODE_ENV=production

WORKDIR /app

COPY dist/apps/runner ./

RUN npm install --omit=dev --legacy-peer-deps

CMD ["node", "bin.js"]
