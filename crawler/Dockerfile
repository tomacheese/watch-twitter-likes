FROM node:19-alpine as builder

WORKDIR /app

COPY package.json .
COPY yarn.lock .

RUN echo network-timeout 600000 > .yarnrc && \
  yarn install --frozen-lockfile && \
  yarn cache clean

COPY src src
COPY tsconfig.json .

RUN yarn package

FROM node:19-alpine as runner

# hadolint ignore=DL3018
RUN apk update && \
  apk upgrade && \
  apk add --update --no-cache tzdata && \
  cp /usr/share/zoneinfo/Asia/Tokyo /etc/localtime && \
  echo "Asia/Tokyo" > /etc/timezone && \
  apk del tzdata

WORKDIR /app

COPY --from=builder /app/output .

COPY entrypoint.sh .
RUN chmod +x entrypoint.sh

ENV NODE_ENV production
ENV API_PORT 80
ENV CONFIG_PATH /data/config.json
ENV LOG_DIR /data/logs

VOLUME [ "/data" ]

ENTRYPOINT [ "/app/entrypoint.sh" ]