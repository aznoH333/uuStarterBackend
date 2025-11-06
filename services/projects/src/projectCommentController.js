
/*
const ProjectCommentSchema = new mongoose.Schema({
    authorId: { type: String, required: true },
    projectId: { type: String, required: true },
    content: { type: String, required: true },
    creationDate: { type: Date, required: true },
});
 */

const {getProjectById} = require("./projectsController");
const {ProjectComment} = require("./dbInit");
const {sendLog, LOG_TYPE} = require("../../../common/utils/loggingUtils");

function useProjectCommentController(app) {
    /**
     * Get all project comments associated with project
     */
    app.get("/:projectId/comments", async (req, res) => {
        const { projectId } = req.params;

        const project = await getProjectById(projectId);


        if (!project) {
            res.status(400).send();
        }

        const projectComments = await ProjectComment.find({ "projectId": projectId});


        return res.status(200).json(projectComments).send();

    });

    /**
     * Add a new project comment
     * @param name : String,
     * @param content : String,
     */
    app.post("/:projectId/comments", async (req, res) => {
        const { projectId } = req.params;

        const project = await getProjectById(projectId);

        if (!project) {
            res.status(400).send();
        }

        try {
            const comment = new ProjectComment({
                projectId,
                authorId: req.body.authorId,
                content: req.body.content,
                creationDate: new Date(),
            });

            await comment.save();

            sendLog("Created new project comment : " + comment, LOG_TYPE.INFO);

            res.status(200).send();
        }catch(e) {
            sendLog("Failed to create project comment : " + req.body, LOG_TYPE.ERROR);
            res.status(400).send();
        }
    });

    /**
     * get project comment
     */
    app.get("/:projectId/comments/:commentId", async (req, res) => {
        const { projectId, commentId } = req.params;

        const comment = await getProjectCommentById(projectId, postId);

        if (!comment) {
            res.status(400).send();
        }

        res.status(200).json(comment).send();
    });

    app.post("/:projectId/comments/:commentId", async (req, res) => {
        const { projectId, commentId } = req.params;


        const comment = await getProjectCommentById(projectId, commentId);

        if (comment === undefined) {
            res.status(400).send();
        }

        try {
            comment.content = req.body.content;

            await comment.save();

            sendLog("Updated comment " + comment, LOG_TYPE.INFO);

            res.status(200).send();
        }catch(e) {
            sendLog("Failed to update comment " + e, LOG_TYPE.ERROR);
            res.status(400).send();
        }
    });

    app.delete("/:projectId/comments/:commentId", async (req, res) => {
        const { projectId, commentId } = req.params;

        const comment = await getProjectCommentById(projectId, commentId);

        if (!comment) {
            res.status(400).send();
        }


        try {
            await ProjectComment.deleteOne({"_id": commentId, "projectId": projectId});
            res.status(200).send();
        }catch(e) {
            res.status(400).send();
        }
    });
}

/**
 * @param projectId
 * @param postId
 * @returns {Promise<undefined|ProjectComment>}
 */
async function getProjectCommentById(projectId, postId) {
    const project = getProjectById(projectId);

    if (!project) {
        return undefined;
    }

    try {
        return await ProjectComment.findOne({"_id": postId, "projectId": projectId});
    }catch (e) {
        return undefined;
    }
}

module.exports = { useProjectCommentController };