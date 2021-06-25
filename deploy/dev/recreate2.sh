./remove.sh
docker-compose --env-file .env -f docker-nodemon.yaml up --build -d --force-recreate -V
./log.sh
