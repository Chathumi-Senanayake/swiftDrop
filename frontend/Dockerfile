# Stage 1: build the React app into static files
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Nginx serves those files and forwards /api to the app servers (see nginx/nginx.conf)
FROM nginx:1.27-alpine
COPY --from=build /app/dist /usr/share/nginx/html
