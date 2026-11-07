FROM node:24-alpine

WORKDIR /app/roselgold_server

COPY package*.json ./

RUN npm install

COPY . .

ENV NODE_ENV=production

EXPOSE 5000

CMD ["npm", "start"]