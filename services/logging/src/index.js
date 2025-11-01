const express = require('express');
const app = express();

app.get('/', (req, res) => {
    res.send('Hello World');
});

app.listen(3000, () => {
    console.log('Logging server is running on port 3000');
});

const {listenOnChannel, SUPPORTED_CHANNELS} = require("../../../common/rabbitMqUtils");

function logMessage(message) {
    console.log("Recieved log: " + message);
}


listenOnChannel(SUPPORTED_CHANNELS.LOG, logMessage);

