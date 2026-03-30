####################
# PRODUCTION IMAGE #
####################
FROM node:24-alpine AS builder

WORKDIR /app

# 1. Copiamos específicamente package.json y yarn.lock
COPY package.json yarn.lock ./

# 2. Equivalente a 'npm ci' en Yarn (instalación limpia y estricta)
RUN yarn install --frozen-lockfile

COPY . .

# 3. Ejecutamos el script de construcción con Yarn
RUN yarn build

####################
# SERVE WITH NGINX #
####################
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html

RUN sed -i 's/listen       80;/listen       9009;/g' /etc/nginx/conf.d/default.conf

EXPOSE 9009

CMD ["nginx", "-g", "daemon off;"]