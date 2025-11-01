# Dockerfile for authentication service
FROM node:16

# Update APT sources and install build tools
RUN sed -i 's/debian.org/ftp.us.debian.org/' /etc/apt/sources.list && \
    apt-get update && \
    apt-get install -y python3 make g++ && \
    apt-get clean


WORKDIR /app

COPY package*.json ./
RUN npm install

COPY ./src ./src

EXPOSE 3000

CMD ["node", "src/index.js"]
