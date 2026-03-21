## dump
docker exec -t postgres pg_dumpall -U postgres > LSsoftdev.sql

## create database
docker exec -it postgres psql -U postgres -c "CREATE DATABASE LSsoftdev;"

## restore
docker exec -i postgres psql -U postgres LSsoftdev < LSsoftdev.sql