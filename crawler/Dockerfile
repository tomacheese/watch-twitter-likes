FROM node:19

RUN apt-get update && \
  apt-get upgrade -y && \
  apt-get clean \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json .
COPY yarn.lock .

RUN echo network-timeout 600000 > .yarnrc && \
  yarn install --frozen-lockfile && \
  yarn cache clean

COPY entrypoint.sh .
RUN chmod +x entrypoint.sh

COPY src src
COPY tsconfig.json .

ENV NODE_ENV production
ENV API_PORT 80
ENV CONFIG_PATH /data/config.json
ENV LOG_DIR /data/logs

ENTRYPOINT [ "/app/entrypoint.sh" ]