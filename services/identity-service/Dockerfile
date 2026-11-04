FROM node:24-alpine AS build

WORKDIR /workspace

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY services/identity-service/package.json services/identity-service/package.json

RUN corepack enable && pnpm install --frozen-lockfile --filter @boticaya/identity-service...

COPY services/identity-service services/identity-service

RUN pnpm --filter @boticaya/identity-service build

FROM node:24-alpine AS runtime

WORKDIR /app
ENV NODE_ENV=production

COPY --from=build /workspace/node_modules /app/node_modules
COPY --from=build /workspace/services/identity-service/dist /app/dist

CMD ["node", "dist/main.js"]
