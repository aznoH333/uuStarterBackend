const {Category} = require("./dbInit");
const {sendLog, LOG_TYPE} = require("../../../common/utils/loggingUtils");
const {
    authenticateJWT,
    getUserFromHeader,
    isOwnerOrAdmin, validateParamSchema, validateBodySchema
} = require("../../../common/utils/authenticationUtils");
const {RESPONSES} = require("../../../common/utils/responseUtils");
const { object, string, number} = require("yup");


function useCategoriesController(app) {
    // get all categories
    app.get("/", async (req, res) => {
        const categories = await Category.find();
        res.status(200).json(categories);
    });

    app.get("/:categoryId",
        validateParamSchema(object({
            categoryId: string().required()
        })), async (req, res) => {
        const {categoryId} = req.params;

        try {
            const category = await Category.findById(categoryId);
            res.status(200).json(category);

        } catch (e) {
            return RESPONSES.ENTITY_NOT_FOUND(res);
        }
    });


    /**
     * Creates a new category
     * @param name : String
     * @returns {CategoryEntity}
     */
    app.post("/",
        validateBodySchema(object({
            name: string().required()
        })),
        authenticateJWT, async (req, res) => {
        const user = getUserFromHeader(req);
        const category = {
            name: req.body.name
        }
        try {
            // if (!isOwnerOrAdmin(user, project.ownerId)) {
            //     return RESPONSES.PERMISSION_DENIED(res);
            // }

            const exists = await Category.findOne(category);
            if (exists) return res.status(409).json({ error: "Category already exists" });

            const newCategory = new Category({...category});
            await newCategory.save();
            sendLog("Created new category : " + newCategory._id.toString(), LOG_TYPE.INFO);
            res.status(200).send();
        } catch (e) {
            sendLog("Failed to create a category : " + category + "\n Failed with error : " + e, LOG_TYPE.ERROR);
            return RESPONSES.SAVE_FAILED(res);

        }
    });

    /**
     * Updates existing category
     * @param name : String
     */
    app.post("/:categoryId",
        validateParamSchema(object({
            categoryId: string().required()
        })),
        validateBodySchema(object({
            name: string().required()
        })),
        authenticateJWT, async (req, res) => {
        const {categoryId} = req.params;
        const user = getUserFromHeader(req);

        try {
            const category = await Category.findById(categoryId);

            if (!isOwnerOrAdmin(user)) {
                return RESPONSES.PERMISSION_DENIED(res);
            }
            category.name = req.body.name;

            await category.save();
            sendLog("Updated category : " + category._id.toString(), LOG_TYPE.INFO);
            res.status(200).send();
        } catch (e) {
            sendLog("Failed to save category : " + categoryId + "\n Failed with error : " + e, LOG_TYPE.ERROR);
            return RESPONSES.SAVE_FAILED(res);
        }
    });

    /**
     * Deletes category
     * @param categoryId : String
     */
    app.delete("/:categoryId",
        validateParamSchema(object({
            categoryId: string().required()
        })),
        async (req, res) => {
        const {categoryId} = req.params;
        const user = getUserFromHeader(req);

        if (!isOwnerOrAdmin(user)) {
            return RESPONSES.PERMISSION_DENIED(res);
        }
        //TODO: Get projects by category or just get projects
       /* const projectsResponse = await axios.get(`${PROJECTS_SERVICE_URL}/by-category/${categoryId}`);
        const projects = projectsResponse.data || [];
        if (projects.find((p) => p.categoryId)) {
            sendLog("Failed to delete a category : " + categoryId + "\n Category is still referenced in project");
            return RESPONSES.ENTITY_CONFLICT(res);
        }*/

        try {
            const category = await Category.findByIdAndDelete(categoryId);
            sendLog("Deleted category : " + category._id.toString(), LOG_TYPE.INFO);
            res.status(200).json(category);

        } catch (e) {
            sendLog("Failed to delete a category : " + categoryId + "\n Failed with error : " + e, LOG_TYPE.ERROR);
            return RESPONSES.ENTITY_NOT_FOUND(res);
        }
    });

}

/**
 * Find category
 * @param categoryId
 * @returns {Promise<undefined|Category>}
 */
async function getCategoryById(categoryId) {
    try {
        return await Category.findById(categoryId);
    } catch (e) {
        return undefined;
    }
}

module.exports = {useCategoriesController, getCategoryById};