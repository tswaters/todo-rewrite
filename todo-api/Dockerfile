FROM node:alpine
WORKDIR /app

COPY --from=amqp-wrapper:latest /app /node-lib/amqp-wrapper
COPY --from=auth-helper:latest /app /node-lib/auth-helper

COPY package.json .
RUN npm install --quiet

EXPOSE 3000
EXPOSE 9229

COPY . .

HEALTHCHECK --interval=10s --timeout=5s --retries=5 CMD ["/app/check-health.js", "49999"]
