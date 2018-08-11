FROM postgres:alpine
COPY init.sh /docker-entrypoint-initdb.d/

HEALTHCHECK --interval=10s --timeout=5s --retries=5 CMD ["pg_isready", "-U", "postgres"]
