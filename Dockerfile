# Use an official Node.js runtime as a parent image
FROM node:20-alpine

# Set the working directory in the container
WORKDIR /app

# Copy package.json and yarn.lock files to the working directory
COPY yarn.lock ./

# Install dependencies using Yarn
RUN yarn install --frozen-lockfile

# Copy the rest of your application files to the working directory
COPY . .

# Build your application
RUN yarn build

# Expose the port your app runs on
EXPOSE ${PORT}

# Define the command to start your application
CMD ["yarn","start"]
