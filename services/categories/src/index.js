const express = require('express');
const app = express();
require("dotenv").config();
const {useCategoriesController} = require("./categoriesController");

app.use(express.json());

useCategoriesController(app);

app.listen(3000, () => {
    console.log('Categories service is running on port 3000');
});



