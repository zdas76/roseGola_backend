FROM node:24-alpine

WORKDIR /app/roselgold_server

COPY package*.json ./

RUN npm ci

COPY . .

# 1. Build the TypeScript/NestJS application without hardcoding a dummy database URL
RUN npm run build

# 2. Copy over necessary assets
RUN mkdir -p dist/generated && \
    cp -r src/generated/prisma dist/generated/prisma

EXPOSE 5000

# 3. CRUCIAL: Generate the Prisma client right before starting the server so it reads the true runtime variables
CMD ["sh", "-c", "npx prisma generate && npm start"]
