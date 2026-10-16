FROM node:22-alpine
WORKDIR /app

# Install packages first (cached unless package.json changes)
COPY package*.json ./
RUN npm ci --omit=dev

COPY . .
RUN mkdir -p uploads

EXPOSE 3000
CMD ["node", "src/server.js"]
