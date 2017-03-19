FROM node:boron

RUN mkdir -p /app
WORKDIR /app

COPY package.json .
RUN yarn install

COPY . .

EXPOSE 8000
CMD node index.js
