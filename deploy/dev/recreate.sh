./remove.sh
docker-compose --env-file .env -f docker-dev.yml up --build -d --force-recreate -V
source .env
ssh -oStrictHostKeyChecking=no -p 22222 -R api.${SERVER_DOMAIN}:80:localhost:${SERVER_PORT} dev.nftal.io | \
./log.sh
