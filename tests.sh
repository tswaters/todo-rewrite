
# spin up the dependencies & wait for things to be fine.
# ddl is a good for `postgres` but we need to wait for amqp/redis as well.

docker-compose -p todo-test up --build -d
docker wait todo-test_ddl_1
docker run --rm --network todo-test_default -e TARGETS=rabbitmq:5672,postgres:5432,redis:6379 waisbrot/wait

# pull out .env/* into environment variables for the test process
# a few overrides are needed to to account for different project name

for f in .env/*; do
  export $(basename $f)=$(cat $f)
done

export AMQP_HOST=localhost
export PGHOST=localhost
export REDIS_HOST=localhost
export LOG_LEVEL=silent

# with dependends going, we can run tests.
npm run --silent coverage

# cleanup
docker-compose -p todo-test down
