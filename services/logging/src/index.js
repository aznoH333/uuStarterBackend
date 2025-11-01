const express = require('express');
const app = express();

app.get('/', (req, res) => {
    res.send('Hello World');
});

app.listen(3000, () => {
    console.log('Logging server is running on port 3000');
});

const amqp = require('amqplib');

async function receiveAuditLogs(retries = 5) {
    try {
        const connection = await amqp.connect('amqp://rabbitmq');
        const channel = await connection.createChannel();

        const queue = 'audit_logs';
        await channel.assertQueue(queue);

        channel.consume(queue, (message) => {
            if (message !== null) {
                const log = JSON.parse(message.content.toString());
                console.log("Received audit log:", log);
                channel.ack(message);
            }
        });

        console.log("Waiting for audit logs...");
    } catch (error) {
        console.error("Failed to connect to RabbitMQ. Retrying...", error);
        if (retries > 0) {
            setTimeout(() => receiveAuditLogs(retries - 1), 5000); // Wait 5 seconds before retrying
        } else {
            console.error("Exceeded maximum retries. Exiting...");
            process.exit(1); // Exit if it exceeds retries
        }
    }
}

receiveAuditLogs().then();

module.exports = { receiveAuditLogs };