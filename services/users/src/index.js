const express = require('express');
const app = express();

app.get('/', (req, res) => {
    res.send('Hello World');

    sendMessageToChannel({
        test: "this is a test field",
        wohoo: "hello world"
    }, SUPPORTED_CHANNELS.LOG);
});

app.listen(3000, () => {
    console.log('Users server is running on port 3000');
});



const {sendMessageToChannel, SUPPORTED_CHANNELS} = require("../../../common/rabbitMqUtils");
