const {getProjectById} = require("./projectsController");
const {ProjectUpdate} = require("./dbInit");
const {sendLog, LOG_TYPE} = require("../../../common/utils/loggingUtils");



/*
name: { type: String, required: true },
    projectId: { type: String, required: true },
    content: { type: String, required: true },
    creationDate: { type: String, required: true},
    lastUpdatedDate: { type: Date, required: true },
 */

function useProjectUpdateController(app) {
    /**
     * Get all project posts associated with project
     */
    app.get("/:projectId/posts", async (req, res) => {
        const { projectId } = req.params;

        const project = await getProjectById(projectId);


        if (!project) {
            res.status(400).send();
        }

        const projectUpdates = await ProjectUpdate.find({ "projectId": projectId});


        return res.status(200).json(projectUpdates).send();

    });

    /**
     * Add a new project post
     * @param name : String,
     * @param content : String,
     */
    app.post("/:projectId/posts", async (req, res) => {
        const { projectId } = req.params;

        const project = await getProjectById(projectId);

        if (!project) {
            res.status(400).send();
        }

        try {
            const update = new ProjectUpdate({
                projectId,
                name: req.body.name,
                content: req.body.content,
                creationDate: new Date(),
                lastUpdatedDate: new Date(),
            });

            await update.save();

            sendLog("Created new project update : " + update, LOG_TYPE.INFO);

            res.status(200).send();
        }catch(e) {
            sendLog("Failed to create project update : " + req.body, LOG_TYPE.ERROR);
            res.status(400).send();
        }
    });

    /**
     * get project post
     */
    app.get("/:projectId/posts/:postId", async (req, res) => {
        const { projectId, postId } = req.params;

        const post = getProjectPostById(projectId, postId);

        if (!post) {
            res.status(400).send();
        }

        res.status(200).json(post).send();
    });

    app.post("/:projectId/posts/:postId", async (req, res) => {
        const { projectId, postId } = req.params;


        const post = await getProjectPostById(projectId, postId);

        if (post === undefined) {
            res.status(400).send();
        }

        try {
            post.name = req.body.name;
            post.content = req.body.content;
            post.lastUpdatedDate = new Date();

            await post.save();

            sendLog("Updated post " + post, LOG_TYPE.INFO);

            res.status(200).send();
        }catch(e) {
            sendLog("Failed to update post " + e, LOG_TYPE.ERROR);
            res.status(400).send();
        }
    });

    app.delete("/:projectId/posts/:postId", async (req, res) => {
        const { projectId, postId } = req.params;

        const post = await getProjectPostById(projectId, postId);

        if (!post) {
            res.status(400).send();
        }


        try {
            await ProjectUpdate.deleteOne({"_id": postId, "projectId": projectId});
            res.status(200).send();
        }catch(e) {
            res.status(400).send();
        }
    });
}


/**
 * @param projectId
 * @param postId
 * @returns {Promise<undefined|ProjectUpdate>}
 */
async function getProjectPostById(projectId, postId) {
    const project = getProjectById(projectId);

    if (!project) {
        return undefined;
    }

    try {
        return await ProjectUpdate.findOne({"_id": postId, "projectId": projectId});
    }catch (e) {
        return undefined;
    }
}





module.exports = { useProjectUpdateController }