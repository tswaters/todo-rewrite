FROM docteurklein/sqitch:pgsql

WORKDIR /src
ADD . .

ENTRYPOINT ["bash", "./wait-for-it.sh", "postgres:5432", "--", "bash", "./init.sh"]
