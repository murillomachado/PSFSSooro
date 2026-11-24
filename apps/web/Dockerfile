# Build a partir da raiz do repositório: docker build -f apps/web/Dockerfile .
FROM node:26.13.1-bookworm AS build
RUN npm install --global pnpm@12.23.0
# O endereço da API é lido pelo navegador e entra no código na hora do build.
ARG NEXT_PUBLIC_API_URL=http://localhost:3333/api
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL NEXT_STANDALONE=1
WORKDIR /repo
COPY . .
RUN pnpm install --frozen-lockfile && pnpm --filter @psfssooro/web build

FROM node:26.13.1-bookworm-slim
ENV NODE_ENV=production PORT=3000 HOSTNAME=0.0.0.0
WORKDIR /app
# O modo "standalone" do Next já traz só as dependências usadas.
COPY --from=build /repo/apps/web/.next/standalone ./
COPY --from=build /repo/apps/web/.next/static ./apps/web/.next/static
EXPOSE 3000
CMD ["node", "apps/web/server.js"]
