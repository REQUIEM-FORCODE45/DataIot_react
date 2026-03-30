####################
# PRODUCTION IMAGE #
####################
FROM node:24-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

####################
# SERVE WITH NGINX #
####################
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html

RUN sed -i 's/listen       80;/listen       9009;/g' /etc/nginx/conf.d/default.conf

EXPOSE 9009

CMD ["nginx", "-g", "daemon off;"]
