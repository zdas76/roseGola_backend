FROM node:24-alpine

WORKDIR /app/rosegold_server

COPY package*.json ./

RUN npm install

COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Compile TypeScript
RUN npm run build

# Copy generated Prisma Client into dist
RUN mkdir -p dist/generated && \
    cp -r src/generated/prisma dist/generated/prisma

EXPOSE 5000

CMD ["npm", "start"]