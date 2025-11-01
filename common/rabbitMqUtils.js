

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


function listenOnChannel(channelName, messageHandler, retries = 5) {
    _listenOnChannel(channelName, messageHandler, retries).then();
}


async function _listenOnChannel(channelName, messageHandler, retries = 5) {
    try {
        const connection = await amqp.connect('amqp://rabbitmq');
        const channel = await connection.createChannel();

        const queue = channelName;
        await channel.assertQueue(queue);

        channel.consume(queue, (message) => {
            if (message !== null) {
                messageHandler(JSON.parse(message.content.toString()));
                channel.ack(message);
            }
        });

    } catch (error) {
        if (retries > 0) {
            setTimeout(() => _listenOnChannel(channelName, messageHandler, retries - 1), 5000); // Wait 5 seconds before retrying
        } else {
            console.error("Could not listen for channel. Maximum retries exceeded", error);
            process.exit(1); // Exit if it exceeds retries
        }
    }
}


module.exports = { sendMessageToChannel, listenOnChannel, SUPPORTED_CHANNELS }