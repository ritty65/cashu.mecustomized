# Stage 1: Build Phase
FROM node:20.10.0-bullseye AS builder

WORKDIR /app

COPY package*.json ./

# Install application dependencies
RUN npm install -g @quasar/cli
RUN npm install

# Copy the application code to the container
COPY . .

# Build the PWA (replace 'npm run build' with your actual build command)
RUN npm run build:pwa

# Stage 2: Runtime Phase
FROM nginx

# Copy the built PWA files from the builder stage
COPY --from=builder /app/dist/pwa /usr/share/nginx/html

# security headers and default server
COPY deploy/nginx/security-headers.conf /etc/nginx/conf.d/security-headers.conf
COPY deploy/nginx/default.conf          /etc/nginx/conf.d/default.conf

# Expose the port your app will run on
EXPOSE 80

