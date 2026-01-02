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


function validateBodySchema(schema) {
    return async (req, res, next) => {
        try {
            // Validate the request body against the schema
            await schema.validate(req.body);
            next(); // Proceed to the next middleware or route handler
        } catch (e) {
            return res.status(400).json({ data: req.body, error: e.message }).send();
        }
    };
}


function validateParamSchema(schema) {
    return async (req, res, next) => {
        try {
            await schema.validate(req.params);
            next();
        }catch(e) {
            return res.status(400).json({data: req.params, error: e.message}).send();
        }
    }
}

function validateQuerySchema(schema) {
    return async (req, res, next) => {
        try {
            await schema.validate(req.query);
            next();
        }catch(e) {
            return res.status(400).json({data: req.params, error: e.message}).send();
        }
    }
}


function isOwnerOrAdmin(user, ownerId) {
    return user.userId === ownerId || user.role === USER_ROLES.ADMIN;
}

const USER_ROLES = {
    USER: "USER",
    ADMIN: "ADMIN",
}



module.exports = { authenticateJWT, requireRole, getUserFromHeader, isOwnerOrAdmin, USER_ROLES, validateBodySchema, validateParamSchema, validateQuerySchema }