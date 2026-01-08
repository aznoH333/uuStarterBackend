const {Project} = require("./dbInit");
const {sendLog, LOG_TYPE} = require("../../../common/utils/loggingUtils");
const {ProjectEntity, PROJECT_STATUS} = require("../../../common/entities/projectEntity");
const {authenticateJWT, getUserFromHeader, USER_ROLES, isOwnerOrAdmin, validateParamSchema, validateBodySchema,
    validateQuerySchema
} = require("../../../common/utils/authenticationUtils");
const {RESPONSES} = require("../../../common/utils/responseUtils");
const { object, string, number, bool, date} = require("yup");
const {fetchFromService} = require("../../../common/utils/fetchUtils");




function useProjectsController(app) {

    // get all projects
    app.get("/",
        validateQuerySchema(object({
            title: string(),
            categoryId: string(),
            showOnlyApproved: bool()
        })),
        async (req, res) => {


            const searchQuery = {};

            // hack to make body optional
            if (req.query) {
                if (req.query.title !== undefined) {
                    searchQuery["name"] = { $regex: req.query.title, $options: 'i' };
                }


                if (req.query.categoryId !== undefined) {
                    searchQuery["categoryId"] = req.query.categoryId;
                }

                if (req.query.showOnlyApproved) {
                    searchQuery["status"] = PROJECT_STATUS.APPROVED
                }
            }

            const projects = await Project.find(searchQuery);
            try {
            const projectsWithAdditionalData = await lookupAdditionalProjectFields(projects)
            return res.status(200).json(projectsWithAdditionalData);
            } catch (e) {
                return res.status(500).send();
            }
    });

    app.get("/:projectId",
        validateParamSchema(object({
            projectId: string().required()
        })),

        async (req, res) => {
        const { projectId } = req.params;




        try {
            const project = await Project.findById(projectId);

            const lookedUpProject = (await lookupAdditionalProjectFields([project]))[0];

            res.status(200).json(lookedUpProject);

        }catch (e) {
            return RESPONSES.ENTITY_NOT_FOUND(res);
        }
    });


    /**
     * Creates a new project
     * @param name : String
     * @param description : String
     * @param goalAmount : Number - number in $?
     * @param deadLine : Date
     * @param categoryId : String | undefined - category id (optional)
     * @returns {ProjectEntity}
     */
    app.post("/",
        authenticateJWT,
        validateBodySchema(object({
            name: string().required(),
            description: string().required(),
            goalAmount: number().required(),
            deadLine: date().required(),
            categoryId: string(),
        })),
        async (req, res) => {
        const user = getUserFromHeader(req);
        const project = ProjectEntity.createNew(
            req.body.name,
            req.body.description,
            user.userId,
            req.body.goalAmount,
            req.body.deadLine,
            req.body.categoryId,
        );

        try {
            const newProject = new Project({...project});
            await newProject.save();
            sendLog("Created new project : " + newProject._id.toString(), LOG_TYPE.INFO);
            res.status(200).send();
        }catch (e) {
            sendLog("Failed to create a project : " + project + "\n Failed with error : " + e, LOG_TYPE.ERROR);
            return RESPONSES.SAVE_FAILED(res);

        }
    });

    /**
     * Updates existing project
     * @param name : String
     * @param description : String
     * @param goalAmount : Number - number in $?
     * @param deadLine : Date
     * @param categoryId : String | undefined - category id (optional)
     * @param status : String - supported values ["PendingApproval", "Approved", "Rejected", "Closed"]
     */
    app.post("/:projectId",
        validateParamSchema(object({
            projectId: string().required()
        })),
        validateBodySchema(object({
            name: string().required(),
            description: string().required(),
            goalAmount: number().required(),
            deadLine: date().required(),
            categoryId: string(),
            status: string().oneOf(Object.values(PROJECT_STATUS)).required()
        }))

        , authenticateJWT, async (req, res)=> {
        const { projectId } = req.params;
        const user = getUserFromHeader(req);

        try {
            const project = await Project.findById(projectId);


            if (!isOwnerOrAdmin(user, project.ownerId)) {
                return RESPONSES.PERMISSION_DENIED(res, { reason: "insufficient permisions for user", user: user});
            }

            if (project.status !== req.body.status && user.role !== USER_ROLES.ADMIN && req.body.status !== "Closed") {
                return RESPONSES.PERMISSION_DENIED(res, "Admin account required to change project state")
            }

            project.name = req.body.name;
            project.description = req.body.description;
            project.goalAmount = req.body.goalAmount;
            project.deadLine = req.body.deadLine;
            project.lastUpdatedDate = new Date();
            project.categoryId = req.body.categoryId;
            project.status = req.body.status;


            await project.save();
            sendLog("Updated project : " + project._id.toString(), LOG_TYPE.INFO);
            res.status(200).send();
        }catch (e) {
            sendLog("Failed to save project : " + projectId + "\n Failed with error : " + e, LOG_TYPE.ERROR);
            return RESPONSES.SAVE_FAILED(res);
        }
    });

    /**
     * "Deletes" project (sets status to "CLOSED")
     * @param projectId : String
     */
    app.delete(
        "/:projectId",
        authenticateJWT,
        validateParamSchema(object({
            projectId: string().required()
        })),
        async (req, res) => {
        const { projectId } = req.params;
        const user = getUserFromHeader(req);

        try {
            if (!isOwnerOrAdmin(user, project.ownerId)) {
                return RESPONSES.PERMISSION_DENIED(res, { reason: "insufficient permisions for user", user: user});
            }
            const project = await Project.findByIdAndDelete(projectId);
            project.status = "CLOSED"
            project.save()
            sendLog("Deleted project : " + project._id.toString(), LOG_TYPE.INFO);
            res.status(200).json(project);

        }catch (e) {
            sendLog("Failed to delete a project : " + projectId + "\n Failed with error : " + e, LOG_TYPE.ERROR);
            return RESPONSES.ENTITY_NOT_FOUND(res);
        }
    });

    // get all projects where user is owner
    app.get("/my-projects/all",
        authenticateJWT,
        validateQuerySchema(object({
            title: string(),
            categoryId: string(),
            showOnlyApproved: bool()
        }))
        , async (req, res) => {
        console.log(req.query);

        const user = getUserFromHeader(req);

        const searchQuery = {
            ownerId: user.userId
        };
        // hack to make params optional
        if (req.query) {
            if (req.query.title !== undefined) {
                searchQuery["name"] = { $regex: req.query.title, $options: 'i' };
            }


            if (req.query.categoryId !== undefined) {
                searchQuery["categoryId"] = req.query.categoryId;
            }

            if (req.query.showOnlyApproved) {
                searchQuery["status"] = PROJECT_STATUS.APPROVED
            }
        }


        const projects = await Project.find(searchQuery);
        res.status(200).json(await lookupAdditionalProjectFields(projects));
    });

}

/**
 * Find project
 * @param projectId
 * @returns {Promise<undefined|Project>}
 */
async function getProjectById(projectId) {
    try {
        return await Project.findById(projectId);
    }catch (e) {
        return undefined;
    }
}


async function lookupAdditionalProjectFields(projects) {
    const ids = projects.map((it)=>it._id.toString());

    const fetch = (await import('node-fetch')).default; // This is utter dogshit. Why have an import syntax that works only for some files?


    // TODO : refactor this to look like the other viewModel functions.
    // fetch donations
    const response = await fetch(`${process.env.DONATIONS_SERVICE_URL}/summed/projects`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectIds: ids }),
    });


    if (!response.ok) {
        throw Error("failed to fetch donations");
    }




    const responseJson = await response.json();

    const output = [];




    for (const project of projects) {


        const value = responseJson.find((it)=>it._id === project._id.toString());

        // fetch category
        const category = await fetchFromService(`${process.env.CATEGORY_SERVICE_URL}/${project.categoryId}`);

        output.push({
            ...project._doc,
            categoryName: category ? category.name : undefined, // This makes me appreciate typescript.
            currentAmount: (value ? value.currentValue : 0)
        })
    }

    return output;
}


module.exports = { useProjectsController, getProjectById };