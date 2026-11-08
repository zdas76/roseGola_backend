FROM node:24-alpine

WORKDIR /app/roselgold_server

COPY package*.json ./

RUN npm ci

COPY . .

# Pass a placeholder string so Prisma doesn't crash during the build step
RUN DATABASE_URL="mysql://placeholder:placeholder@localhost:3306/placeholder" npm run build

# Copy generated Prisma Client
RUN mkdir -p dist/generated && \
    cp -r src/generated/prisma dist/generated/prisma

EXPOSE 5000

# Keep this to regenerate the dynamic runtime client when the container boots up
CMD ["sh", "-c", "npx prisma generate && npm start"]
