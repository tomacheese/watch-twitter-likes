FROM node:19

WORKDIR /app

COPY package.json /app/
COPY yarn.lock /app/
RUN yarn install && \
  yarn cache clean

COPY ./ /app

ENTRYPOINT [ "yarn", "start" ]