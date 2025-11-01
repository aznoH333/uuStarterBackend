

const amqp = require('amqplib');


const SUPPORTED_CHANNELS = {
    LOG: "LOG_CHANNEL"
}


/**
 * Sends a message to a rabbitMq channel
 *
 * @param message - any object
 * @param channelName - the name of the channel. use the channels define in [SUPPORTED_CHANNELS]
 */
async function sendMessageToChannel(message, channelName) {
    const connection = await amqp.connect('amqp://rabbitmq');
    const channel = await connection.createChannel();

    const queue = channelName;
    await channel.assertQueue(channelName);

    channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)));

    console.log("Audit log sent:", message);

    setTimeout(() => {
        connection.close();
    }, 500);
}

module.exports = { sendMessageToChannel, SUPPORTED_CHANNELS }