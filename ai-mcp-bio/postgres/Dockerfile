FROM postgres:14-alpine

# Copy initialization scripts
COPY ./postgres/init.sql /docker-entrypoint-initdb.d/

# Set environment variables
ENV POSTGRES_USER=postgres
ENV POSTGRES_PASSWORD=postgres
ENV POSTGRES_DB=ai_mcp_bio

# Expose the PostgreSQL port
EXPOSE 5432 