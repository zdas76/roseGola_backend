FROM node:24-alpine

WORKDIR /app/roselgold_server

COPY package*.json ./
COPY prisma ./prisma/

RUN npm install

COPY . .

# ঠিক এই লাইনে ENV ভ্যারিয়েবলটি দিতে হবে
ENV DATABASE_URL="mysql://rosegold:rosegold_password@db:3306/rosegold_db"

RUN npm run build

EXPOSE 5000

CMD ["npm", "start"]