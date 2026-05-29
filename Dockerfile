FROM node:18-alpine
WORKDIR /app
COPY package.json .
RUN npm install
COPY . .
RUN node_modules/.bin/eslint src --max-warnings=0
RUN npm run build && cp serve.json dist/serve.json