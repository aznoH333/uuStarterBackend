const {User} = require("./dbInit");
const {sendLog, LOG_TYPE} = require("../../../common/utils/loggingUtils");
const {authenticateJWT, getUserFromHeader} = require("../../../common/utils/authenticationUtils");
const {RESPONSES} = require("../../../common/utils/responseUtils");
const bcrypt = require('bcrypt');
const SALT_ROUNDS = 12;
const jwt = require("jsonwebtoken");

require("dotenv").config();

function useUsersController(app) {
    // get all users
    app.get("/", async (req, res) => {
        // TODO : filtering
        const users = await User.find();
        res.status(200).json(users);
    });

    app.get("/:userId", async (req, res) => {
        const { userId } = req.params;

        try {
            const user = await User.findById(userId);
            res.status(200).json(user);

        }catch (e) {
            return RESPONSES.ENTITY_NOT_FOUND(res);
        }
    });

    /**
     * Updates existing user
     * @param name : String
     * @param emial : String
     * @param password : String
     */
   app.put("/:userId", authenticateJWT, async (req, res)=> {
        // TODO: Do some permissions for this shit xd
        const { userId } = req.params;
        const user = getUserFromHeader(req);

        try {
            const user = await User.findById(userId);
            const password = req.body.password;
            const passwordHash = await hashPassword(password);

            user.name = req.body.name;
            user.email = req.body.email;
            user.password = passwordHash;
            await user.save();
            sendLog("Updated user : " + user._id.toString(), LOG_TYPE.INFO);
            res.status(200).send();
        }catch (e) {
            sendLog("Failed to save user : " + userId + "\n Failed with error : " + e, LOG_TYPE.ERROR);
            return RESPONSES.SAVE_FAILED(res);
        }
    });

    /**
     * Gets existing user by email
     * @param emial : String
     */
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

    /**
     * Creates existing user by our registration (BASIC)
     * @param name : String
     * @param emial : String
     * @param password : String
     */
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

    /**
     * Creates existing user by google registration (GOOGLE)
     * @param emial : String
     */
    app.post('/create-google', async (req, res) => {
        try {
            const email = req.body.email
            if (!email) return res.status(400).json({ error: "Missing email" });

            let user = await User.findOne({ email });
            if (user) return res.status(200).json(user);

            user = new User({
                name: email.split('@')[0],
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

}

/**
 * Find user
 * @param userId
 * @returns {Promise<undefined|User>}
 */
async function getUserById(userId) {
    try {
        return await User.findById(userId);
    }catch (e) {
        return undefined;
    }
}
function hashPassword(password) {
    return bcrypt.hash(password, SALT_ROUNDS);
}
async function createAdminUser() {
    const passwordHash = await hashPassword("epickeHeslo159");

    const user = new User({
        name: "admin",
        email: "admin@admin.cum",
        password: passwordHash,
        role: "ADMIN",
        authType: "BASIC",
        lastLoginAt: Date.now(),
    });

    user.save();
    sendLog(`New ADMIN user created name: ${user.name}, email: ${user.email}, role: ${user.role}`, LOG_TYPE.INFO);
}
module.exports = { useUsersController, getUserById, createAdminUser };