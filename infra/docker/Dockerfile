# ADR-14: multi-stage, nginx alpine, non-root. Профиль selfhosted — ИНВ-11:
# в рантайме образ не обращается в сеть.
# Базовые образы пиннятся digest'ом (tech-stack §3.3); значения ниже проставляются
# задачей T-020 при первой сборке в конвейере и меняются только вместе с версией.

FROM node:24-alpine AS build
WORKDIR /app
RUN corepack enable
# pnpm 12 читает allowBuilds из pnpm-workspace.yaml — без него установка падает
# на ERR_PNPM_IGNORED_BUILDS, а не молча ставит непроверенные скрипты.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

FROM nginx:1.30.4-alpine AS runtime
RUN rm -f /etc/nginx/conf.d/default.conf \
 && rm -rf /usr/share/nginx/html/*
COPY infra/docker/nginx.conf /etc/nginx/nginx.conf
COPY --from=build /app/dist /usr/share/nginx/html
RUN chown -R nginx:nginx /usr/share/nginx/html /var/cache/nginx
USER nginx
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1:8080/health/ || exit 1
CMD ["nginx", "-g", "daemon off;"]
