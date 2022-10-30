FROM node:19

RUN apt-get update && \
  apt-get upgrade -y && \
  apt-get clean \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json /app/
COPY yarn.lock /app/

RUN echo network-timeout 600000 > .yarnrc && \
  yarn install --frozen-lockfile && \
  yarn cache clean

COPY ./ /app

ENTRYPOINT [ "yarn", "start" ]