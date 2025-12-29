const {getProjectById} = require("./projectsController");
const {ProjectRating} = require("./dbInit");
const {sendLog, LOG_TYPE} = require("../../../common/utils/loggingUtils");
const {RESPONSES} = require("../../../common/utils/responseUtils");
const {authenticateJWT, getUserFromHeader, isOwnerOrAdmin, validateParamSchema, validateBodySchema} = require("../../../common/utils/authenticationUtils");
const { object, string, number} = require("yup");
const {fetchFromService} = require("../../../common/utils/fetchUtils");



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
        try {
            return res.status(200).json(await Promise.all(projectRatings.map(async (it)=> await fillOutProjectRatingViewModel(it)))).send();

        }catch(e) {
            return RESPONSES.ENTITY_NOT_FOUND(res);
        }


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
        try {
            res.status(200).json(await fillOutProjectRatingViewModel(rating)).send();
        }catch (e) {
            return RESPONSES.ENTITY_NOT_FOUND(res);
        }
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


async function fillOutProjectRatingViewModel(projectRating) {
    const user = await fetchFromService(
        `${process.env.USER_SERVICE_URL}/${projectRating.userId}`
    );

    if (!user) {
        throw Error("user not found");
    }

    return {
        ...projectRating._doc,
        author: user,
    }
}

module.exports = { useProjectRatingController }