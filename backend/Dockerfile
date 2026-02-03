# Use Node.js 21
FROM node:21

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy only package files initially to leverage Docker cache for dependencies
COPY package*.json pnpm-lock.yaml ./
RUN pnpm install

# Copy the entire application after installing dependencies
COPY . .

# Build the application
RUN pnpm run build

# Start the server as the default command
CMD ["node", "dist/main"]