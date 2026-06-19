# API NestJS. Imagen Debian slim.
FROM node:22-bookworm-slim

WORKDIR /app

COPY package*.json ./
RUN npm ci

# Compilar el proyecto a dist/.
COPY . .
RUN npm run build

ENV NODE_ENV=production
EXPOSE 8080

# Cloud Run inyecta PORT (8080 por defecto); main.ts ya escucha en process.env.PORT.
CMD ["node", "dist/main"]
