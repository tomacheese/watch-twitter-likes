FROM node:20 as builder

# ----- common start ----- #

WORKDIR /build

COPY package.json package.json
COPY yarn.lock yarn.lock

# -- install dependencies

WORKDIR /build

RUN echo network-timeout 600000 > .yarnrc && \
  yarn install --frozen-lockfile --non-interactive

# ----- common end ----- #

# -- build
WORKDIR /build

COPY nuxt.config.ts nuxt.config.ts
COPY src/ src/

RUN yarn generate

# ----- final image ----- #
FROM nginx:1.27.0-alpine

COPY nginx-template.conf /etc/nginx/templates/default.conf.template

ENV NGINX_HOST=localhost
ENV NGINX_PORT=80

COPY --from=builder /build/dist /usr/share/nginx/html