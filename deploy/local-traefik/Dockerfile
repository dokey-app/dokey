# Static build of DoKey served by nginx. The build context is this directory: up.sh puts the
# fresh `dist/` and the generated `headers.conf` here before `docker compose build`.
FROM nginx:1.30.5-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY headers.conf /etc/nginx/dokey-headers.conf
COPY dist/ /usr/share/nginx/html/
# The dev machine's umask can make files unreadable for the nginx worker.
RUN chmod -R a+rX /usr/share/nginx/html /etc/nginx/dokey-headers.conf
