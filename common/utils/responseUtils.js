const RESPONSES = {
    ENTITY_NOT_FOUND: (res)=> {
        res.status(400).json({error: "Not found"}).send();
    },
    PERMISSION_DENIED: (res) => {
        res.status(400).json({error: "Permission denied"}).send();
    },
    SAVE_FAILED: (res) => {
        res.status(400).json({error: "Failed to save entity"}).send();
    }
}

module.exports = { RESPONSES }