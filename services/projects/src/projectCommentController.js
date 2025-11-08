


const {getProjectById} = require("./projectsController");
const {ProjectComment} = require("./dbInit");
const {sendLog, LOG_TYPE} = require("../../../common/utils/loggingUtils");
const {authenticateJWT, getUserFromHeader, USER_ROLES} = require("../../../common/utils/authenticationUtils");
const {RESPONSES} = require("../../../common/utils/responseUtils");

function useProjectCommentController(app) {
    /**
     * Get all project comments associated with project
     */
    app.get("/:projectId/comments", async (req, res) => {
        const { projectId } = req.params;

        const project = await getProjectById(projectId);


        if (!project) {
            return RESPONSES.ENTITY_NOT_FOUND(res);
        }

        const projectComments = await ProjectComment.find({ "projectId": projectId});


        return res.status(200).json(projectComments).send();

    });

    /**
     * Add a new project comment
     * @param content : String,
     */
    app.post("/:projectId/comments", authenticateJWT, async (req, res) => {
        const { projectId } = req.params;

        const project = await getProjectById(projectId);

        if (!project) {
            return RESPONSES.ENTITY_NOT_FOUND(res);
        }

        const user = getUserFromHeader(req);

        try {
            const comment = new ProjectComment({
                projectId,
                authorId: user.userId,
                content: req.body.content,
                creationDate: new Date(),
            });

            await comment.save();

            sendLog("Created new project comment : " + comment, LOG_TYPE.INFO);

            res.status(200).send();
        }catch(e) {
            sendLog("Failed to create project comment : " + req.body, LOG_TYPE.ERROR);
            return RESPONSES.SAVE_FAILED(res);
        }
    });

    /**
     * get project comment
     */
    app.get("/:projectId/comments/:commentId", async (req, res) => {
        const { projectId, commentId } = req.params;

        const comment = await getProjectCommentById(projectId, commentId);

        if (!comment) {
            return RESPONSES.ENTITY_NOT_FOUND(res);
        }

        res.status(200).json(comment).send();
    });

    app.post("/:projectId/comments/:commentId", async (req, res) => {
        const { projectId, commentId } = req.params;


        const comment = await getProjectCommentById(projectId, commentId);

        if (comment === undefined) {
            return RESPONSES.ENTITY_NOT_FOUND(res);
        }

        const user = getUserFromHeader(req);


        try {

            if (comment.authorId !== user.userId) {
                return RESPONSES.PERMISSION_DENIED(res);
            }

            comment.content = req.body.content;

            await comment.save();

            sendLog("Updated comment " + comment, LOG_TYPE.INFO);

            res.status(200).send();
        }catch(e) {
            sendLog("Failed to update comment " + e, LOG_TYPE.ERROR);
            return RESPONSES.SAVE_FAILED(res);
        }
    });

    app.delete("/:projectId/comments/:commentId", async (req, res) => {
        const { projectId, commentId } = req.params;

        const comment = await getProjectCommentById(projectId, commentId);

        if (!comment) {
            return RESPONSES.ENTITY_NOT_FOUND(res);
        }

        const user = getUserFromHeader(req);


        try {
            if (comment.authorId !== user.userId && user.role !== USER_ROLES.ADMIN) {
                return RESPONSES.PERMISSION_DENIED(res);
            }


            await ProjectComment.deleteOne({"_id": commentId, "projectId": projectId});
            res.status(200).send();
        }catch(e) {
            RESPONSES.SAVE_FAILED(res);
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