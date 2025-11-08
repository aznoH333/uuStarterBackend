
const {Project} = require("./dbInit");
const {sendLog, LOG_TYPE} = require("../../../common/utils/loggingUtils");
const {ProjectEntity} = require("../../../common/entities/projectEntity");
const {authenticateJWT, getUserFromHeader} = require("../../../common/utils/authenticationUtils");

function useProjectsController(app) {
    // get all projects
    app.get("/", async (req, res) => {
        // TODO : filtering
        const projects = await Project.find();
        res.status(200).json(projects);
    });

    app.get("/:projectId", async (req, res) => {
        const { projectId } = req.params;

        try {
            const project = await Project.findById(projectId);
            res.status(200).json(project);

        }catch (e) {
            res.status(400);
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
    app.post("/", authenticateJWT, async (req, res) => {
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
            res.status(400).send();

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
    app.post("/:projectId", async (req, res)=> {
        const { projectId } = req.params;

        try {
            const project = await Project.findById(projectId);

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
            sendLog("Failed to find project : " + projectId + "\n Failed with error : " + e, LOG_TYPE.ERROR);
            res.status(400).send();
        }
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

module.exports = { useProjectsController, getProjectById };