const {getProjectById} = require("./projectsController");
const {ProjectRating} = require("./dbInit");
const {sendLog, LOG_TYPE} = require("../../../common/utils/loggingUtils");
const {RESPONSES} = require("../../../common/utils/responseUtils");
const {authenticateJWT, getUserFromHeader, isOwnerOrAdmin, validateParamSchema, validateBodySchema} = require("../../../common/utils/authenticationUtils");
const { object, string, number, bool, date} = require("yup");



function useProjectRatingController(app) {
    /**
     * Get all project ratings associated with project
     */
    app.get("/:projectId/ratings",
        validateParamSchema(object({
            projectId: string().required()
        }))
        , async (req, res) => {
        const { projectId } = req.params;

        const project = await getProjectById(projectId);


        if (!project) {
            return RESPONSES.ENTITY_NOT_FOUND(res);
        }

        const projectRatings = await ProjectRating.find({ "projectId": projectId});


        return res.status(200).json(projectRatings).send();

    });

    /**
     * Add a new project rating
     * @param value : Number,
     */
    app.post(
        "/:projectId/ratings",
        validateParamSchema(object({
            projectId: string().required()
        })),
        validateBodySchema(object({
            value: number().min(0).max(5).required(),
        })),
        authenticateJWT, async (req, res) => {
        const { projectId } = req.params;
        const user = getUserFromHeader(req);

        const project = await getProjectById(projectId);

        if (!project) {
            return RESPONSES.ENTITY_NOT_FOUND(res);
        }

        try {
            const rating = new ProjectRating({
                projectId,
                userId: user.userId,
                value: req.body.value,
                creationDate: new Date(),
            });

            await rating.save();

            sendLog("Created new project rating : " + rating, LOG_TYPE.INFO);

            res.status(200).send();
        }catch(e) {
            sendLog("Failed to create project rating : " + req.body, LOG_TYPE.ERROR);
            return RESPONSES.SAVE_FAILED(res);
        }
    });

    /**
     * get project rating
     */
    app.get("/:projectId/ratings/:ratingId",
        validateParamSchema(object({
            projectId: string().required(),
            ratingId: string().required(),
        })),
        async (req, res) => {
        const { projectId, ratingId } = req.params;

        const rating = await getProjectRatingById(projectId, ratingId);

        if (!rating) {
            return RESPONSES.ENTITY_NOT_FOUND(res);
        }

        res.status(200).json(rating).send();
    });

    app.post("/:projectId/ratings/:ratingId",
        validateParamSchema(object({
            projectId: string().required(),
            ratingId: string().required(),
        })),
        validateBodySchema(object({
            value: number().min(0).max(5).required(),
        })),
        authenticateJWT,
        async (req, res) => {
        const { projectId, ratingId } = req.params;
        const user = getUserFromHeader(req);


        const rating = await getProjectRatingById(projectId, ratingId);

        if (rating === undefined) {
            return RESPONSES.ENTITY_NOT_FOUND(res);
        }

        if (!isOwnerOrAdmin(user, rating.userId)) {
            return RESPONSES.PERMISSION_DENIED(res);
        }

        try {
            rating.value = req.body.value;

            await rating.save();

            sendLog("Updated rating " + rating, LOG_TYPE.INFO);

            res.status(200).send();
        }catch(e) {
            sendLog("Failed to update rating " + e, LOG_TYPE.ERROR);
            return RESPONSES.SAVE_FAILED(res);
        }
    });

    app.delete("/:projectId/ratings/:ratingId",
        validateParamSchema(object({
            projectId: string().required(),
            ratingId: string().required(),
        })),
        authenticateJWT, async (req, res) => {
        const { projectId, ratingId } = req.params;
        const user = getUserFromHeader(req);

        const rating = await getProjectRatingById(projectId, ratingId);

        if (!rating) {
            return RESPONSES.ENTITY_NOT_FOUND(res);
        }

        if (!isOwnerOrAdmin(user, rating.userId)) {
            return RESPONSES.PERMISSION_DENIED(res);
        }

        try {
            await ProjectRating.deleteOne({"_id": ratingId, "projectId": projectId});
            res.status(200).send();
        }catch(e) {
            return RESPONSES.SAVE_FAILED(res);
        }
    });
}

/**
 * @param projectId : String
 * @param projectRatingId : String
 * @returns {Promise<undefined|ProjectRating>}
 */
async function getProjectRatingById(projectId, projectRatingId) {
    const project = getProjectById(projectId);

    if (!project) {
        return undefined;
    }

    try {
        return await ProjectRating.findOne({"_id": projectRatingId, "projectId": projectId});
    }catch (e) {
        return undefined;
    }
}


module.exports = { useProjectRatingController }