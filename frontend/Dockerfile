FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy app files
COPY . .

# Expose port
EXPOSE 3030

# Start dev server
CMD ["npm", "run", "dev", "--", "-p", "3030"]
