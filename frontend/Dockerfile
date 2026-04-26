FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm config set fetch-retries 5 && \
    for i in 1 2 3 4 5; do \
      npm install && break || { echo "Attempt $i failed, retrying in 30s..."; sleep 30; }; \
    done
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
