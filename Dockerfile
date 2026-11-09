FROM node:24-alpine

WORKDIR /app/roselgold_server

COPY package*.json ./

RUN npm ci

COPY . .

RUN DATABASE_URL="mysql://${DATABASE_USER}:${DATABASE_PASSWORD}@db:3306/${DATABASE_NAME}" npm run build


RUN mkdir -p dist/generated && \
    cp -r src/generated/prisma dist/generated/prisma

EXPOSE 5000

# Keep this to regenerate the dynamic runtime client when the container boots up
CMD ["sh", "-c", "npx prisma generate && npx prisma db push && npm start"]
