const express = require('express');
const app = express();

app.get('/', (req, res) => {
    res.send('Hello World');

    sendLog("This is a test log", LOG_TYPE.INFO);
});

app.listen(3000, () => {
    console.log('Users server is running on port 3000');
});



const {sendLog, LOG_TYPE} = require("../../../common/utils/loggingUtils");
