cd /var/www/html
#docker-compose down
#docker system prune -a -f
#docker volume prune -f
#docker-compose up -d
docker build -t mayakids-backend:1.0 .
docker stop $(docker ps -q --filter "publish=5000")
docker rm $(docker ps -a -q --filter "publish=5000")
docker ps -a -f status=created -q | xargs -r docker rm
docker ps -a -f status=exited -q | xargs -r docker rm
docker images --filter "dangling=true" -q | xargs -r docker rmi
docker run -d -p 5000:5000 mayakids-backend:1.0
