FROM node:11-alpine

RUN mkdir -p /zz/nodecraft
WORKDIR /zz/nodecraft

COPY package.json yarn.lock ./
RUN yarn install

COPY . .
RUN yarn build

EXPOSE 8000
CMD node dist/app.js
