
set /p PGPASSWORD=<../.env/PGPASSWORD

docker run -v %cd%:/src -e PGPORT=5432 -e PGHOST=postgres -e PGPASSWORD=%PGPASSWORD% -e PGUSER=todo -e PGDATABASE=todo --network todo-rewrite_default --rm todo-ddl deploy --verify
