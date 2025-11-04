# UU Starter backed

---

### How to run?

``$ docker compose up --build``

---

### How to set up a new service

1. create directory inside ``./services/{service name}``
2. run ``$ npm init``
3. run ``$ npm i express @auth/express amqplib``
4. add your service to ``docker-compose.yml`` (use other existing services as inspiration)
5. add a file named ``Dockerfile`` to your service root. Copy the contents from an existing service

---

### rabbitMQ

Go to url ``http://localhost:15672/``

user name : "guest"
password : "guest"