FROM node:20.11.0
WORKDIR /node
COPY package.json .
COPY yarn.lock .

RUN yarn install --immutable --immutable-cache --check-cache && \
    yarn cache clean

COPY lib ./lib

EXPOSE 80
CMD ["yarn", "start"]