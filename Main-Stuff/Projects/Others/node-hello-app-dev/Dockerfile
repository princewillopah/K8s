FROM node:14-alpine AS development

ENV NODE_ENV development
# Add a work directory
WORKDIR /app
# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

RUN npm install

# Copy the rest of the application code
COPY . .

# Expose port
# EXPOSE 5000

# Specify the command to run your application
CMD ["node", "index.js"]