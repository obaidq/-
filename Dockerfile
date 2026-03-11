FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --production

COPY server.js ./
COPY public/ ./public/
COPY content/ ./content/
COPY commentary.js ./
COPY profanity.js ./

EXPOSE 3000

CMD ["node", "server.js"]
