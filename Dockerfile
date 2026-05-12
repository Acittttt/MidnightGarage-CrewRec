# Pake Node.js versi terbaru yang stabil
FROM node:22-slim

# Set folder kerja di dalem container
WORKDIR /app

# Copy file package dulu biar install library-nya cepet (cached)
COPY package*.json ./
RUN npm install --production

# Copy semua file kodingan lo
COPY . .

# Cloud Run bakal kasih port otomatis lewat variable PORT
EXPOSE 8080

# Jalankan aplikasi
CMD ["node", "src/server.js"]