const {getProjectById} = require("./projectsController");
const {ProjectUpdate} = require("./dbInit");
const {sendLog, LOG_TYPE} = require("../../../common/utils/loggingUtils");
const {RESPONSES} = require("../../../common/utils/responseUtils");
const {authenticateJWT, getUserFromHeader, USER_ROLES, isOwnerOrAdmin, validateParamSchema, validateBodySchema} = require("../../../common/utils/authenticationUtils");
const { object, string} = require("yup");




function useProjectUpdateController(app) {
    /**
     * Get all project posts associated with project
     */
    app.get("/:projectId/posts",
        validateParamSchema(object({
            projectId: string().required()
        })),
        async (req, res) => {
        const { projectId } = req.params;

        const project = await getProjectById(projectId);


        if (!project) {
            return RESPONSES.ENTITY_NOT_FOUND(res);
        }

        const projectUpdates = await ProjectUpdate.find({ "projectId": projectId});


        return res.status(200).json(projectUpdates).send();

    });

    /**
     * Add a new project post
     * @param name : String,
     * @param content : String,
     */
    app.post("/:projectId/posts",
        validateParamSchema(object({
            projectId: string().required()
        })),
        validateBodySchema(object({
            name: string().required(),
            content: string().required()
        })),
        authenticateJWT, async (req, res) => {
        const { projectId } = req.params;
        const user = getUserFromHeader(req);

        const project = await getProjectById(projectId);

        if (!project) {
            return RESPONSES.ENTITY_NOT_FOUND(res);
        }

        if (!isOwnerOrAdmin(user, project.ownerId)) {
            return RESPONSES.PERMISSION_DENIED(res);
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
            return RESPONSES.SAVE_FAILED(res);
        }
    });

    /**
     * get project post
     */
    app.get("/:projectId/posts/:postId",
        validateParamSchema(object({
            projectId: string().required(),
            postId: string().required()
        })),
        async (req, res) => {
        const { projectId, postId } = req.params;

        const post = await getProjectPostById(projectId, postId);

        if (!post) {
            return RESPONSES.ENTITY_NOT_FOUND(res);
        }

        res.status(200).json(post).send();
    });

    /**
     * Update post
     */
    app.post("/:projectId/posts/:postId",
        validateParamSchema(object({
            projectId: string().required(),
            postId: string().required()
        })),
        validateBodySchema(object({
            name: string().required(),
            content: string().required()
        })),
        authenticateJWT, async (req, res) => {
        const { projectId, postId } = req.params;
        const user = getUserFromHeader(req);

        const post = await getProjectPostById(projectId, postId);

        if (post === undefined) {
            return RESPONSES.ENTITY_NOT_FOUND(res);
        }

        const project = await getProjectById(projectId);

        if (!isOwnerOrAdmin(user, project.ownerId)) {
            return RESPONSES.PERMISSION_DENIED(res);
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
            return RESPONSES.SAVE_FAILED(res);
        }
    });

    app.delete("/:projectId/posts/:postId",
        validateParamSchema(object({
            projectId: string().required(),
            postId: string().required()
        })),
        authenticateJWT, async (req, res) => {
        const { projectId, postId } = req.params;
        const user = getUserFromHeader(req);

        const post = await getProjectPostById(projectId, postId);

        if (!post) {
            return RESPONSES.ENTITY_NOT_FOUND(res);
        }

        const project = await getProjectById(projectId);

        if (!isOwnerOrAdmin(user, project.ownerId)) {
            return RESPONSES.PERMISSION_DENIED(res);
        }


        try {
            await ProjectUpdate.deleteOne({"_id": postId, "projectId": projectId});
            res.status(200).send();
        }catch(e) {
            return RESPONSES.SAVE_FAILED(res);
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