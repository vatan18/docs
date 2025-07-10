
sudo docker-compose up -d
 2009  docker network create proxy
 2010  sudo docker network create proxy
 2011  sudo docker-compose up -d
 2012  docker ps
 2013  sudo docker ps
 2014  gedit ~/.bashrc
 2015  source ~/.bashrc
 2016  docker ps
 2017  docker inspect gitlab
 2018  docker ps
 2019  docker logs gitlab 
 2020  docker ps
 2021  docker logs gitlab 
 2022  docker ps
 2023  ls
 2024  docker ps
 2025  docker exec -it gitlab bash
 2026  docker restart gitlab 
 2027  docker ps
 2028  clear
 2029  docker logs gitlab 
 2030  docker ps
 2031  ls gitlab_data/
 2032  ls gitlab_config/
 2033  docker exec gitlab bash
 2034  docker exec -it gitlab bash
 2035  history

root@git:/# history
    1  ls -l
    2  gitlab-ctl status
    3  gitlab reconfigure
    4  gitlab-ctl reconfigure
    5  ls -l
    6  gitlab-ctl status
    7  ls -ld /var/opt/gitlab /var/log/gitlab /etc/gitlab
    8  chown -R git:git /var/opt/gitlab /var/log/gitlab /etc/gitlab
    9  ls -ld /var/opt/gitlab /var/log/gitlab /etc/gitlab
   10  gitlab-ctl status
   11  gitlab-ctl reconfigure
   12  gitlab-ctl status
   13  cat /var/log/gitlab/redis/current | tail -n 50
   14  cat /var/log/gitlab/postgresql/current | tail -n 50
   15  chown -R git:git /var/opt/gitlab/postgresql /var/opt/gitlab/redis
   16  ls -l /var/opt/gitlab/postgresql/data/PG_VERSION
   17  ls -ld /var/opt/gitlab/redis /var/opt/gitlab/postgresql/data
   18  gitlab-ctl restart
   19  gitlab-ctl status
   20  tail -n 50 /var/log/gitlab/postgresql/current
   21  clear
   22  tail -n 50 /var/log/gitlab/postgresql/current
   23  clear
   24  ls -ld /var/opt/gitlab
   25  ls -ld /var/opt/gitlab/postgresql
   26  ls -ld /var/opt/gitlab/postgresql/data
   27  ls -l /var/opt/gitlab/postgresql/data/postgresql.conf
   28  chown -R git:git /var/opt/gitlab
   29  ls -l /var/opt/gitlab/postgresql/data/postgresql.conf
   30  gitlab-ctl status
   31  chmod 755 /var/opt/gitlab
   32  chmod 755 /var/opt/gitlab/postgresql
   33  chmod 700 /var/opt/gitlab/postgresql/data
   34  chmod 600 /var/opt/gitlab/postgresql/data/postgresql.conf
   35  gitlab-ctl restart postgresql
   36  ls -ld /var/opt/gitlab
   37  ls -ld /var/opt/gitlab/postgresql
   38  ls -ld /var/opt/gitlab/postgresql/data
   39  ls -l /var/opt/gitlab/postgresql/data/postgresql.conf
   40  clear
   41  ls -ld /var/opt/gitlab
   42  ls -ld /var/opt/gitlab/postgresql
   43  ls -ld /var/opt/gitlab/postgresql/data
   44  ls -l /var/opt/gitlab/postgresql/data/postgresql.conf
   45  chmod 755 /var/opt/gitlab
   46  chmod 755 /var/opt/gitlab/postgresql
   47  chmod 700 /var/opt/gitlab/postgresql/data
   48  chmod 600 /var/opt/gitlab/postgresql/data/postgresql.conf
   49  gitlab-ctl restart postgresql
   50  gitlab-ctl status
   51  gitlab-ctl restart
   52  gitlab-ctl status
   53  tail -n 50 /var/log/gitlab/redis/current
   54  clear
   55  tail -n 50 /var/log/gitlab/redis/current
   56  chown gitlab-redis:gitlab-redis /var/opt/gitlab/redis/redis.conf
   57  chmod 640 /var/opt/gitlab/redis/redis.conf
   58  chown -R gitlab-redis:gitlab-redis /var/opt/gitlab/redis
   59  chmod 750 /var/opt/gitlab/redis
   60  gitlab-ctl restart redis
   61  gitlab-ctl status
   62  cleafr
   63  clear
   64  gitlab-ctl status
   65  ls -ld /var/opt/gitlab/postgresql
   66  ls -ld /var/opt/gitlab/postgresql/data
   67  ls -l /var/opt/gitlab/postgresql/data/postgresql.conf
   68  chown -R gitlab-psql:gitlab-psql /var/opt/gitlab/postgresql
   69  chmod 700 /var/opt/gitlab/postgresql/data
   70  chmod 600 /var/opt/gitlab/postgresql/data/postgresql.conf
   71  gitlab-ctl restart postgresql
   72  gitlab-ctl status
   73  gitlab-ctl restart
   74  exit
   75  history
