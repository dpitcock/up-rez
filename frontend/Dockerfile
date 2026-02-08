FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install build dependencies for native modules
RUN apk add --no-cache python3 make g++

# Install dependencies
RUN npm install --legacy-peer-deps

# Copy app files
COPY . .

# Expose port
EXPOSE 3030

# Start dev server
CMD ["npm", "run", "dev", "--", "-p", "3030"]
