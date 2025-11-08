# UU Starter backed

---

### How to run?

``$ docker compose up --build``

---

### How to set up a new service

1. create directory inside ``./services/{service name}``
2. run ``$ npm init -y``
3. run ``$ npm i express @auth/express amqplib jsonwebtoken dotenv mongoose`` (install mongoose only if db interaction is necessary)
4. add your service to ``docker-compose.yml`` (use other existing services as inspiration)
5. define the service db in ``docker-compose.yml`` (can be skipped if service doesn't need a db).
Remember to also define a volume for your db (bottom of the file)
6. add a file named ``Dockerfile`` to your service root. Copy the contents from an existing service

---

### rabbitMQ

Go to url ``http://localhost:15672/``

user name : "guest"
password : "guest"