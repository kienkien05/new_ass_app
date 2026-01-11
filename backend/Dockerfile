FROM node:20-alpine

WORKDIR /app

# Install dependencies first for better caching
COPY package*.json ./
RUN npm ci

# Copy prisma schema and generate client
COPY prisma ./prisma/
RUN npx prisma generate

# Copy rest of source code
COPY . .

EXPOSE 5000

# Run db push to sync schema (using accept-data-loss for dev env) and start server
CMD ["sh", "-c", "npx prisma db push --accept-data-loss && node server.js"]
