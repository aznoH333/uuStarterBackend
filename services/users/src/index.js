const express = require('express');
const app = express();

app.get('/', (req, res) => {
    res.send('Hello World');

    sendMessageToChannel({
        test: "this is a test field",
        wohoo: "hello world"
    }, "audit_logs");
});

app.listen(3000, () => {
    console.log('Users server is running on port 3000');
});


const amqp = require('amqplib');
const {sendMessageToChannel} = require("../../../common/rabbitMqUtils");

async function sendAuditLog(log) {
    const connection = await amqp.connect('amqp://rabbitmq'); // Use service name defined in docker-compose
    const channel = await connection.createChannel();

    const queue = 'audit_logs';
    await channel.assertQueue(queue);

    channel.sendToQueue(queue, Buffer.from(JSON.stringify(log)));

    console.log("Audit log sent:", log);

    setTimeout(() => {
        connection.close();
    }, 500);
}

module.exports = { sendAuditLog };