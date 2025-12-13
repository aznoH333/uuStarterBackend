const RESPONSES = {
    ENTITY_NOT_FOUND: (res)=> {
        res.status(404).json({error: "Not found"}).send();
    },
    PERMISSION_DENIED: (res, message) => {
        res.status(401).json({error: message === undefined ? "Permission denied" : message}).send();
    },
    SAVE_FAILED: (res) => {
        res.status(400).json({error: "Failed to save entity"}).send();
    },
    ENTITY_CONFLICT: (res) => {
        return res.status(409).json({error: "Entity conflict"});
    }
}

module.exports = { RESPONSES }