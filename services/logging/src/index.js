const express = require('express');
const app = express();
const {Log} = require("./dbInit");
require("dotenv").config();

const {listenOnChannel, SUPPORTED_CHANNELS} = require("../../../common/utils/rabbitMqUtils");


app.get('/', async (req, res) => {

    const logs = await Log.find();

    res.status(200).json(logs)
});

app.listen(3000, () => {
    console.log('Logging server is running on port 3000');
});


async function logMessage(message) {
    console.log("Recieved log: " + message, Object.keys(message));


    const newLog = new Log(message);
    await newLog.save();
}


listenOnChannel(SUPPORTED_CHANNELS.LOG, logMessage);

