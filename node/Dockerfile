FROM node:22.13.1
WORKDIR /app
COPY package.json .
COPY yarn.lock .

RUN npm install pm2 -g
RUN yarn install --immutable --immutable-cache --check-cache && \
    yarn cache clean

COPY ecosystem.config.yaml ./

EXPOSE 80
CMD ["pm2-runtime", "ecosystem.config.yaml"]