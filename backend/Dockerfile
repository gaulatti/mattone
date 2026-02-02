# Use Node.js 21
FROM node:21

WORKDIR /app

# Copy only package files initially to leverage Docker cache for dependencies
COPY package*.json pnpm-lock.yaml ./
RUN pnpm install

# Copy the entire application after installing dependencies
COPY . .

# Build the application
RUN npm run build

# Set default environment variables
ENV PORT=8080
ENV DB_HOST=localhost
ENV DB_PORT=5432
ENV DB_USER=postgres
ENV DB_PASS=password
ENV DB_NAME=mattone
ENV COGNITO_CLIENT_ID=your_client_id
ENV COGNITO_REGION=us-east-1
ENV COGNITO_USER_POOL_ID=your_pool_id

# Expose the port
EXPOSE 8080

# Start the server as the default command
CMD ["node", "dist/src/main"]