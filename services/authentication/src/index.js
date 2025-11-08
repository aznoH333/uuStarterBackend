const { fetch, Headers, Request, Response, FormData, File, Blob } = require("undici");
Object.assign(globalThis, { fetch, Headers, Request, Response, FormData, File, Blob });
globalThis.crypto = require("crypto").webcrypto;
// --- polyfill structuredClone pro Node 16 ---
if (typeof globalThis.structuredClone !== "function") {
    const { serialize, deserialize } = require("v8");
    globalThis.structuredClone = (obj) => deserialize(serialize(obj));
}
const bcrypt = require("bcrypt");
require("dotenv").config();
const express = require("express");
const jwt = require("jsonwebtoken");
const {authenticateJWT, requireRole} = require("../../../common/utils/authenticationUtils");
const app = express();
app.use(express.json());

(async () => {
    const { ExpressAuth, getSession } = await import("@auth/express");
    const Google = (await import("@auth/core/providers/google")).default;

    const authConfig = {
        secret: process.env.AUTH_SECRET,
        basePath: "/auth",
        providers: [
            Google({
                clientId: process.env.GOOGLE_ID,
                clientSecret: process.env.GOOGLE_SECRET,
            }),
        ],
        callbacks: {
            async jwt({ token, account, profile }) {
                if (account && profile) {
                    const email = (profile.email || "").trim().toLowerCase();
                    try {
                        const resp = await fetch(process.env.USERS_SERVICE_URL + "/create-google", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ email, name: profile.name })
                        });
                        if (!resp.ok) {
                            console.error("[users-service] /create-google failed", resp.status, await resp.text());
                        }
                    } catch (e) {
                        console.error("[users-service] /create-google error", e);
                    }

                    // naplň do tokenu co potřebuješ
                    token.email = email;
                    token.name  = profile.name;
                    token.role  = "user";
                }
                return token;
            },
            async session({ session, token }) {
                session.user = { email: token.email, name: token.name, role: token.role };
                return session;
            },
        }

    };
    app.use("/auth", ExpressAuth(authConfig));

    // vydání vlastního krátkodobého JWT (token)
    app.get("/custom-token", async (req, res) => {
        const session = await getSession(req, authConfig);
        if (!session?.user) return res.status(401).json({ error: "Not signed in" });

        const token = jwt.sign(
            { email: session.user.email, role: session.user.role, userId: session.user.id },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES || "15m" }
        );
        res.json({ token, expiresIn: process.env.JWT_EXPIRES || "15m", email: session.user.email, role: session.user.role });
    });


    app.post("/login-basic", async (req, res) => {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ error: "Missing email or password" });

        try {
            const url = process.env.USERS_SERVICE_URL + "/find-by-email";
            console.log("calling users-service:", url, email);
            const userRes = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });

            if (!userRes.ok) return res.status(401).json({ error: "Invalid credentials" });
            const user = await userRes.json();

            const match = await bcrypt.compare(password, user.passwordHash);
            if (!match) return res.status(401).json({ error: "Invalid credentials" });

            const token = jwt.sign(
                { email: user.email, role: user.role, userId: user.id },
                process.env.JWT_SECRET,
                { expiresIn: process.env.JWT_EXPIRES || "15m" }
            );

            res.json({ token, expiresIn: process.env.JWT_EXPIRES || "15m", email: user.email, role: user.role });
        } catch (err) {
            console.error("login-basic error:", err);
            res.status(500).json({ error: "Internal error" });
        }
    });

    app.get("/api/me", authenticateJWT, (req, res) => res.json({ user: req.user }));
    app.get("/api/admin", authenticateJWT, requireRole("admin"), (_req, res) => res.json({ ok: true }));
    app.get("/", (_req, res) => {
        res.json({ ok: true, service: "authentication", time: new Date().toISOString() });
    });

    const port = process.env.PORT || 3000;
    app.listen(port, () => console.log(`http://localhost:${port}`));
})();
