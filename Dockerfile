FROM node:24-alpine

WORKDIR /app/roselgold_server

COPY package*.json ./

RUN npm ci

COPY . .


RUN DATABASE_URL="mysql://build:build@127.0.0.1:3306/build" npm run build

# Copy generated Prisma Client
RUN mkdir -p dist/generated && \
    cp -r src/generated/prisma dist/generated/prisma

EXPOSE 5000

CMD ["npm", "start"]