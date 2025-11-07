const {getProjectById} = require("./projectsController");
const {ProjectRating} = require("./dbInit");
const {sendLog, LOG_TYPE} = require("../../../common/utils/loggingUtils");


/*
const ProjectRatingSchema = new mongoose.Schema({
    userId: {type: String, required: true},
    projectId: {type: String, required: true},
    value: {type: Number, required: true},
    creationDate: {type: Date, required: true},
});
 */

function useProjectRatingController(app) {
    /**
     * Get all project ratings associated with project
     */
    app.get("/:projectId/ratings", async (req, res) => {
        const { projectId } = req.params;

        const project = await getProjectById(projectId);


        if (!project) {
            res.status(400).send();
        }

        const projectRatings = await ProjectRating.find({ "projectId": projectId});


        return res.status(200).json(projectRatings).send();

    });

    /**
     * Add a new project rating
     * @param userId : String,
     * @param value : Number,
     */
    app.post("/:projectId/ratings", async (req, res) => {
        const { projectId } = req.params;

        const project = await getProjectById(projectId);

        if (!project) {
            res.status(400).send();
        }

        try {
            const rating = new ProjectRating({
                projectId,
                userId: req.body.userId,
                value: req.body.value,
                creationDate: new Date(),
            });

            await rating.save();

            sendLog("Created new project rating : " + rating, LOG_TYPE.INFO);

            res.status(200).send();
        }catch(e) {
            sendLog("Failed to create project rating : " + req.body, LOG_TYPE.ERROR);
            res.status(400).send();
        }
    });

    /**
     * get project rating
     */
    app.get("/:projectId/ratings/:ratingId", async (req, res) => {
        const { projectId, ratingId } = req.params;

        const rating = await getProjectRatingById(projectId, postId);

        if (!rating) {
            res.status(400).send();
        }

        res.status(200).json(rating).send();
    });

    app.post("/:projectId/ratings/:ratingId", async (req, res) => {
        const { projectId, ratingId } = req.params;

        const rating = await getProjectRatingById(projectId, ratingId);

        if (rating === undefined) {
            res.status(400).send();
        }

        try {
            rating.value = req.body.value;

            await rating.save();

            sendLog("Updated rating " + rating, LOG_TYPE.INFO);

            res.status(200).send();
        }catch(e) {
            sendLog("Failed to update rating " + e, LOG_TYPE.ERROR);
            res.status(400).send();
        }
    });

    app.delete("/:projectId/ratings/:ratingId", async (req, res) => {
        const { projectId, ratingId } = req.params;

        const rating = await getProjectRatingById(projectId, ratingId);

        if (!rating) {
            res.status(400).send();
        }


        try {
            await ProjectRating.deleteOne({"_id": ratingId, "projectId": projectId});
            res.status(200).send();
        }catch(e) {
            res.status(400).send();
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