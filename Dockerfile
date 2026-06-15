# API NestJS con Puppeteer (PDFs). Imagen Debian con las librerías que
# Chromium necesita para arrancar dentro del contenedor de Render.
FROM node:22-bookworm-slim

# Librerías del sistema requeridas por el Chromium que descarga Puppeteer.
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates fonts-liberation unzip libasound2 libatk-bridge2.0-0 \
    libatk1.0-0 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 \
    libgbm1 libglib2.0-0 libgtk-3-0 libnspr4 libnss3 libpango-1.0-0 \
    libpangocairo-1.0-0 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 \
    libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 \
    libxrender1 libxss1 libxtst6 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Instalar dependencias (el postinstall de Puppeteer descarga su Chromium).
COPY package*.json ./
RUN npm ci

# Compilar el proyecto a dist/.
COPY . .
RUN npm run build

ENV NODE_ENV=production
EXPOSE 8080

# Cloud Run inyecta PORT (8080 por defecto); main.ts ya escucha en process.env.PORT.
CMD ["node", "dist/main"]
