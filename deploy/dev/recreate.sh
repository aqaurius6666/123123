./remove.sh
docker-compose --env-file .env -f docker-dev.yaml up --build -d --force-recreate -V
./log.sh
