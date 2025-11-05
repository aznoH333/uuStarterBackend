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
        basePath: "/auth",                // DŮLEŽITÉ
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
        res.json({ token, expiresIn: process.env.JWT_EXPIRES || "15m" });
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

    app.get("/api/me", authenticateJWT, (req, res) => res.json({ user: req.user }));
    app.get("/api/admin", authenticateJWT, requireRole("admin"), (_req, res) => res.json({ ok: true }));
    app.get("/", (_req, res) => {
        res.json({ ok: true, service: "authentication", time: new Date().toISOString() });
    });

    const port = process.env.PORT || 3000;
    app.listen(port, () => console.log(`http://localhost:${port}`));
})();
