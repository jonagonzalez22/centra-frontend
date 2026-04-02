FROM node:lts-alpine

WORKDIR /app

RUN npm install -g pnpm

COPY package.json pnpm-lock.yaml ./

EXPOSE 5173

CMD ["pnpm", "dev"]