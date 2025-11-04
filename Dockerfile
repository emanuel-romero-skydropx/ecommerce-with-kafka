FROM node:22.19.0-bullseye-slim

WORKDIR /app

COPY package.json yarn.lock ./
RUN corepack enable && yarn install --immutable

COPY . .

EXPOSE 8080

CMD ["yarn","dev:web"]


