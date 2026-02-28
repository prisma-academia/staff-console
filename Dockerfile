# **Stage 1: Build**
FROM node:21.7.1-alpine AS build

WORKDIR /app 
COPY package*.json ./
RUN npm install
COPY . .
# .env.production is included so build loads from env file (see .dockerignore)
RUN npm run build 

# Stage 2: Serve the app with Node (serve)
FROM node:21.7.1-alpine

WORKDIR /app

# Install serve for production static serving (SPA support, gzip, caching)
RUN npm install -g serve@14

# Copy the build output from build stage
COPY --from=build /app/dist ./dist

ENV PORT=3000
EXPOSE 3000

# -s = SPA mode (all routes → index.html), -l = listen port
CMD ["sh", "-c", "serve dist -s -l ${PORT}"]
