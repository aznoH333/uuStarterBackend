const jwt = require("jsonwebtoken");

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
        const role = req.user?.role || USER_ROLES.USER;
        if (!allowed.includes(role)) return res.status(403).json({ error: "Forbidden" });
        next();
    };
}

function getUserFromHeader(req) {
    const h = req.headers.authorization || "";
    const t = h.startsWith("Bearer ") ? h.slice(7) : null;
    try {
        req.user = jwt.verify(t, process.env.JWT_SECRET);
        return req.user;
    }catch (e) {
        return undefined;
    }
}

const USER_ROLES = {
    USER: "user",
    ADMIN: "admin",
}

module.exports = { authenticateJWT, requireRole, getUserFromHeader, USER_ROLES }