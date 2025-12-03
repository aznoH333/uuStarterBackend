const express = require('express');
const app = express();
require("dotenv").config();

const {useDonationsController} = require("./donationsController");

app.use(express.json());

useDonationsController(app);

app.listen(3000, () => {
    console.log('Donations service is running on port 3000');
});



