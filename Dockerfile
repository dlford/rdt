FROM node:20.11.0
WORKDIR /node/lib
COPY . .

RUN npm install -g -s --no-progress yarn && \
    yarn install --immutable --immutable-cache --check-cache && \
    && yarn cache clean

EXPOSE 80
CMD ["yarn", "start"]