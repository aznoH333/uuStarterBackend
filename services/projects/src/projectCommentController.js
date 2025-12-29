


const {getProjectById} = require("./projectsController");
const {ProjectComment} = require("./dbInit");
const {sendLog, LOG_TYPE} = require("../../../common/utils/loggingUtils");
const {authenticateJWT, getUserFromHeader, isOwnerOrAdmin, validateParamSchema, validateBodySchema} = require("../../../common/utils/authenticationUtils");
const {RESPONSES} = require("../../../common/utils/responseUtils");
const { object, string, number} = require("yup");
const {fetchFromService} = require("../../../common/utils/fetchUtils");


function useProjectCommentController(app) {
    /**
     * Get all project comments associated with project
     */
    app.get("/:projectId/comments",
        validateParamSchema(object({
            projectId: string().required()
        })),

        async (req, res) => {
        const { projectId } = req.params;

        const project = await getProjectById(projectId);

        if (!project) {
            return RESPONSES.ENTITY_NOT_FOUND(res);
        }


        const projectComments = await ProjectComment.find({ "projectId": projectId});
        try {
            return res.status(200).json((await Promise.all(projectComments.map(async (it)=> await fillOutProjectCommentViewModel(it))))).send();
        }catch(e) {
            return RESPONSES.ENTITY_NOT_FOUND(res);
        }


    });

    /**
     * Add a new project comment
     * @param content : String,
     */
    app.post("/:projectId/comments",
        validateParamSchema(object({
            projectId: string().required()
        })),
        validateBodySchema(object({
            content: string().required()
        })),
        authenticateJWT, async (req, res) => {
        const { projectId } = req.params;

        const project = await getProjectById(projectId);

        if (!project) {
            return RESPONSES.ENTITY_NOT_FOUND(res);
        }


        if (req.body.parentCommentId) {
            const comment = await getProjectCommentById(projectId, req.body.parentCommentId);

            if (!comment) {
                return RESPONSES.ENTITY_NOT_FOUND(res);
            }
        }

        const user = getUserFromHeader(req);

        try {
            const comment = new ProjectComment({
                projectId,
                authorId: user.userId,
                content: req.body.content,
                creationDate: new Date(),
                parentCommentId: req.body.parentCommentId,
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
    app.get(
        "/:projectId/comments/:commentId",
        validateParamSchema(object({
            projectId: string().required(),
            commentId: string().required()
        })),
        async (req, res) => {
        const { projectId, commentId } = req.params;

        const comment = await getProjectCommentById(projectId, commentId);

        if (!comment) {
            return RESPONSES.ENTITY_NOT_FOUND(res);
        }

        res.status(200).json(await fillOutProjectCommentViewModel(comment)).send();
    });

    /**
     * update project comment
     */
    app.post(
        "/:projectId/comments/:commentId",
        validateParamSchema(object({
            projectId: string().required(),
            commentId: string().required()
        })),
        validateBodySchema(object({
            content: string().required()
        })),
        authenticateJWT, async (req, res) => {
        const { projectId, commentId } = req.params;

        const comment = await getProjectCommentById(projectId, commentId);

        if (comment === undefined) {
            return RESPONSES.ENTITY_NOT_FOUND(res);
        }

        if (req.body.parentCommentId) {
            const comment = await getProjectCommentById(projectId, req.body.parentCommentId);

            if (!comment) {
                return RESPONSES.ENTITY_NOT_FOUND(res);
            }
        }


        const user = getUserFromHeader(req);


        try {

            if (!isOwnerOrAdmin(user, comment.authorId)) {
                return RESPONSES.PERMISSION_DENIED(res);
            }

            comment.content = req.body.content;
            comment.parentCommentId = req.body.parentCommentId;

            await comment.save();

            sendLog("Updated comment " + comment, LOG_TYPE.INFO);

            res.status(200).send();
        }catch(e) {
            sendLog("Failed to update comment " + e, LOG_TYPE.ERROR);
            return RESPONSES.SAVE_FAILED(res);
        }
    });

    app.delete("/:projectId/comments/:commentId",
        validateParamSchema(object({
            projectId: string().required(),
            commentId: string().required()
        }))
        , async (req, res) => {
        const { projectId, commentId } = req.params;

        const comment = await getProjectCommentById(projectId, commentId);

        if (!comment) {
            return RESPONSES.ENTITY_NOT_FOUND(res);
        }

        const user = getUserFromHeader(req);


        try {
            if (!isOwnerOrAdmin(user, comment.authorId)) {
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


async function fillOutProjectCommentViewModel(comment) {
    const user = await fetchFromService(
        `${process.env.USER_SERVICE_URL}/${comment.authorId}`
    );

    if (!user) {
        throw Error("user not found");
    }

    return {
        ...comment._doc, // I LOVE MONGO DB. YEAH WOOOOOOO
        author: user,
    }
}

module.exports = { useProjectCommentController };