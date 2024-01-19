FROM node:20.11.0
WORKDIR /node/lib
COPY . .

RUN yarn install --immutable --immutable-cache --check-cache && \
    yarn cache clean

EXPOSE 80
CMD ["yarn", "start"]