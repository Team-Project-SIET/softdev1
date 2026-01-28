## dump
docker exec -t postgres pg_dumpall -U postgres > LSsoftdev.sql

## restore
docker exec -it postgres psql -U postgres -c "CREATE DATABASE LSsoftdev;"