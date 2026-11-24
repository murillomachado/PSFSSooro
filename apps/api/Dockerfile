# Build a partir da raiz do repositório: docker build -f apps/api/Dockerfile .
# Etapa 1: instala tudo, compila o contracts e a API e separa só o que a API precisa para rodar.
FROM node:26.13.1-bookworm AS build
RUN npm install --global pnpm@12.23.0
WORKDIR /repo
COPY . .
RUN pnpm install --frozen-lockfile \
 && pnpm --filter @psfssooro/api build \
 && pnpm --filter @psfssooro/api deploy --prod /app

# Etapa 2: imagem final, sem compilador nem código-fonte.
FROM node:26.13.1-bookworm-slim
ENV NODE_ENV=production PORT=3333 DATABASE_PATH=/data/academia.sqlite
WORKDIR /app
COPY --from=build /app .
VOLUME /data
EXPOSE 3333
# Aplica as migrations e cria os usuários de demonstração (os dois podem rodar de novo sem efeito) antes de subir.
CMD ["sh", "-c", "node dist/bin/migrar.js && node dist/bin/semear.js && exec node dist/main.js"]
