const express = require('express');
const app = express();
const { Log} = require("./dbInit");




app.get('/', async (req, res) => {

    const logs = await Log.find();

    res.status(200).json(logs)
});

app.listen(3000, () => {
    console.log('Logging server is running on port 3000');
});

const {listenOnChannel, SUPPORTED_CHANNELS} = require("../../../common/rabbitMqUtils");

async function logMessage(message) {
    console.log("Recieved log: " + message, Object.keys(message));


    const newLog = new Log(message);
    await newLog.save();
}


listenOnChannel(SUPPORTED_CHANNELS.LOG, logMessage);

