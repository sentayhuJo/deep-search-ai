# Use an official Node.js image (version 22 as specified)
FROM node:22

# Set the working directory inside the container
WORKDIR /app


# This allows Docker to cache the npm install step if these files haven't changed.
COPY package*.json ./

# (Optional) Copy environment file if needed
COPY .env.local ./

# Install dependencies (use --production flag for production builds)
RUN npm install --production

# Now copy the rest of your application code
COPY . .

# Expose the port your server listens on (adjust if necessary, e.g., 3001)
EXPOSE 3001

# Define the command to run your server.
CMD ["npm", "run", "server"]

