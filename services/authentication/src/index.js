const { fetch, Headers, Request, Response, FormData, File, Blob } = require("undici");
Object.assign(globalThis, { fetch, Headers, Request, Response, FormData, File, Blob });
globalThis.crypto = require("crypto").webcrypto;
// --- polyfill structuredClone pro Node 16 ---
if (typeof globalThis.structuredClone !== "function") {
    const { serialize, deserialize } = require("v8");
    globalThis.structuredClone = (obj) => deserialize(serialize(obj));
}

require("dotenv").config();
const express = require("express");
const jwt = require("jsonwebtoken");
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
                    token.email = profile.email;
                    token.name  = profile.name;
                    token.role  = "user";
                }
                return token;
            },
            async session({ session, token }) {
                session.user = { email: token.email, name: token.name, role: token.role };
                return session;
            },
        },
    };
    app.use("/auth", ExpressAuth(authConfig));

    // vydání vlastního krátkodobého JWT (token)
    app.get("/custom-token", async (req, res) => {
        const session = await getSession(req, authConfig);
        if (!session?.user) return res.status(401).json({ error: "Not signed in" });

        const token = jwt.sign(
            { email: session.user.email, role: session.user.role },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES || "15m" }
        );
        res.json({ token, expiresIn: process.env.JWT_EXPIRES || "15m", email: session.user.email, role: session.user.role });
    });

    // auth middleware
    function authenticateJWT(req, res, next) {
        const h = req.headers.authorization || "";
        const t = h.startsWith("Bearer ") ? h.slice(7) : null;
        if (!t) return res.status(401).json({ error: "Missing token" });
        try { req.user = jwt.verify(t, process.env.JWT_SECRET); next(); }
        catch { return res.status(401).json({ error: "Invalid or expired token" }); }
    }
    function requireRole(...allowed) {
        return (req, res, next) => {
            const role = req.user?.role || "user";
            if (!allowed.includes(role)) return res.status(403).json({ error: "Forbidden" });
            next();
        };
    }
    app.post("/login-basic", async (req, res) => {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: "Missing email or password" });
        }

        try {
            // get user na user-service
            const userRes = await fetch("/find-by-email", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });
            if (!userRes.ok) return res.status(401).json({ error: "Invalid credentials" });
            const user = await userRes.json();

            // Ověření hesla
            const match = await bcrypt.compare(password, user.passwordHash);
            if (!match) return res.status(401).json({ error: "Invalid credentials" });

            // Vydání JWT
            const token = jwt.sign(
                { email: user.email, role: user.role },
                process.env.JWT_SECRET,
                { expiresIn: process.env.JWT_EXPIRES || "15m" }
            );

            res.json({ token, expiresIn: process.env.JWT_EXPIRES || "15m", email: user.email, role: user.role });
        } catch (err) {
            console.error(err);
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
