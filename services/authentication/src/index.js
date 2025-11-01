require("dotenv").config(); // hodí z .env do process.env
const express = require("express");
const { ExpressAuth } = require("@auth/express");
const Google = require("@auth/core/providers/google").default;
const jwt = require("jsonwebtoken");
const port = 3000

const app = express();
app.use(express.json());

// ---- 1) Auth.js route ----
app.use(
    "/auth",
    ExpressAuth({
        secret: process.env.AUTH_SECRET,
        providers: [
            Google({
                clientId: process.env.GOOGLE_ID,
                clientSecret: process.env.GOOGLE_SECRET,
            }),
        ],
        callbacks: {
            async jwt({ token, account, profile }) {
                // první login -> rozšíříme token o data
                if (account && profile) {
                    token.email = profile.email;
                    token.name = profile.name;
                    token.role = "user";
                }
                return token;
            },
            async session({ session, token }) {
                session.user = {
                    email: token.email,
                    name: token.name,
                    role: token.role,
                };
                return session;
            },
        },
    })
);

// ---- 2) Vytvoření vlastního JWT po přihlášení ----
app.get("/auth/custom-token", async (req, res) => {
    // Auth.js dává session do requestu (pokud user přihlášen)
    const { getSession } = require("@auth/express");
    const session = await getSession(req);

    if (!session?.user) {
        return res.status(401).json({ error: "Not signed in" });
    }

    // vydáme vlastní krátkodobý token
    const token = jwt.sign(
        {
            email: session.user.email,
            role: session.user.role,
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES }
    );

    res.json({ token, expiresIn: process.env.JWT_EXPIRES });
});

// ---- 3) Middleware: ověření vlastního JWT ----
function authenticateJWT(req, res, next) {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!token) return res.status(401).json({ error: "Missing token" });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch {
        res.status(401).json({ error: "Invalid or expired token" });
    }
}

// ---- 4) Middleware: ověření role ----
function requireRole(...allowed) {
    return (req, res, next) => {
        const role = req.user?.role || "user";
        if (!allowed.includes(role)) {
            return res.status(403).json({ error: "Forbidden" });
        }
        next();
    };
}

// ---- 5) Chráněné routy ----
app.get("/api/me", authenticateJWT, (req, res) => {
    res.json({ user: req.user });
});

app.get("/api/admin", authenticateJWT, requireRole("admin"), (req, res) => {
    res.json({ secret: "Tajná data pro admina" });
});

// ---- 6) Start ----
app.listen(port, () => console.log("http://localhost:3000"));
