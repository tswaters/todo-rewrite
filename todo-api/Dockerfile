FROM node:alpine
WORKDIR /app

COPY package.json .
RUN npm install --quiet

EXPOSE 3000
EXPOSE 9229

HEALTHCHECK --interval=10s --timeout=5s --retries=5 CMD ["/app/check-health.js"]

COPY . .
