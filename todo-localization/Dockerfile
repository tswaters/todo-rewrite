FROM node:alpine
WORKDIR /app

COPY --from=amqp-wrapper:latest /app /node-lib/amqp-wrapper
COPY --from=auth-helper:latest /app /node-lib/auth-helper
COPY --from=healthier:latest /app /node-lib/healthier

COPY --chown=node:node package.json package-lock.json /app/
RUN npm ci
COPY . .

EXPOSE 9229

HEALTHCHECK --interval=10s --timeout=5s --retries=5 CMD ["/app/check-health.js", "49999"]
