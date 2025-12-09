const express = require('express');
const app = express();
require("dotenv").config();
const {useUsersController, createAdminUser} = require("./usersController");

app.use(express.json());

useUsersController(app);
createAdminUser()
app.listen(3000, () => {
    console.log('User service is running on port 3000');
});

