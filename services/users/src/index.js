const express = require('express');
const app = express();
const {User} = require("./dbInit");
const bcrypt = require('bcrypt');
const {sendLog, LOG_TYPE} = require("../../../common/utils/loggingUtils");

app.post('/create',
    (req, res) => {
        const newUser = createUser(req.body);
        res.status(201).json(newUser);
    })

async function createUser(user) {
    const newUser = {
        name: user.name,
        email: user.email,
        password: hashPassword(user.password),
        role: user.role,
        lastLoginAt: Date.now(),
    }
    const newUserDb = new User(newUser);
    await newUserDb.save();
    await sendLog("New user has been created " + newUser.toString(), LOG_TYPE.INFO);
    return newUser;
}

function hashPassword(password) {
    const salt = bcrypt.genSalt();
    return bcrypt.hash(password, salt);
}