# Dockerfile

FROM postgres:14

COPY src/app/DB/init.sql /docker-entrypoint-initdb.d/
