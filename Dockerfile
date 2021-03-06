FROM node:carbon


WORKDIR /app
COPY package.json ./
COPY package-lock.json ./
RUN npm i --production
COPY build .

CMD [ "node", "index.js" ]