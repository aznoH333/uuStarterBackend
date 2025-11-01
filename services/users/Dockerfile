# Dockerfile for authentication service
FROM node:16

# Update APT sources and install build tools
RUN sed -i 's/debian.org/ftp.us.debian.org/' /etc/apt/sources.list && \
    apt-get update && \
    apt-get install -y python3 make g++ && \
    apt-get clean


WORKDIR /app

ARG COMMON_DIR=../../common
ARG SRC_DIR=./src


COPY ${COMMON_DIR} ./common
COPY ${SRC_DIR}/../package*.json ./
RUN npm install
COPY ${SRC_DIR} ./services/users/src

EXPOSE 3000

CMD ["node", "services/users/src/index.js"]
