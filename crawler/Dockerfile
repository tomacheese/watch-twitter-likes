FROM node:19

RUN apt-get update && \
  apt-get upgrade -y && \
  apt-get clean \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json .
COPY yarn.lock .
RUN yarn install && \
  yarn cache clean

COPY entrypoint.sh .
RUN chmod +x entrypoint.sh

COPY src src
COPY tsconfig.json .

ENTRYPOINT [ "/app/entrypoint.sh" ]
