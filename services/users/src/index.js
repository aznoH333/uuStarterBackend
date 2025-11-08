const express = require('express');
const app = express();
const {User} = require("./dbInit");
const bcrypt = require('bcrypt');
require("dotenv").config();

const {sendLog, LOG_TYPE} = require("../../../common/utils/loggingUtils");
app.use(express.json());
const SALT_ROUNDS = 12;

app.post("/find-by-email", async (req, res) => {
    const email = (req.body.email || "").trim().toLowerCase();
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: "Not found" });
    res.json({
        email: user.email,
        passwordHash: user.password,
        role: user.role,
        authType: user.authType,
        userId: user._id,
    });
});
app.post('/create-basic', async (req, res) => {
    try {
        const name = (req.body.name || '').trim();
        const email = (req.body.email);
        const password = req.body.password;

        if (!name || !email || !password) {
            return res.status(400).json({ error: "Missing name/email/password" });
        }

        const exists = await User.findOne({ email });
        if (exists) return res.status(409).json({ error: "Email already registered" });

        const passwordHash = await hashPassword(password);

        const newUser = new User({
            name,
            email,
            password: passwordHash,
            role: "user".toUpperCase(),
            authType: "BASIC",
            lastLoginAt: Date.now(),
        });

        await newUser.save();
        await sendLog(`New BASIC user created ${email}`, LOG_TYPE.INFO);

        return res.status(201).json(newUser);
    } catch (e) {
        console.error(e);
        return res.status(500).json({ error: "Internal error" });
    }
});
app.post('/create-google', async (req, res) => {
    try {
        const name = (req.body.name || '').trim();
        const email = req.body.email
        if (!email) return res.status(400).json({ error: "Missing email" });

        let user = await User.findOne({ email });
        if (user) return res.status(200).json(user);

        user = new User({
            name: name || email.split('@')[0],
            email,
            password: null,
            role: "user".toUpperCase(),
            authType: "GOOGLE",
            lastLoginAt: Date.now(),
        });

        await user.save();
        await sendLog(`New GOOGLE user created ${email}`, LOG_TYPE.INFO);

        return res.status(201).json(user);
    } catch (e) {
        console.error(e);
        return res.status(500).json({ error: "Internal error" });
    }
});

function hashPassword(password) {
    return bcrypt.hash(password, SALT_ROUNDS);
}
app.listen(3000, () => {
    console.log('User service is running on port 3000');
});
