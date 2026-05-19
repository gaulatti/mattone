FROM node:22-alpine AS development
WORKDIR /app
COPY package*.json ./
RUN npm ci
CMD ["npm", "run", "start:dev"]

FROM node:22-alpine AS production
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
CMD ["node", "dist/main"]