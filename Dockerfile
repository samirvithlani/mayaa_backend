
# Use the official Node.js image from the Docker Hub
FROM node:latest

# Create and set the application directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json files
COPY package*.json ./

# Install the project dependencies
RUN npm install -f

# Copy the rest of the application code
COPY . .

# Expose the port the app runs on
EXPOSE 3000

# Start the application using npm start
CMD ["node", "app.js"]
