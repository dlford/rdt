FROM node:22.15.1
WORKDIR /app
COPY package.json .
COPY yarn.lock .

RUN yarn install --immutable --immutable-cache --check-cache && \
    yarn cache clean

COPY lib ./lib

EXPOSE 80
CMD ["yarn", "start"]